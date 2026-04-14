/**
 * Controller de Análise de Extratos
 *
 * Expõe endpoints REST para upload e análise de extratos.
 *
 * DECISÕES DE SEGURANÇA:
 * 1. Arquivos são processados APENAS em memória (buffers)
 * 2. Nenhum arquivo é persistido em disco em nenhum momento
 * 3. Buffers são zerados e descartados explicitamente após processamento
 * 4. Nenhum dado sensível é logado - apenas métricas técnicas (tempo, tamanho, quantidade)
 * 5. Erros internos não expõem stack traces ou detalhes de implementação
 *
 * Essas decisões protegem:
 * - Privacidade do usuário (dados financeiros nunca persistem)
 * - Segurança do servidor (sem arquivos maliciosos em disco)
 * - Conformidade com LGPD (minimização de dados)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { config } from '../config/index.js';
import {
  analyzeStatements,
  SSEManager,
  registerConsent,
  revokeConsent,
  getConsent,
  serializeConsent,
  type ConsentScope,
} from '../services/index.js';
import { runPipeline } from '../pipeline/index.js';
import type { FileToProcess } from '../parsers/index.js';
import type { ApiResponse, AnalysisResult } from '../types/index.js';

/**
 * SSE Manager — singleton, criado quando registerAnalysisRoutes é chamado.
 * Exposto para uso no health check e graceful shutdown.
 */
let sseManager: SSEManager | null = null;

export function getSSEManager(): SSEManager | null {
  return sseManager;
}

/**
 * Gera ID único para rastreamento de requisição (sem dados sensíveis)
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Resultado do processamento de upload
 */
interface UploadResult {
  readonly files: FileToProcess[];
  readonly errors: string[];
  readonly debugInfo: {
    partsReceived: number;
    filesReceived: number;
    fieldsReceived: number;
  };
}

/**
 * Job store para SSE streaming — in-memory com TTL
 */
interface PipelineJob {
  readonly generator: ReturnType<typeof runPipeline>;
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
 * Registra as rotas de análise
 */
export function registerAnalysisRoutes(app: FastifyInstance): void {
  // Inicializa SSEManager com o logger do Fastify
  sseManager = new SSEManager(app.log);

  /**
   * POST /api/analyze
   *
   * Recebe arquivos de extrato (PDF ou CSV) e retorna assinaturas detectadas.
   *
   * FLUXO:
   * 1. Valida Content-Type multipart
   * 2. Processa cada arquivo do FormData
   * 3. Valida tipo e tamanho de cada arquivo
   * 4. Executa análise de assinaturas
   * 5. Limpa buffers da memória
   * 6. Retorna resultado
   */
  app.post('/api/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // DEBUG: Log da requisição (sem dados sensíveis)
    console.log(`[${requestId}] POST /api/analyze - Iniciando`);
    console.log(`[${requestId}] Content-Type: ${request.headers['content-type'] ?? 'não informado'}`);

    try {
      // Verifica se a request é multipart
      if (!request.isMultipart()) {
        console.warn(`[${requestId}] Erro: Content-Type inválido`);
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: 'Content-Type deve ser multipart/form-data',
            details: {
              received: request.headers['content-type'] ?? 'não informado',
              expected: 'multipart/form-data',
            },
          },
        } satisfies ApiResponse<never>);
      }

      // Processa os arquivos do upload com tratamento de erro detalhado
      const uploadResult = await processUploadedFiles(request, requestId);

      // DEBUG: Log de resultado do processamento
      console.log(
        `[${requestId}] Upload: ${uploadResult.debugInfo.partsReceived} partes, ` +
        `${uploadResult.debugInfo.filesReceived} arquivos, ` +
        `${uploadResult.debugInfo.fieldsReceived} campos, ` +
        `${uploadResult.files.length} válidos, ` +
        `${uploadResult.errors.length} erros`
      );

