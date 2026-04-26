/**
 * Rate Limit Inteligente
 *
 * Implementa rate limiting baseado em múltiplos fatores:
 * 1. IP do cliente
 * 2. Hash do User-Agent (para identificar automações)
 * 3. Tamanho acumulado de upload por janela de tempo
 *
 * COMPORTAMENTO POR AMBIENTE:
 * - DESENVOLVIMENTO (NODE_ENV !== 'production'):
 *   Rate limiting DESATIVADO para não bloquear testes
 * - PRODUÇÃO (NODE_ENV === 'production'):
 *   Rate limiting ATIVO com proteção completa
 *
 * DECISÕES DE DESIGN:
 * - Window sliding de 1 minuto
 * - Limites progressivos (warning → block)
 * - IPs suspeitos (muitos requests) são bloqueados mais rápido
 * - Upload size é contabilizado para prevenir abuse por grandes arquivos
 */

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { createHash } from 'crypto';

/**
 * Verifica se estamos em ambiente de produção
 * IMPORTANTE: Apenas em produção o rate limiting é aplicado
 */
function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Registro de uso de um cliente
 */
interface ClientUsage {
  requestCount: number;
  totalUploadBytes: number;
  firstRequestAt: number;
  lastRequestAt: number;
  blocked: boolean;
  blockReason?: string;
}

/**
 * Store em memória para rate limiting
 * Em produção, considerar usar Redis para compartilhar entre instâncias
 */
const usageStore = new Map<string, ClientUsage>();

/**
 * Limites por ambiente
 *
 * PRODUÇÃO: Limites restritivos para proteger o serviço
 * DESENVOLVIMENTO: Limites relaxados para não atrapalhar testes
 */
const LIMITS_PRODUCTION = {
  // Requisições por janela de tempo (1 minuto) — default para rotas sem config específica
  maxRequestsPerWindow: parseInt(process.env['RATE_LIMIT_MAX'] ?? '15', 10),

  // Tamanho máximo de upload acumulado por janela (50MB)
  maxUploadBytesPerWindow: 50 * 1024 * 1024,

  // Janela de tempo em ms (1 minuto)
  windowMs: 60 * 1000,

  // Tempo de bloqueio em ms (5 minutos)
  blockDurationMs: 5 * 60 * 1000,

  // Limiar para considerar "suspeito" (requests por segundo)
  suspiciousThreshold: 10,
} as const;

/**
 * Limites granulares por grupo de rota.
 * Em produção valem os números abaixo. Em desenvolvimento são multiplicados
 * por DEV_MULTIPLIER para permitir testes sem desligar a proteção por completo.
 */
const ROUTE_LIMITS_PROD: Record<string, number> = {
  'POST:/api/analyze': 10,
  'GET:/api/analyze/stream': 20,
  'GET:/api/health': 60,
  'GET:/api/info': 60,
  'default': 30,
};

const DEV_MULTIPLIER = parseInt(process.env['RATE_LIMIT_DEV_MULTIPLIER'] ?? '10', 10);

const ROUTE_LIMITS: Record<string, number> = isProduction()
  ? ROUTE_LIMITS_PROD
  : Object.fromEntries(
      Object.entries(ROUTE_LIMITS_PROD).map(([k, v]) => [k, v * DEV_MULTIPLIER]),
    );

/**
 * Determina o limite de rate para a rota atual
 */
function getRouteLimitKey(method: string, url: string): string {
  if (method === 'POST' && url.startsWith('/api/analyze')) return 'POST:/api/analyze';
  if (method === 'GET' && url.includes('/stream')) return 'GET:/api/analyze/stream';
  if (method === 'GET' && url === '/api/health') return 'GET:/api/health';
  if (method === 'GET' && url === '/api/info') return 'GET:/api/info';
  return 'default';
}

function getRouteMaxRequests(method: string, url: string): number {
  const key = getRouteLimitKey(method, url);
  return ROUTE_LIMITS[key] ?? ROUTE_LIMITS['default']!;
}

const LIMITS_DEVELOPMENT = {
  // Em desenvolvimento: limites muito altos
  maxRequestsPerWindow: 1000,
  maxUploadBytesPerWindow: 500 * 1024 * 1024, // 500MB
  windowMs: 60 * 1000,
  blockDurationMs: 10 * 1000, // Apenas 10 segundos
  suspiciousThreshold: 1000, // Praticamente impossível atingir
} as const;

