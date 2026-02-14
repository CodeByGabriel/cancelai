/**
 * Pipeline Observer
 *
 * Pattern Observer para logging e metricas do pipeline.
 * Observers NAO podem afetar o fluxo do pipeline — erros sao engolidos.
 */

import type { PipelineEvent } from './pipeline-events.js';

/**
 * Interface para observar eventos do pipeline
 */
export interface PipelineObserver {
  onEvent(event: PipelineEvent): void;
}

/**
 * Observer que loga eventos relevantes (sem dados sensiveis)
 */
export class LoggingObserver implements PipelineObserver {
  constructor(private readonly requestId: string) {}

  onEvent(event: PipelineEvent): void {
    switch (event.type) {
      case 'stage-start':
        console.log(`[${this.requestId}] Stage: ${event.stage}`);
        break;
      case 'stage-complete':
        console.log(
          `[${this.requestId}] ${event.stage} completo (${event.durationMs}ms)`,
          event.summary
        );
        break;
      case 'file-error':
        console.warn(`[${this.requestId}] Arquivo falhou: ${event.filename}: ${event.error}`);
        break;
      case 'file-partial':
        console.log(
          `[${this.requestId}] Arquivo parsed: ${event.filename} → ${event.transactionCount} transacoes (${event.bankDetected})`
        );
        break;
      case 'error':
        console.error(`[${this.requestId}] Erro no pipeline: ${event.code} — ${event.message}`);
        break;
      case 'complete':
        console.log(
          `[${this.requestId}] Pipeline completo: ${event.result.subscriptions.length} assinatura(s), ${event.durationMs}ms`
        );
        break;
      default:
        break;
    }
  }
}

/**
 * Wrapa um pipeline generator e notifica observers de cada evento.
 * Re-yield de todos os eventos sem alteracao.
 */
export async function* observePipeline(
  pipeline: AsyncGenerator<PipelineEvent>,
  observers: readonly PipelineObserver[]
): AsyncGenerator<PipelineEvent> {
  for await (const event of pipeline) {
    for (const observer of observers) {
      try {
        observer.onEvent(event);
      } catch {
        // Observer errors NUNCA crasham o pipeline
      }
    }
    yield event;
  }
}
