/**
 * Scoring Stage
 *
 * Calcula o score de confianca ponderado para cada grupo de transacoes
 * e produz DetectedSubscription[] ordenadas.
 *
 * Formula (6 sinais):
 *   score = similarity*0.20 + recurrence*0.30 + stability*0.20
 *         + knownService*0.15 + habituality*0.10 + maturity*0.05
 *
 * Thresholds: high >= 0.85, medium >= 0.60, low >= 0.40
 *
 * Extraido de subscription-detector.ts linhas 430-696.
 */

import type {
  DetectedSubscription,
  SubscriptionTransaction,
  Transaction,
} from '../../types/index.js';
import type { PipelineContext, PipelineEvent, PipelineStage, TransactionGroup, ConfidenceScores } from '../pipeline-events.js';
import { SCORING_WEIGHTS_V2, CONFIDENCE_THRESHOLDS_V2, RECURRENCE_PERIODS } from '../../config/index.js';
import { extractServiceName, capitalizeServiceName } from '../../utils/string.js';
import { daysBetween } from '../../utils/date.js';
import { calculateAverage, roundToTwo } from '../../utils/amount.js';
import {
  findKnownService,
  getCancelInstructions,
  isValueInTypicalRange,
  type KnownService,
} from '../../services/known-services.js';
import { validateGroupSanity, validateHighValueSubscription } from './sanity-stage.js';

// ═══════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ═══════════════════════════════════════════════════════════════

// ConfidenceScores imported from pipeline-events.ts

// ═══════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula recurrence score baseado no periodo detectado.
 * Usa RECURRENCE_PERIODS para determinar o idealInterval
 * em vez de hardcoded 30 dias.
 */
function calculateRecurrenceScore(dates: Date[], group: TransactionGroup): number {
  if (dates.length < 2) return 0;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const intervals: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const interval = daysBetween(sorted[i - 1]!, sorted[i]!);
    intervals.push(interval);
  }

  // Usa periodo detectado pelo recurrence analyzer, ou default mensal
  const periodType = group.detectedPeriod ?? 'monthly';
  const periodConfig = RECURRENCE_PERIODS[periodType as keyof typeof RECURRENCE_PERIODS];
  const idealInterval = periodConfig?.idealDays ?? 30;
  const tolerance = periodConfig?.tolerance ?? 5;

  let totalScore = 0;
  for (const interval of intervals) {
    const deviation = Math.abs(interval - idealInterval);

    if (deviation <= tolerance) {
      totalScore += 1 - deviation / (tolerance * 2);
    } else if (deviation <= tolerance * 2) {
      totalScore += 0.5 - (deviation - tolerance) / (tolerance * 4);
    } else {
      totalScore += Math.max(0, 0.2 - deviation / 100);
    }
  }

  return totalScore / intervals.length;
}

function calculateValueStabilityScore(amounts: number[]): number {
  if (amounts.length < 2) return 0.5;

  const avg = calculateAverage(amounts);
  if (avg === 0) return 0;

  const squaredDiffs = amounts.map((a) => Math.pow(a - avg, 2));
  const variance = calculateAverage(squaredDiffs);
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;

  const score = Math.exp(-coefficientOfVariation * 5);
  return Math.min(1, Math.max(0, score));
}

function calculateKnownServiceBonus(
  service: KnownService | null,
  avgAmount: number,
): number {
  if (!service) return 0;

  let bonus = 0.7;

  if (service.isPopular) {
    bonus += 0.15;
  }

  if (isValueInTypicalRange(service, avgAmount)) {
    bonus += 0.15;
  }

  return Math.min(1, bonus);
}

function calculateAllScores(
  group: TransactionGroup,
  dates: Date[],
  amounts: number[],
  knownService: KnownService | null,
): ConfidenceScores {
  const stringSimilarityScore = group.stringSimilarityScore;
  const recurrenceScore = calculateRecurrenceScore(dates, group);
  const valueStabilityScore = calculateValueStabilityScore(amounts);
  const knownServiceBonus = calculateKnownServiceBonus(knownService, calculateAverage(amounts));
  const habitualityScore = group.habitualityScore ?? 0;
  const streamMaturity = group.streamMaturity ?? 0;

  const finalScore =
    stringSimilarityScore * SCORING_WEIGHTS_V2.stringSimilarity +
    recurrenceScore * SCORING_WEIGHTS_V2.recurrence +
    valueStabilityScore * SCORING_WEIGHTS_V2.valueStability +
    knownServiceBonus * SCORING_WEIGHTS_V2.knownService +
    habitualityScore * SCORING_WEIGHTS_V2.habituality +
    streamMaturity * SCORING_WEIGHTS_V2.streamMaturity;

  return {
    stringSimilarityScore,
    recurrenceScore,
    valueStabilityScore,
    knownServiceBonus,
    habitualityScore,
    streamMaturity,
    finalScore: Math.min(1, finalScore),
  };
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS_V2.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS_V2.medium) return 'medium';
  return 'low';
}