/**
 * Retorna os limites apropriados para o ambiente atual
 */
function getLimits() {
  return isProduction() ? LIMITS_PRODUCTION : LIMITS_DEVELOPMENT;
}

/**
 * Gera uma chave única para o cliente
 * Combina IP + hash do User-Agent para identificação mais precisa
 */
function getClientKey(request: FastifyRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers['user-agent'] ?? 'unknown';

  // Hash do User-Agent para privacidade
  const uaHash = createHash('md5')
    .update(userAgent)
    .digest('hex')
    .substring(0, 8);

  return `${ip}:${uaHash}`;
}

/**
 * Extrai o IP real do cliente.
 * Confia em request.ip do Fastify, que respeita o trustProxy configurado
 * no server.ts. Não lemos headers x-forwarded-for/x-real-ip diretamente
 * para evitar spoofing por clientes não atrás do proxy esperado.
 */
function getClientIP(request: FastifyRequest): string {
  return request.ip ?? 'unknown';
}

/**
 * Limpa registros expirados do store
 */
function cleanupExpiredRecords(): void {
  const limits = getLimits();
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, usage] of usageStore.entries()) {
    // Remove registros que expiraram a janela + tempo de bloqueio
    if (now - usage.lastRequestAt > limits.windowMs + limits.blockDurationMs) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    usageStore.delete(key);
  }
}

// Limpa registros expirados a cada minuto (unref para não bloquear graceful shutdown)
const cleanupTimer = setInterval(cleanupExpiredRecords, 60 * 1000);
cleanupTimer.unref();

/**
 * Verifica se o cliente está dentro dos limites
 *
 * IMPORTANTE: Em desenvolvimento, esta função é muito permissiva
 */
function checkRateLimit(
  clientKey: string,
  uploadSize: number = 0
): { allowed: boolean; reason?: string; retryAfter?: number; currentCount?: number } {
  const limits = getLimits();
  const now = Date.now();

  // Busca ou cria registro do cliente
  let usage = usageStore.get(clientKey);

  if (!usage) {
    usage = {
      requestCount: 0,
      totalUploadBytes: 0,
      firstRequestAt: now,
      lastRequestAt: now,
      blocked: false,
    };
    usageStore.set(clientKey, usage);
  }

  // Verifica se está bloqueado
  if (usage.blocked) {
    const blockEndTime = usage.lastRequestAt + limits.blockDurationMs;
    if (now < blockEndTime) {
      return {
        allowed: false,
        reason: usage.blockReason ?? 'Muitas requisições. Aguarde.',
        retryAfter: Math.ceil((blockEndTime - now) / 1000),
      };
    }
    // Tempo de bloqueio passou, reseta
    usage.blocked = false;
    delete usage.blockReason;
  }

  // Verifica se a janela expirou e reseta contadores
  if (now - usage.firstRequestAt > limits.windowMs) {
    usage.requestCount = 0;
    usage.totalUploadBytes = 0;
    usage.firstRequestAt = now;
  }

  // Incrementa contadores
  usage.requestCount++;
  usage.totalUploadBytes += uploadSize;
  usage.lastRequestAt = now;

  // Verifica limite de requisições
  if (usage.requestCount > limits.maxRequestsPerWindow) {
    usage.blocked = true;
    usage.blockReason = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
    return {
      allowed: false,
      reason: usage.blockReason,
      retryAfter: Math.ceil(limits.blockDurationMs / 1000),
    };
  }

  // Verifica limite de upload
  if (usage.totalUploadBytes > limits.maxUploadBytesPerWindow) {
    usage.blocked = true;
    usage.blockReason = 'Limite de upload excedido. Tente novamente em alguns minutos.';
    return {
      allowed: false,
      reason: usage.blockReason,
      retryAfter: Math.ceil(limits.blockDurationMs / 1000),
    };
  }

  // Verifica comportamento suspeito (muitas requests muito rápido)
  // NOTA: Em desenvolvimento, o threshold é muito alto (1000 req/s)
  const elapsedSeconds = Math.max((now - usage.firstRequestAt) / 1000, 0.1); // Mínimo 0.1s para evitar divisão por zero
  const requestsPerSecond = usage.requestCount / elapsedSeconds;

  if (requestsPerSecond > limits.suspiciousThreshold) {
    usage.blocked = true;
    usage.blockReason = 'Taxa de requisições muito alta. Aguarde antes de tentar novamente.';
    return {
      allowed: false,
      reason: usage.blockReason,
      retryAfter: Math.ceil(limits.blockDurationMs / 1000),
    };
  }

  return { allowed: true, currentCount: usage.requestCount };
}