      if (uploadResult.files.length === 0) {
        // Mensagem de erro detalhada para ajudar no debug
        const errorMessage = uploadResult.errors.length > 0
          ? uploadResult.errors.join('; ')
          : 'Nenhum arquivo recebido. Verifique se está enviando com o campo "files"';

        console.warn(`[${requestId}] Nenhum arquivo válido: ${errorMessage}`);

        return reply.status(400).send({
          success: false,
          error: {
            code: 'NO_FILES',
            message: 'Nenhum arquivo válido enviado',
            details: {
              errors: uploadResult.errors,
              debug: uploadResult.debugInfo,
              hint: 'Envie arquivos usando FormData com formData.append("files", file)',
              allowedTypes: config.upload.allowedExtensions,
              maxSize: `${config.server.maxFileSize / (1024 * 1024)}MB`,
              maxFiles: config.server.maxFiles,
            },
          },
        } satisfies ApiResponse<never>);
      }

      // Log de métricas dos arquivos (sem conteúdo sensível)
      uploadResult.files.forEach((f, i) => {
        console.log(
          `[${requestId}] Arquivo ${i + 1}: ` +
          `${f.filename} (${(f.content.length / 1024).toFixed(1)}KB, ${f.mimetype})`
        );
      });

      // Analisa os extratos
      const analysisResult = await analyzeStatements(uploadResult.files);

      // SEGURANÇA: Limpa buffers da memória explicitamente
      // Defense in depth: sobrescreve com zeros antes de descartar
      secureCleanupFiles(uploadResult.files);

