/**
 * Serverless Entrypoint - LEGADO (nao usado no Railway)
 *
 * Este arquivo era usado para rodar Fastify como Serverless Function.
 * No Railway, o backend roda como processo Node.js persistente via server.ts.
 * Mantido para referencia — nao e executado em producao.
 *
 * IMPORTANTE: Nao altera nenhuma logica do servidor original.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildServer } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

// Cache da instância do Fastify para reutilização entre invocações
let app: FastifyInstance | null = null;

/**
 * Inicializa o app Fastify uma única vez (cold start)
 */
async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildServer();
    // Prepara o Fastify sem iniciar o listener HTTP
    await app.ready();
  }
  return app;
}

/**
 * Handler principal para Vercel Serverless Functions
 * Encaminha todas as requisições para o Fastify
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const fastify = await getApp();

    // Converte a requisição Vercel para formato compatível com Fastify
    const response = await fastify.inject({
      method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
      url: req.url || '/',
      headers: req.headers as Record<string, string>,
      payload: req.body,
    });

    // Copia headers da resposta do Fastify
    const headers = response.headers;
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        res.setHeader(key, value as string);
      }
    }

    // Envia status e body
    res.status(response.statusCode).send(response.body);
  } catch (error) {
    console.error('[Serverless] Erro:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVERLESS_ERROR',
        message: 'Erro interno no processamento',
      },
    });
  }
}
