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
import { registerAnalysisRoutes } from './controllers/index.js';
import { registerSmartRateLimit } from './middleware/index.js';

/**
 * Cria e configura a instância do Fastify
 * Exportado para uso em serverless (Vercel)
 */
export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
      // SEGURANÇA: Não loga body das requisições (contém dados sensíveis)
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            // Não inclui body ou headers com dados sensíveis
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

  // SEGURANÇA: Helmet adiciona headers de segurança HTTP
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Permite apenas o domínio do frontend
        connectSrc: ["'self'", config.cors.origin],
      },
    },
    // Habilita proteções contra clickjacking, XSS, etc.
    crossOriginEmbedderPolicy: false, // Desabilita para permitir imagens externas
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
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: false, // Não precisamos de cookies/auth
    maxAge: 86400, // Cache do preflight por 24h
  });

  console.log(`[CORS] Origens permitidas:`, corsOrigin);

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
  await registerAnalysisRoutes(app);

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

  // Handler para erros não tratados
  app.setErrorHandler((error, request, reply) => {
    // SEGURANÇA: Log interno sem expor ao cliente
    app.log.error(error, `Error processing ${request.method} ${request.url}`);

    // Erros conhecidos do Fastify
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados da requisição inválidos',
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

    // Erro genérico
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
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

    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Cancelaí Backend v${config.version}                         ║
║                                                           ║
║   Servidor rodando em:                                    ║
║   http://${config.server.host}:${config.server.port}                              ║
║                                                           ║
║   Endpoints:                                              ║
║   POST /api/analyze  - Analisa extratos                   ║
║   GET  /api/health   - Health check                       ║
║   GET  /api/info     - Informações da API                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nEncerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nEncerrando servidor...');
  process.exit(0);
});

// Inicia o servidor
start();
