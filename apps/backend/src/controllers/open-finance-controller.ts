/**
 * Controller de Open Finance
 *
 * Expoe endpoints para conexao bancaria via Open Finance Brasil.
 *
 * DECISOES DE SEGURANCA:
 * 1. Nenhum dado bancario e persistido — tudo em memoria, efemero
 * 2. Connect token tem vida curta (definido pelo Pluggy)
 * 3. Transacoes passam pelo adapter e pipeline — nao sao retornadas cruas
 * 4. LGPD: dados sensiveis (CPF, conta) sao removidos no servico
 */

import { randomUUID } from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createLink,
  getAccounts,
  getTransactions,
  revokeConnection,
  isOpenFinanceConfigured,
} from '../services/open-finance.service.js';
import { adaptTransactions } from '../adapters/open-finance.adapter.js';
import { runPipelineFromTransactions } from '../pipeline/pipeline-orchestrator.js';
import { config } from '../config/index.js';
import type { ApiResponse } from '../types/index.js';

function generateJobId(): string {
  return `ofjob_${randomUUID()}`;
}

function generateRequestId(): string {
  return `ofreq_${randomUUID()}`;
}

/**
 * Job store para SSE streaming — compartilha padrao com analysis-controller
 */
interface PipelineJob {
  readonly generator: AsyncGenerator<import('../pipeline/pipeline-events.js').PipelineEvent>;
  readonly createdAt: number;
}

const jobs = new Map<string, PipelineJob>();
const JOB_TTL_MS = 60_000;

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(id);
      void job.generator.return(undefined as never);
    }
  }
}, 30_000);
cleanupInterval.unref();

/**
 * Registra rotas de Open Finance
 */