      if (!analysisResult.success) {
        console.warn(`[${requestId}] Análise falhou:`, analysisResult.errors);

        return reply.status(422).send({
          success: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: 'Não foi possível analisar os extratos',
            details: {
              errors: analysisResult.errors,
              warnings: analysisResult.warnings,
            },
          },
        } satisfies ApiResponse<never>);
      }

      // Log de métricas de sucesso (sem dados sensíveis)
      const processingTime = Date.now() - startTime;
      console.log(
        `[${requestId}] SUCESSO - ` +
        `${uploadResult.files.length} arquivo(s), ` +
        `${analysisResult.result?.subscriptions.length ?? 0} assinatura(s), ` +
        `${analysisResult.result?.summary.transactionsAnalyzed ?? 0} transações, ` +
        `${processingTime}ms`
      );

      return reply.status(200).send({
        success: true,
        data: analysisResult.result!,
      } satisfies ApiResponse<AnalysisResult>);

    } catch (error) {
      // SEGURANÇA: Log interno com detalhes, resposta externa sem detalhes
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[${requestId}] ERRO INTERNO: ${errorMessage}`);
      if (process.env['NODE_ENV'] !== 'production' && errorStack) {
        console.error(`[${requestId}] Stack:`, errorStack);
      }

      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno ao processar a requisição',
          // Em desenvolvimento, inclui hint para debug
          ...(process.env['NODE_ENV'] !== 'production' && {
            hint: errorMessage,
            requestId,
          }),
        },
      } satisfies ApiResponse<never>);
    }
  });

  /**
   * POST /api/analyze/stream
   *
   * Processa upload e cria job de pipeline.
   * Retorna jobId para consumo via SSE em GET /api/analyze/:jobId/stream.
   */
  app.post('/api/analyze/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = generateRequestId();
    console.log(`[${requestId}] POST /api/analyze/stream - Iniciando`);

    if (!request.isMultipart()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type deve ser multipart/form-data',
        },
      } satisfies ApiResponse<never>);
    }

    const uploadResult = await processUploadedFiles(request, requestId);

    if (uploadResult.files.length === 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'NO_FILES',
          message: uploadResult.errors.length > 0
            ? uploadResult.errors.join('; ')
            : 'Nenhum arquivo recebido',
        },
      } satisfies ApiResponse<never>);
    }

    const jobId = `job_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const generator = runPipeline(uploadResult.files, requestId);

    jobs.set(jobId, { generator, createdAt: Date.now() });

    console.log(`[${requestId}] Job criado: ${jobId} (${uploadResult.files.length} arquivo(s))`);

    return reply.status(200).send({
      success: true,
      data: { jobId, streamUrl: `/api/analyze/${jobId}/stream` },
    });
  });

  /**
   * GET /api/analyze/:jobId/stream
   *
   * Abre conexão SSE para consumir eventos do pipeline.
   * Cada job só pode ser consumido uma vez.
   */
  app.get<{ Params: { jobId: string } }>(
    '/api/analyze/:jobId/stream',
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
            message: 'Job não encontrado ou já consumido',
          },
        } satisfies ApiResponse<never>);
      }

      // Verificar limite de conexões antes do hijack
      if (sseManager) {
        const metrics = sseManager.getMetrics();
        if (metrics.activeConnections >= 50) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'TOO_MANY_CONNECTIONS',
              message: 'Muitas conexões SSE ativas. Tente novamente em alguns segundos.',
            },
          } satisfies ApiResponse<never>);
        }
      }

      // Consumo único — remove do store
      jobs.delete(jobId);

      void reply.hijack();
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        // Security headers (Helmet bypass fix — reply.hijack() skips plugins)
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        // CORS (plugin bypass fix)
        'Access-Control-Allow-Origin': config.cors.origin,
      });

      const connectionId = jobId;
      const analysisId = jobId;

      // Registrar conexão no SSEManager após hijack (heartbeats, timeout, tracking)
      if (sseManager) {
        sseManager.registerConnection(connectionId, analysisId, reply.raw);

        // Replay de eventos se cliente reconectou com Last-Event-ID
        const lastEventIdHeader = request.headers['last-event-id'];
        if (typeof lastEventIdHeader === 'string') {
          const lastEventId = parseInt(lastEventIdHeader, 10);
          if (!isNaN(lastEventId)) {
            sseManager.replayEvents(connectionId, analysisId, lastEventId);
          }
        }
      }

      try {
        for await (const event of job.generator) {
          if (reply.raw.destroyed) break;

          if (sseManager) {
            sseManager.sendEvent(connectionId, event);
          } else {
            // Fallback sem SSEManager (não deveria acontecer)
            reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro no pipeline';
        if (!reply.raw.destroyed) {
          const errorEvent = { type: 'error', code: 'STREAM_ERROR', message, recoverable: false };
          if (sseManager) {
            sseManager.sendEvent(connectionId, errorEvent);
          } else {
            reply.raw.write(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`);
          }
        }
      } finally {
        if (sseManager) {
          sseManager.clearBuffer(analysisId);
          sseManager.removeConnection(connectionId);
        } else if (!reply.raw.destroyed) {
          reply.raw.end();
        }
      }
    }
  );

  /**
   * GET /api/health
   *
   * Endpoint de health check para monitoramento.
   */
  app.get('/api/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                version: { type: 'string' },
                timestamp: { type: 'string' },
                uptime: { type: 'number' },
                memory: {
                  type: 'object',
                  properties: {
                    heapUsed: { type: 'number' },
                    heapTotal: { type: 'number' },
                    rss: { type: 'number' },
                    external: { type: 'number' },
                  },
                },
                sse: {
                  type: 'object',
                  properties: {
                    activeConnections: { type: 'number' },
                    peakConnections: { type: 'number' },
                    totalConnectionsServed: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    const mem = process.memoryUsage();
    const heapRatio = mem.heapUsed / mem.heapTotal;
    const isHealthy = heapRatio < 0.9;
    const sseMetrics = sseManager?.getMetrics();

    return reply.status(isHealthy ? 200 : 503).send({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        version: config.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          rss: mem.rss,
          external: mem.external,
        },
        ...(sseMetrics && { sse: sseMetrics }),
      },
    });
  });

  /**
   * GET /api/info
   *
   * Retorna informações sobre limites e formatos aceitos.
   */
  app.get('/api/info', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                version: { type: 'string' },
                limits: { type: 'object' },
                supportedBanks: { type: 'array', items: { type: 'string' } },
                uploadFieldName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: {
        version: config.version,
        limits: {
          maxFileSize: config.server.maxFileSize,
          maxFiles: config.server.maxFiles,
          allowedExtensions: config.upload.allowedExtensions,
          allowedMimeTypes: config.upload.allowedMimeTypes,
        },
        supportedBanks: [
          'Nubank',
          'Itaú',
          'Bradesco',
          'Banco do Brasil',
          'Caixa',
          'Inter',
          'Santander',
          'Outros (CSV genérico)',
        ],
        uploadFieldName: 'files',
      },
    });
  });

  // ============================================================
  // CONSENT ROUTES — LGPD Compliance
  // ============================================================

  /**
   * POST /api/consent
   * Registra consentimento do usuário para processamento
   */
  app.post('/api/consent', {
    schema: {
      body: {
        type: 'object' as const,
        properties: {
          sessionId: { type: 'string' as const },
          scopes: { type: 'array' as const, items: { type: 'string' as const } },
        },
        required: ['sessionId', 'scopes'] as const,
        additionalProperties: false,
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { sessionId?: string; scopes?: ConsentScope[] } | null;

    if (!body?.sessionId || !body.scopes || !Array.isArray(body.scopes)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'sessionId e scopes são obrigatórios' },
      });
    }

    const ipHash = request.ip?.substring(0, 8) ?? 'unknown';
    const record = registerConsent(body.sessionId, body.scopes, ipHash);

    return reply.status(201).send({
      success: true,
      data: serializeConsent(record),
    });
  });

  /**
   * GET /api/consent/:sessionId
   * Consulta status do consentimento — LGPD Art. 18 (acesso pelo titular)
   */
  app.get<{ Params: { sessionId: string } }>(
    '/api/consent/:sessionId',
    {
      schema: {
        params: {
          type: 'object' as const,
          properties: { sessionId: { type: 'string' as const } },
          required: ['sessionId'] as const,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const record = getConsent(request.params.sessionId);

      if (!record) {
        return reply.status(404).send({
          success: false,
          error: { code: 'CONSENT_NOT_FOUND', message: 'Consentimento não encontrado' },
        });
      }

      return reply.status(200).send({
        success: true,
        data: serializeConsent(record),
      });
    },
  );

  /**
   * DELETE /api/consent/:sessionId
   * Revoga consentimento — LGPD Art. 8 §5
   */
  app.delete<{ Params: { sessionId: string } }>(
    '/api/consent/:sessionId',
    {
      schema: {
        params: {
          type: 'object' as const,
          properties: { sessionId: { type: 'string' as const } },
          required: ['sessionId'] as const,
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const revoked = revokeConsent(request.params.sessionId);

      if (!revoked) {
        return reply.status(404).send({
          success: false,
          error: { code: 'CONSENT_NOT_FOUND', message: 'Consentimento não encontrado' },
        });
      }

      return reply.status(200).send({
        success: true,
        data: { message: 'Consentimento revogado com sucesso' },
      });
    },
  );
}

/**
 * Processa arquivos do upload multipart
 *
 * SEGURANÇA:
 * - Valida cada arquivo individualmente
 * - Rejeita tipos não permitidos
 * - Limita quantidade de arquivos
 * - Processa em memória apenas
 *
 * @param request - Request do Fastify
 * @param requestId - ID da requisição para logs
 */
async function processUploadedFiles(
  request: FastifyRequest,
  requestId: string
): Promise<UploadResult> {
  const files: FileToProcess[] = [];
  const errors: string[] = [];
  const debugInfo = {
    partsReceived: 0,
    filesReceived: 0,
    fieldsReceived: 0,
  };

  try {
    // Itera sobre as partes do multipart
    const parts = request.parts();

    for await (const part of parts) {
      debugInfo.partsReceived++;

      // Log de debug para cada parte recebida
      console.log(
        `[${requestId}] Parte ${debugInfo.partsReceived}: ` +
        `type=${part.type}, fieldname=${part.fieldname}`
      );

      // Ignora campos que não são arquivos
      if (part.type !== 'file') {
        debugInfo.fieldsReceived++;
        continue;
      }

      debugInfo.filesReceived++;
      const file: MultipartFile = part;

      // Log de debug do arquivo
      console.log(
        `[${requestId}] Arquivo recebido: ` +
        `fieldname=${file.fieldname}, filename=${sanitizeFilename(file.filename)}, mimetype=${file.mimetype}`
      );

      // SEGURANÇA: Valida quantidade de arquivos
      if (files.length >= config.server.maxFiles) {
        errors.push(`Máximo de ${config.server.maxFiles} arquivos permitido`);
        // Consome o stream para evitar memory leak
        await file.toBuffer();
        continue;
      }

      // SEGURANÇA: Valida tipo do arquivo
      const isValidType = isAllowedFileType(file.filename, file.mimetype);
      if (!isValidType) {
        errors.push(
          `Arquivo "${sanitizeFilename(file.filename)}" rejeitado: tipo "${file.mimetype}" não permitido. ` +
          `Aceitos: ${config.upload.allowedExtensions.join(', ')}`
        );
        // Consome o stream para evitar memory leak
        await file.toBuffer();
        continue;
      }

      // Lê o conteúdo do arquivo para memória
      const buffer = await file.toBuffer();

      // SEGURANÇA: Valida tamanho
      if (buffer.length > config.server.maxFileSize) {
        errors.push(
          `Arquivo "${sanitizeFilename(file.filename)}" rejeitado: tamanho ${(buffer.length / (1024 * 1024)).toFixed(1)}MB ` +
          `excede limite de ${config.server.maxFileSize / (1024 * 1024)}MB`
        );
        continue;
      }

      // SEGURANÇA: Valida que não está vazio
      if (buffer.length === 0) {
        errors.push(`Arquivo "${sanitizeFilename(file.filename)}" rejeitado: arquivo vazio`);
        continue;
      }

      files.push({
        filename: sanitizeFilename(file.filename),
        content: buffer,
        mimetype: file.mimetype,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar upload';
    console.error(`[${requestId}] Erro no processamento de upload:`, errorMessage);
    errors.push(`Erro ao processar upload: ${errorMessage}`);
  }

  return { files, errors, debugInfo };
}

/**
 * Verifica se o tipo de arquivo é permitido
 */
function isAllowedFileType(filename: string, mimetype: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  const extWithDot = ext ? `.${ext}` : '';

  const validExtension = (config.upload.allowedExtensions as readonly string[]).includes(extWithDot);
  const validMime = (config.upload.allowedMimeTypes as readonly string[]).includes(mimetype);

  // SEGURANÇA: Exige extensão válida E (MIME válido OU octet-stream para OFX/QFX compat)
  return validExtension && (validMime || mimetype === 'application/octet-stream');
}

/**
 * Sanitiza nome do arquivo
 *
 * SEGURANÇA: Remove caracteres potencialmente perigosos
 * - Previne path traversal (../)
 * - Remove caracteres especiais
 * - Limita tamanho
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove tentativas de path traversal
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Limpa arquivos da memória de forma segura
 *
 * SEGURANÇA: Defense in depth
 * - Sobrescreve buffer com zeros antes de descartar
 * - Remove referências para permitir garbage collection
 */
function secureCleanupFiles(files: FileToProcess[]): void {
  for (const file of files) {
    if (file.content && file.content.length > 0) {
      // Sobrescreve o buffer com zeros
      file.content.fill(0);
    }
    // Remove referência
    (file as { content: Buffer | null }).content = null;
  }
}
