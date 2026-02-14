/**
 * Pipeline Orchestrator
 *
 * Compoe stages como async generators e itera com for-await-of.
 * Cada stage yielda eventos tipados; o orchestrator re-yield para o consumidor.
 *
 * DECISOES:
 * - AbortController com timeout global de 120s
 * - Short-circuit se parsing nao encontra transacoes
 * - CleanupStage roda no finally (sempre executa)
 * - Erros nao-recuperaveis interrompem o pipeline
 */

import type {
  PipelineContext,
  PipelineEvent,
  PipelineStage,
} from './pipeline-events.js';
import type { FileToProcess } from '../parsers/index.js';
import type { AnalysisResult } from '../types/index.js';
import { config } from '../config/index.js';
import { roundToTwo } from '../utils/amount.js';
import { getDateRange } from '../utils/date.js';

import { ValidationStage } from './stages/validation-stage.js';
import { ParsingStage } from './stages/parsing-stage.js';
import { NormalizationStage } from './stages/normalization-stage.js';
import { GroupingStage } from './stages/grouping-stage.js';
import { ScoringStage } from './stages/scoring-stage.js';
import { SanityStage } from './stages/sanity-stage.js';
import { AIClassificationStage } from './stages/ai-classification-stage.js';
import { CleanupStage } from './stages/cleanup-stage.js';

const GLOBAL_TIMEOUT_MS = 120_000;

/**
 * Cria o contexto compartilhado entre stages
 */
export function createPipelineContext(
  files: FileToProcess[],
  requestId: string
): { context: PipelineContext; abort: AbortController } {
  const abort = new AbortController();

  const context: PipelineContext = {
    requestId,
    signal: abort.signal,
    startTime: Date.now(),
    files,
    parseResults: [],
    transactions: [],
    validTransactions: [],
    groups: [],
    scoredSubscriptions: [],
    finalSubscriptions: [],
    installments: [],
    errors: [],
    warnings: [],
    info: [],
    banksDetected: [],
    filesValidated: false,
  };

  return { context, abort };
}

/**
 * Lista ordenada de stages do pipeline
 */
const STAGES: readonly PipelineStage[] = [
  new ValidationStage(),
  new ParsingStage(),
  new NormalizationStage(),
  new GroupingStage(),
  new ScoringStage(),
  new SanityStage(),
  new AIClassificationStage(),
  // CleanupStage roda no finally, nao aqui
];

/**
 * Executa o pipeline completo como async generator.
 *
 * Uso request-response:
 *   for await (const event of runPipeline(files, id)) {
 *     if (event.type === 'complete') result = event.result;
 *   }
 *
 * Uso SSE:
 *   for await (const event of runPipeline(files, id)) {
 *     reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
 *   }
 */