function generateConfidenceReasons(
  scores: ConfidenceScores,
  knownService: KnownService | null,
  group: TransactionGroup,
): string[] {
  const reasons: string[] = [];

  // Periodo detectado
  const period = group.detectedPeriod;
  if (period && period !== 'unknown') {
    const periodLabels: Record<string, string> = {
      weekly: 'semanal',
      biweekly: 'quinzenal',
      monthly: 'mensal',
      bimonthly: 'bimestral',
      quarterly: 'trimestral',
      semiannual: 'semestral',
      annual: 'anual',
    };
    const label = periodLabels[period] ?? period;

    if (scores.recurrenceScore >= 0.8) {
      reasons.push(`Padrao ${label} consistente`);
    } else if (scores.recurrenceScore >= 0.5) {
      reasons.push(`Padrao ${label} detectado`);
    }
  } else {
    if (scores.recurrenceScore >= 0.8) {
      reasons.push('Padrao recorrente consistente');
    } else if (scores.recurrenceScore >= 0.5) {
      reasons.push('Padrao recorrente detectado');
    }
  }

  if (scores.valueStabilityScore >= 0.8) {
    reasons.push('Valores muito consistentes');
  } else if (scores.valueStabilityScore >= 0.5) {
    reasons.push('Valores similares');
  }

  if (knownService) {
    if (knownService.isPopular) {
      reasons.push('Servico popular reconhecido');
    } else {
      reasons.push('Servico de assinatura conhecido');
    }
  }

  if (scores.habitualityScore >= 0.8) {
    reasons.push('Consistencia temporal alta');
  }

  if (scores.finalScore >= 0.9) {
    reasons.push('Confianca muito alta');
  }

  if (reasons.length === 0) {
    reasons.push('Padrao de cobranca recorrente');
  }

  return reasons;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Analisa um grupo e produz uma DetectedSubscription (ou null)
 */
function analyzeGroupWithScore(
  group: TransactionGroup,
  allTransactions: readonly Transaction[],
): DetectedSubscription | null {
  const { transactions } = group;

  const dates = transactions.map((t) => t.date);
  const amounts = transactions.map((t) => t.amount);

  const serviceName = extractServiceName(group.normalizedName);
  const knownService = findKnownService(serviceName);

  const scores = calculateAllScores(group, dates, amounts, knownService);

  const highValueCheck = validateHighValueSubscription(group, scores);
  if (!highValueCheck.valid) {
    return null;
  }

  const finalScore = highValueCheck.adjustedScore ?? scores.finalScore;

  if (finalScore < CONFIDENCE_THRESHOLDS_V2.low && !knownService) {
    return null;
  }

  const confidenceLevel = getConfidenceLevel(finalScore);
  const confidenceReasons = generateConfidenceReasons({ ...scores, finalScore }, knownService, group);

  const avgAmount = calculateAverage(amounts);

  const subscription: DetectedSubscription = {
    id: generateId(),
    name: knownService?.canonicalName ?? capitalizeServiceName(serviceName),
    originalNames: Array.from(group.originalNames),
    monthlyAmount: roundToTwo(avgAmount),
    annualAmount: roundToTwo(avgAmount * 12),
    occurrences: transactions.length,
    transactions: transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(
        (t): SubscriptionTransaction => ({
          date: t.date,
          amount: t.amount,
          description: t.description,
        }),
      ),
    confidence: confidenceLevel,
    confidenceScore: roundToTwo(finalScore * 100) / 100,
    confidenceReasons,
    ...(knownService?.category && { category: knownService.category }),
    ...(knownService && { cancelInstructions: getCancelInstructions(knownService) }),
    ...(group.detectedPeriod && group.detectedPeriod !== 'unknown' && { detectedPeriod: group.detectedPeriod }),
  };

  return subscription;
}

// ═══════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════

export class ScoringStage implements PipelineStage {
  readonly name = 'scoring';

  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    const subscriptions: DetectedSubscription[] = [];

    for (const group of context.groups) {
      const sanityCheck = validateGroupSanity(group, context.transactions);
      if (!sanityCheck.valid) {
        continue;
      }

      const subscription = analyzeGroupWithScore(group, context.transactions);
      if (subscription) {
        subscriptions.push(subscription);
      }
    }

    // Ordena por score descending, depois por valor
    subscriptions.sort((a, b) => {
      const scoreDiff = (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
      if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
      return b.monthlyAmount - a.monthlyAmount;
    });

    context.scoredSubscriptions = subscriptions;

    // Yield subscription-detected para cada assinatura
    for (let i = 0; i < subscriptions.length; i++) {
      yield {
        type: 'subscription-detected',
        subscription: subscriptions[i]!,
        index: i,
        total: subscriptions.length,
      };
    }

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: {
        groupsAnalyzed: context.groups.length,
        subscriptionsDetected: subscriptions.length,
      },
    };
  }
}
