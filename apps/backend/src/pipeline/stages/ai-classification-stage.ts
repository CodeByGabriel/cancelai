/**
 * AI Classification Stage
 *
 * Wrapa classifyWithAI com circuit breaker (opossum).
 * Fallback silencioso: se IA falhar, retorna subscriptions sem alteracao.
 *
 * O sistema NUNCA falha por causa da IA.
 */

import CircuitBreaker from 'opossum';
import type { DetectedSubscription } from '../../types/index.js';
import { classifyWithAI } from '../../services/ai-classifier.js';
import type { PipelineContext, PipelineEvent, PipelineStage } from '../pipeline-events.js';

// ═══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════

const aiBreaker = new CircuitBreaker(
  async (subscriptions: readonly DetectedSubscription[]): Promise<DetectedSubscription[]> => {
    return classifyWithAI(subscriptions);
  },
  {
    timeout: 8000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 3,
  }
);

// Log quando circuit breaker abre/fecha
aiBreaker.on('open', () => {
  console.warn('[AIClassification] Circuit breaker ABERTO — IA temporariamente desativada');
});
aiBreaker.on('halfOpen', () => {
  console.log('[AIClassification] Circuit breaker half-open — testando IA');
});
aiBreaker.on('close', () => {
  console.log('[AIClassification] Circuit breaker FECHADO — IA normalizada');
});

// ═══════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════

export class AIClassificationStage implements PipelineStage {
  readonly name = 'ai-classification';
  readonly timeout = 10000;

  canSkip(context: PipelineContext): boolean {
    return context.scoredSubscriptions.length === 0;
  }

  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    const ambiguousCount = context.scoredSubscriptions.filter(
      (s) => s.confidence !== 'high'
    ).length;

    yield {
      type: 'progress',
      stage: this.name,
      current: 0,
      total: ambiguousCount,
      message: `Classificando ${ambiguousCount} cobranças ambiguas via IA`,
    };

    try {
      const result = await aiBreaker.fire(context.scoredSubscriptions);
      context.finalSubscriptions = result;

      yield {
        type: 'stage-complete',
        stage: this.name,
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        summary: {
          input: context.scoredSubscriptions.length,
          output: result.length,
          ambiguousAnalyzed: ambiguousCount,
          circuitBreakerState: String(aiBreaker.status),
        },
      };
    } catch (error) {
      // Fallback silencioso: retorna subscriptions sem alteracao
      context.finalSubscriptions = [...context.scoredSubscriptions];

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.warn(`[AIClassification] Fallback silencioso: ${errorMessage}`);

      yield {
        type: 'stage-complete',
        stage: this.name,
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        summary: {
          input: context.scoredSubscriptions.length,
          output: context.scoredSubscriptions.length,
          fallback: 'true',
          reason: errorMessage,
        },
      };
    }
  }
}