export function registerOpenFinanceRoutes(app: FastifyInstance): void {
  /**
   * POST /api/open-finance/link
   *
   * Cria um connect token para o widget Pluggy Connect.
   * O frontend usa este token para abrir o widget de conexao bancaria.
   */
  app.post('/api/open-finance/link', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isOpenFinanceConfigured()) {
      return reply.status(501).send({
        success: false,
        error: {
          code: 'OPEN_FINANCE_NOT_CONFIGURED',
          message: 'Open Finance nao esta configurado neste servidor',
        },
      } satisfies ApiResponse<never>);
    }

    try {
      const link = await createLink();
      return reply.status(200).send({
        success: true,
        data: { accessToken: link.accessToken },
      });
    } catch (error) {
      request.log.error({ err: error }, '[Open Finance] Erro ao criar link');
      return reply.status(502).send({
        success: false,
        error: {
          code: 'AGGREGATOR_ERROR',
          message: 'Erro ao conectar com o agregador bancario',
        },
      } satisfies ApiResponse<never>);
    }
  });

  /**
   * GET /api/open-finance/accounts/:itemId
   *
   * Lista contas de um item (conexao bancaria).
   */
  app.get<{ Params: { itemId: string } }>(
    '/api/open-finance/accounts/:itemId',
    {
      schema: {
        params: {
          type: 'object' as const,
          properties: { itemId: { type: 'string' as const } },
          required: ['itemId'] as const,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (!isOpenFinanceConfigured()) {
        return reply.status(501).send({
          success: false,
          error: {
            code: 'OPEN_FINANCE_NOT_CONFIGURED',
            message: 'Open Finance nao esta configurado neste servidor',
          },
        } satisfies ApiResponse<never>);
      }

      try {
        const accounts = await getAccounts(request.params.itemId);
        return reply.status(200).send({
          success: true,
          data: { accounts },
        });
      } catch (error) {
        request.log.error({ err: error }, '[Open Finance] Erro ao buscar contas');
        return reply.status(502).send({
          success: false,
          error: {
            code: 'AGGREGATOR_ERROR',
            message: 'Erro ao buscar contas bancarias',
          },
        } satisfies ApiResponse<never>);
      }
    },
  );

  /**
   * POST /api/open-finance/analyze
   *
   * Busca transacoes via Open Finance e cria job de pipeline.
   * Retorna jobId + streamUrl para consumo via SSE.
   *
   * Body: { accountId: string, dateFrom: string, dateTo: string, bankName?: string }
   */
  app.post('/api/open-finance/analyze', {
    schema: {
      body: {
        type: 'object' as const,
        properties: {
          accountId: { type: 'string' as const, minLength: 1, maxLength: 128 },
          dateFrom: { type: 'string' as const, format: 'date' as const },
          dateTo: { type: 'string' as const, format: 'date' as const },
          bankName: { type: 'string' as const, maxLength: 64 },
        },
        required: ['accountId', 'dateFrom', 'dateTo'] as const,
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!isOpenFinanceConfigured()) {
      return reply.status(501).send({
        success: false,
        error: {
          code: 'OPEN_FINANCE_NOT_CONFIGURED',
          message: 'Open Finance nao esta configurado neste servidor',
        },
      } satisfies ApiResponse<never>);
    }

    const body = request.body as {
      accountId?: string;
      dateFrom?: string;
      dateTo?: string;
      bankName?: string;
    } | null;

    if (!body?.accountId || !body.dateFrom || !body.dateTo) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'accountId, dateFrom e dateTo sao obrigatorios',
        },
      } satisfies ApiResponse<never>);
    }

    const fromDate = new Date(body.dateFrom);
    const toDate = new Date(body.dateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_DATE', message: 'dateFrom/dateTo invalidos' },
      } satisfies ApiResponse<never>);
    }

    if (fromDate >= toDate) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_RANGE', message: 'dateFrom deve ser anterior a dateTo' },
      } satisfies ApiResponse<never>);
    }

    const MAX_WINDOW_DAYS = 365;
    const windowDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (windowDays > MAX_WINDOW_DAYS) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'WINDOW_TOO_LARGE',
          message: `Janela maxima e de ${MAX_WINDOW_DAYS} dias`,
        },
      } satisfies ApiResponse<never>);
    }

    const requestId = generateRequestId();
    const bankName = body.bankName ?? 'open-finance';

    request.log.info({ requestId, accountId: body.accountId }, 'POST /api/open-finance/analyze');

    try {
      const dateRange = { from: fromDate, to: toDate };

      const aggregatorTransactions = await getTransactions(body.accountId, dateRange);

      if (aggregatorTransactions.length === 0) {
        return reply.status(200).send({
          success: true,
          data: {
            message: 'Nenhuma transacao encontrada no periodo selecionado',
            transactionCount: 0,
          },
        });
      }

      request.log.info(
        { requestId, count: aggregatorTransactions.length },
        'Transacoes obtidas do agregador',
      );

      // Adapta transacoes para formato do pipeline
      const transactions = adaptTransactions(aggregatorTransactions, bankName);

      // Cria job de pipeline
      const jobId = generateJobId();
      const generator = runPipelineFromTransactions(transactions, bankName, requestId);

      jobs.set(jobId, { generator, createdAt: Date.now() });

      request.log.info({ requestId, jobId, transactions: transactions.length }, 'Job criado');

      return reply.status(200).send({
        success: true,
        data: { jobId, streamUrl: `/api/open-finance/${jobId}/stream` },
      });
    } catch (error) {
      request.log.error({ requestId, err: error }, 'Erro no analyze Open Finance');
      return reply.status(502).send({
        success: false,
        error: {
          code: 'AGGREGATOR_ERROR',
          message: 'Erro ao obter transacoes do banco. Tente o upload manual de extrato.',
        },
      } satisfies ApiResponse<never>);
    }
  });

  /**
   * GET /api/open-finance/:jobId/stream
   *
   * Abre conexao SSE para consumir eventos do pipeline Open Finance.
   * Reutiliza a mesma infraestrutura SSE do analysis-controller.
   */
  app.get<{ Params: { jobId: string } }>(
    '/api/open-finance/:jobId/stream',
    {
      schema: {
        params: {
          type: 'object' as const,
          properties: { jobId: { type: 'string' as const } },
          required: ['jobId'] as const,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { jobId } = request.params;
      const job = jobs.get(jobId);

      if (!job) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Job nao encontrado ou ja consumido',
          },
        } satisfies ApiResponse<never>);
      }

      // Consumo unico
      jobs.delete(jobId);

      void reply.hijack();
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'none'",
        'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Access-Control-Allow-Origin': config.cors.origin,
      });

      let eventId = 0;

      try {
        for await (const event of job.generator) {
          if (reply.raw.destroyed) break;

          eventId++;
          const data = JSON.stringify(event);
          reply.raw.write(`id: ${eventId}\nevent: ${event.type}\ndata: ${data}\n\n`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro no pipeline';
        if (!reply.raw.destroyed) {
          const errorEvent = { type: 'error', code: 'STREAM_ERROR', message, recoverable: false };
          reply.raw.write(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`);
        }
      } finally {
        try {
          await job.generator.return(undefined as never);
        } catch {
          // ignora
        }
        if (!reply.raw.destroyed) {
          reply.raw.end();
        }
      }
    },
  );

  /**
   * DELETE /api/open-finance/connection/:itemId
   *
   * Revoga acesso a uma conexao bancaria.
   * Remove todos os dados associados no agregador.
   */
  app.delete<{ Params: { itemId: string } }>(
    '/api/open-finance/connection/:itemId',
    {
      schema: {
        params: {
          type: 'object' as const,
          properties: { itemId: { type: 'string' as const } },
          required: ['itemId'] as const,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (!isOpenFinanceConfigured()) {
        return reply.status(501).send({
          success: false,
          error: {
            code: 'OPEN_FINANCE_NOT_CONFIGURED',
            message: 'Open Finance nao esta configurado neste servidor',
          },
        } satisfies ApiResponse<never>);
      }

      try {
        await revokeConnection(request.params.itemId);
        return reply.status(200).send({
          success: true,
          data: { message: 'Conexao bancaria revogada com sucesso' },
        });
      } catch (error) {
        request.log.error({ err: error }, '[Open Finance] Erro ao revogar conexao');
        return reply.status(502).send({
          success: false,
          error: {
            code: 'AGGREGATOR_ERROR',
            message: 'Erro ao revogar conexao bancaria',
          },
        } satisfies ApiResponse<never>);
      }
    },
  );
}