export async function* runPipeline(
  files: FileToProcess[],
  requestId: string
): AsyncGenerator<PipelineEvent> {
  const { context, abort } = createPipelineContext(files, requestId);

  const timeoutId = setTimeout(() => abort.abort(), GLOBAL_TIMEOUT_MS);

  try {
    for (const stage of STAGES) {
      // Verifica timeout global
      if (context.signal.aborted) {
        yield {
          type: 'error',
          code: 'TIMEOUT',
          message: `Pipeline excedeu timeout global de ${GLOBAL_TIMEOUT_MS / 1000}s`,
          recoverable: false,
        };
        return;
      }

      // Verifica se stage pode ser pulado
      if (stage.canSkip?.(context)) {
        continue;
      }

      // Executa o stage e re-yield eventos
      for await (const event of stage.execute(context)) {
        yield event;

        // Erro nao-recuperavel interrompe o pipeline
        if (event.type === 'error' && !event.recoverable) {
          return;
        }
      }

      // Short-circuits apos stages especificos
      if (stage.name === 'parsing') {
        const successfulParses = context.parseResults.filter((r) => r.success);
        if (successfulParses.length === 0) {
          // Nenhum arquivo parseado com sucesso — erro nao-recuperavel
          yield {
            type: 'error',
            code: 'NO_SUCCESSFUL_PARSES',
            message: context.errors.length > 0
              ? context.errors.join('; ')
              : 'Não foi possível processar nenhum arquivo',
            recoverable: false,
          };
          return;
        }
        if (context.transactions.length === 0) {
          // Arquivos validos mas sem transacoes reconheciveis
          context.info.push(
            'Nenhuma transacao reconhecivel encontrada nos arquivos.',
            'Pagamentos via Pix e transferencias avulsas nao sao considerados assinaturas.'
          );
          break;
        }
      }

      if (stage.name === 'normalization' && context.validTransactions.length === 0) {
        context.info.push(
          'Nenhuma transacao valida para deteccao de assinaturas.',
          'Pagamentos via Pix, parcelamentos e transferencias foram filtrados.'
        );
        break;
      }
    }

    // Monta resultado final
    const result = buildAnalysisResult(context);

    yield {
      type: 'complete',
      result,
      durationMs: Date.now() - context.startTime,
    };
  } catch (error) {
    yield {
      type: 'error',
      code: 'PIPELINE_ERROR',
      message: error instanceof Error ? error.message : 'Erro desconhecido no pipeline',
      recoverable: false,
    };
  } finally {
    clearTimeout(timeoutId);

    // Cleanup SEMPRE executa
    try {
      const cleanup = new CleanupStage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _event of cleanup.execute(context)) {
        // Eventos do cleanup no finally sao descartados
      }
    } catch {
      // Erros do cleanup sao engolidos
    }
  }
}

/**
 * Constroi o AnalysisResult final a partir do contexto
 */
function buildAnalysisResult(context: PipelineContext): AnalysisResult {
  const subscriptions = context.finalSubscriptions.length > 0
    ? context.finalSubscriptions
    : context.scoredSubscriptions;

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);

  const dates = context.transactions.map((t) => t.date);
  const dateRange = getDateRange([...dates]);

  const highCount = subscriptions.filter((s) => s.confidence === 'high').length;
  const mediumCount = subscriptions.filter((s) => s.confidence === 'medium').length;
  const lowCount = subscriptions.filter((s) => s.confidence === 'low').length;

  const successfulParses = context.parseResults.filter((r) => r.success);

  const result: AnalysisResult = {
    subscriptions,
    summary: {
      totalMonthlySpending: roundToTwo(totalMonthly),
      totalAnnualSpending: roundToTwo(totalMonthly * 12),
      subscriptionCount: subscriptions.length,
      highConfidenceCount: highCount,
      mediumConfidenceCount: mediumCount,
      lowConfidenceCount: lowCount,
      periodStart: dateRange?.start ?? new Date(),
      periodEnd: dateRange?.end ?? new Date(),
      transactionsAnalyzed: context.transactions.length,
    },
    metadata: {
      processedAt: new Date(),
      processingTimeMs: Date.now() - context.startTime,
      filesProcessed: successfulParses.length,
      bankFormatsDetected: [...new Set(context.banksDetected)],
      version: config.version,
    },
    ...(context.warnings.length > 0 && { warnings: context.warnings }),
    ...(context.info.length > 0 && { info: context.info }),
    ...(context.installments.length > 0 && { installments: context.installments }),
  };

  // Adiciona mensagens informativas se nao encontrou assinaturas
  if (subscriptions.length === 0 && context.transactions.length > 0) {
    const info = [
      ...(result.info ?? []),
      'Nenhuma assinatura recorrente foi detectada nesse periodo.',
      'Pagamentos via Pix e compras avulsas nao sao considerados assinaturas.',
      'Para melhores resultados, envie extratos do cartao de credito dos ultimos 2-3 meses.',
    ];
    return { ...result, info };
  }

  return result;
}
