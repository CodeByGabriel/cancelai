/**
 * Sanity Stage
 *
 * Exporta funcoes puras de validacao de sanidade matematica
 * e implementa um stage de post-filtering.
 *
 * Extraido de subscription-detector.ts linhas 194-285.
 */

import type { Transaction, DetectedSubscription } from '../../types/index.js';
import type { PipelineContext, PipelineEvent, PipelineStage, TransactionGroup, ConfidenceScores } from '../pipeline-events.js';
import { daysBetween } from '../../utils/date.js';
import { isAggregateValue } from './normalization-stage.js';
import { findKnownService } from '../../services/known-services.js';
import { PRICE_RANGE_TOLERANCE } from '../../config/index.js';

// ConfidenceScores imported from pipeline-events.ts

// ═══════════════════════════════════════════════════════════════
// FUNCOES PURAS — exportadas para scoring-stage
// ═══════════════════════════════════════════════════════════════

/**
 * Valida se um grupo passa nas regras de sanidade matematica
 */
export function validateGroupSanity(
  group: TransactionGroup,
  allTransactions: readonly Transaction[]
): { valid: boolean; reason?: string } {
  const { transactions, averageAmount } = group;

  if (averageAmount <= 0) {
    return { valid: false, reason: 'Valor zero ou negativo' };
  }

  const totalAllTransactions = allTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  if (averageAmount > totalAllTransactions) {
    return { valid: false, reason: 'Valor excede total do periodo' };
  }

  const MAX_REASONABLE_MONTHLY = 50000;
  if (averageAmount > MAX_REASONABLE_MONTHLY) {
    const sortedDates = transactions.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(daysBetween(sortedDates[i - 1]!, sortedDates[i]!));
    }

    const avgInterval =
      intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const isMonthlyConsistent = intervals.length >= 2 && Math.abs(avgInterval - 30) <= 5;

    if (!isMonthlyConsistent) {
      return { valid: false, reason: 'Valor alto sem padrao mensal claro' };
    }
  }

  return { valid: true };
}

/**
 * Para valores elevados (> R$500), aplica requisitos mais rigorosos
 */
export function validateHighValueSubscription(
  group: TransactionGroup,
  scores: ConfidenceScores
): { valid: boolean; adjustedScore?: number } {
  const HIGH_VALUE_THRESHOLD = 500;

  if (group.averageAmount <= HIGH_VALUE_THRESHOLD) {
    return { valid: true };
  }

  const meetsRecurrence = scores.recurrenceScore >= 0.6;
  const meetsStability = scores.valueStabilityScore >= 0.7;
  const meetsDescriptionStability = group.stringSimilarityScore >= 0.8;

  const hasAggregateTerm = Array.from(group.originalNames).some((name) =>
    isAggregateValue(name)
  );

  if (hasAggregateTerm) {
    return { valid: false };
  }

  const criteriaMet = [meetsRecurrence, meetsStability, meetsDescriptionStability].filter(
    Boolean
  ).length;

  if (criteriaMet < 2) {
    return { valid: false };
  }

  if (criteriaMet < 3) {
    return { valid: true, adjustedScore: scores.finalScore * 0.85 };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// STAGE — post-filtering opcional
// ═══════════════════════════════════════════════════════════════

export class SanityStage implements PipelineStage {
  readonly name = 'sanity';

  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    // Post-filtering: remove assinaturas com valor agregado nos nomes originais
    const before = context.scoredSubscriptions.length;
    context.scoredSubscriptions = context.scoredSubscriptions.filter((sub) => {
      const hasAggregate = sub.originalNames.some((name) => isAggregateValue(name));
      return !hasAggregate;
    });

    const removed = before - context.scoredSubscriptions.length;

    // Price range validation usando typicalPriceRange de known-services
    context.scoredSubscriptions = context.scoredSubscriptions.map((sub) => {
      const service = findKnownService(sub.name);
      if (!service?.typicalPriceRange) return sub;

      const { min, max } = service.typicalPriceRange;
      const maxTolerant = max * (1 + PRICE_RANGE_TOLERANCE);

      if (sub.monthlyAmount > maxTolerant) {
        context.warnings.push(
          `${sub.name}: R$${sub.monthlyAmount.toFixed(2)} esta acima da faixa tipica (R$${min}-${max})`,
        );
        return { ...sub, priceRangeFlag: 'above_range' as const };
      }

      if (sub.monthlyAmount < min) {
        context.warnings.push(
          `${sub.name}: R$${sub.monthlyAmount.toFixed(2)} esta abaixo da faixa tipica (possivel promocao)`,
        );
        return { ...sub, priceRangeFlag: 'promo' as const };
      }

      return { ...sub, priceRangeFlag: 'normal' as const };
    });

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: { before, removed, after: context.scoredSubscriptions.length },
    };
  }
}
