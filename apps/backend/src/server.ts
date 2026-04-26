/**
 * Servidor Fastify - Cancelaí Backend
 *
 * Ponto de entrada principal do servidor.
 * Configura todos os plugins e middlewares de segurança.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';

import { config } from './config/index.js';
import { registerAnalysisRoutes, getSSEManager, registerOpenFinanceRoutes } from './controllers/index.js';
import { registerSmartRateLimit } from './middleware/index.js';

/**
 * Cria e configura a instância do Fastify
 * Exportado para uso em serverless (Railway)
 */
export async function buildServer() {
  const isProd = process.env['NODE_ENV'] === 'production';

  const app = Fastify({
    // SEGURANÇA: confiar em apenas 1 hop de proxy (Railway/Cloudflare).
    // trustProxy: true aceitaria qualquer X-Forwarded-For e abriria spoofing.
    trustProxy: 1,
    logger: {
      level: isProd ? 'info' : 'debug',
      // Dev: pino-pretty colorido. Prod: JSON puro (parseável por log aggregators)
      ...(!isProd && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
      // SEGURANÇA: Redige headers sensíveis automaticamente
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
        ],
        censor: '[REDACTED]',
      },
      // SEGURANÇA: Não loga body das requisições (contém dados sensíveis)
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
    },
    // SEGURANÇA: Limita tamanho do body
    bodyLimit: config.server.maxFileSize * 2, // Margem para overhead do multipart
  });

  // ============================================================
  // PLUGINS DE SEGURANÇA
  // ============================================================

  // SEGURANÇA: Helmet adiciona headers de segurança HTTP.
  // useDefaults: true preserva as directives padrão (base-uri, form-action,
  // frame-ancestors, object-src, etc.) e apenas mescla nossos overrides.
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", config.cors.origin],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // SEGURANÇA: CORS configurável por ambiente
  // Em desenvolvimento: aceita localhost em várias portas
  // Em produção: restrito ao domínio configurado
  const corsOrigin = process.env['NODE_ENV'] === 'production'
    ? config.cors.origin
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        config.cors.origin,
      ];

  await app.register(cors, {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false, // Não precisamos de cookies/auth
    maxAge: 86400, // Cache do preflight por 24h
  });

  app.log.info({ corsOrigin }, '[CORS] Origens permitidas');

  // SEGURANÇA: Rate limiting inteligente
  // Usa implementação customizada que considera:
  // - IP do cliente
  // - Hash do User-Agent
  // - Tamanho acumulado de uploads
  registerSmartRateLimit(app);

  // SEGURANÇA: Configuração do multipart com limites rígidos
  await app.register(multipart, {
    limits: {
      fileSize: config.server.maxFileSize,
      files: config.server.maxFiles,
      fieldSize: 1024, // 1KB para campos de texto (não precisamos de mais)
      fields: 10, // Máximo de campos no form
    },
    // SEGURANÇA: Não salva arquivos em disco, processa em memória
    attachFieldsToBody: false,
  });

  // ============================================================
  // ROTAS
  // ============================================================

  // Registra rotas de análise
  registerAnalysisRoutes(app);

  // Registra rotas de Open Finance
  registerOpenFinanceRoutes(app);

  // Rota raiz
  app.get('/', async (_request, reply) => {
    return reply.send({
      name: 'Cancelaí API',
      version: config.version,
      status: 'running',
      docs: '/api/info',
    });
  });

  // ============================================================
  // ERROR HANDLERS
  // ============================================================

  // Handler centralizado de erros — NUNCA expõe stack traces em produção
  app.setErrorHandler((error, request, reply) => {
    // SEGURANÇA: Log completo internamente (com stack trace via Pino)
    app.log.error(error, `Error processing ${request.method} ${request.url}`);

    // Erros de validação do Fastify (JSON Schema)
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados da requisição inválidos',
          ...(!isProd && { details: error.validation }),
        },
      });
    }

    // Erro de payload muito grande
    if (error.statusCode === 413) {
      return reply.status(413).send({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `Arquivo muito grande. Máximo: ${
            config.server.maxFileSize / (1024 * 1024)
          }MB`,
        },
      });
    }

    // Erro genérico — NUNCA stack traces em produção
    return reply.status(error.statusCode ?? 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProd ? 'Erro interno do servidor' : error.message,
        ...(!isProd && { stack: error.stack }),
      },
    });
  });

  // Handler para rotas não encontradas
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint não encontrado',
      },
    });
  });

  return app;
}

/**
 * Inicia o servidor
 */
async function start() {
  try {
    const app = await buildServer();

    // Graceful shutdown — drena conexões antes de encerrar
    const shutdown = async (signal: string) => {
      app.log.info({ signal }, 'Shutdown signal received, draining connections...');

      // Notifica todas as conexões SSE antes de fechar
      const manager = getSSEManager();
      if (manager) {
        manager.shutdownAll();
      }

      const forceExit = setTimeout(() => {
        app.log.error('Graceful shutdown timed out (10s), forcing exit');
        process.exit(1);
      }, 10_000);

      try {
        await app.close();
        clearTimeout(forceExit);
        app.log.info('Server shut down gracefully');
        process.exit(0);
      } catch (err: unknown) {
        clearTimeout(forceExit);
        app.log.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => { void shutdown('SIGINT'); });
    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });

    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    app.log.info(
      `Cancelai Backend v${config.version} running on http://${config.server.host}:${config.server.port}`
    );
  } catch (error) {
    // Antes do logger estar disponível: stderr direto é o último recurso
    process.stderr.write(`Erro ao iniciar servidor: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exit(1);
  }
}

// Inicia o servidor
void start();