/**
 * Hook de rate limiting para Fastify
 *
 * IMPORTANTE:
 * - Em DESENVOLVIMENTO: Rate limiting é DESATIVADO (bypass completo)
 * - Em PRODUÇÃO: Rate limiting é ATIVO com proteção completa
 */
export function smartRateLimitHook(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Rate limit ativo em todos os ambientes. Limites são mais frouxos
  // em dev (controlados por DEV_MULTIPLIER) mas nunca zerados, para
  // proteger ambientes de preview/staging acidentalmente expostos.
  const clientKey = getClientKey(request);

  // Estima tamanho do upload pelo Content-Length
  const contentLength = parseInt(request.headers['content-length'] ?? '0', 10);

  const routeMax = getRouteMaxRequests(request.method, request.url);
  const result = checkRateLimit(clientKey, contentLength);

  // Adiciona headers de rate limit na resposta (mesmo quando permitido)
  const remaining = Math.max(0, routeMax - (result.currentCount ?? 0));
  void reply
    .header('X-RateLimit-Limit', routeMax.toString())
    .header('X-RateLimit-Remaining', remaining.toString());

  if (!result.allowed) {
    // Log para monitoramento (sem dados sensíveis) — usa request.log para
    // herdar redact e correlation por requestId definidos em server.ts
    request.log.warn(
      { ip: clientKey.split(':')[0], reason: result.reason },
      '[RateLimit] Cliente bloqueado',
    );

    // Resposta com status HTTP 429 (Too Many Requests)
    void reply
      .code(429)
      .header('Retry-After', result.retryAfter?.toString() ?? '60')
      .header('X-RateLimit-Reset', result.retryAfter?.toString() ?? '60')
      .send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: result.reason ?? 'Muitas requisições. Tente novamente mais tarde.',
          details: {
            retryAfter: result.retryAfter,
          },
        },
      });

    // Importante: lançar erro para interromper o fluxo
    throw new Error('Rate limit exceeded');
  }
}

/**
 * Registra o hook de rate limit no Fastify
 *
 * O hook é registrado sempre, mas o bypass de desenvolvimento
 * é aplicado dentro do hook para manter a lógica centralizada
 */
export function registerSmartRateLimit(app: FastifyInstance): void {
  // Aplica rate limiting granular a TODAS as rotas /api/*
  app.addHook('preHandler', async (request, reply) => {
    // Só aplica em rotas /api (exclui rota raiz /)
    if (!request.url.startsWith('/api')) return;

    try {
      smartRateLimitHook(request, reply);
    } catch {
      // Erro já foi tratado e resposta enviada
      return;
    }
  });

  // Log informativo sobre o estado do rate limiting
  if (isProduction()) {
    app.log.info(
      {
        maxRequestsPerWindow: LIMITS_PRODUCTION.maxRequestsPerWindow,
        maxUploadMB: LIMITS_PRODUCTION.maxUploadBytesPerWindow / (1024 * 1024),
      },
      '[RateLimit] Rate limiting ATIVO (produção)',
    );
  } else {
    app.log.info(
      { devMultiplier: DEV_MULTIPLIER },
      '[RateLimit] Rate limiting ATIVO em modo desenvolvimento (limites multiplicados)',
    );
  }
}

/**
 * Retorna estatísticas do rate limiter (para debug/monitoramento)
 */
export function getRateLimitStats(): {
  activeClients: number;
  blockedClients: number;
  totalRequests: number;
  environment: 'production' | 'development';
  rateLimitActive: boolean;
} {
  let blockedClients = 0;
  let totalRequests = 0;

  for (const usage of usageStore.values()) {
    if (usage.blocked) blockedClients++;
    totalRequests += usage.requestCount;
  }

  return {
    activeClients: usageStore.size,
    blockedClients,
    totalRequests,
    environment: isProduction() ? 'production' : 'development',
    rateLimitActive: isProduction(),
  };
}

/**
 * Limpa todos os registros (útil para testes)
 * ATENÇÃO: Usar apenas em desenvolvimento/testes
 */
export function clearRateLimitStore(): void {
  if (!isProduction()) {
    usageStore.clear();
  }
}
