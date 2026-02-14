/**
 * Recurrence Analyzer
 *
 * Modulo de funcoes puras para analise de recorrencia em grupos de transacoes.
 * NAO e um pipeline stage separado — chamado pelo grouping-stage apos agrupar.
 *
 * Analisa:
 * - Periodo de recorrencia (semanal a anual)
 * - Habituality score (fracao de intervalos dentro da tolerancia)
 * - Stream maturity (combinacao de span temporal e count)
 */

import type { RecurrenceMetrics, RecurrencePeriodType } from '../../types/index.js';
import type { TransactionGroup } from '../pipeline-events.js';
import { RECURRENCE_PERIODS } from '../../config/index.js';

const MS_PER_DAY = 86_400_000;

/**
 * Calcula a mediana de um array de numeros.
 * Usa o valor central (ou media dos dois centrais).
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/**
 * Classifica o periodo de recorrencia baseado na mediana dos intervalos.
 * Itera RECURRENCE_PERIODS e retorna o primeiro match.
 */
function classifyPeriod(medianDays: number): RecurrencePeriodType {
  const periods = Object.entries(RECURRENCE_PERIODS) as Array<
    [RecurrencePeriodType, { idealDays: number; tolerance: number }]
  >;

  for (const [periodType, { idealDays, tolerance }] of periods) {
    if (Math.abs(medianDays - idealDays) <= tolerance) {
      return periodType;
    }
  }
  return 'unknown';
}

/**
 * Calcula habituality score: fracao de intervalos que estao
 * dentro da tolerancia do periodo detectado.
 */
function calculateHabituality(
  intervals: number[],
  periodType: RecurrencePeriodType,
): number {
  if (intervals.length === 0) return 0;

  const periodConfig = RECURRENCE_PERIODS[periodType as keyof typeof RECURRENCE_PERIODS];
  if (!periodConfig) return 0;

  const { idealDays, tolerance } = periodConfig;
  const withinTolerance = intervals.filter(
    (interval) => Math.abs(interval - idealDays) <= tolerance,
  ).length;

  return withinTolerance / intervals.length;
}

/**
 * Calcula stream maturity: combinacao normalizada de
 * span temporal (em dias) e numero de ocorrencias.
 *
 * maturity = min(1, (span / 180)) * 0.6 + min(1, (count / 6)) * 0.4
 *
 * 180 dias = 6 meses, 6 ocorrencias = semestre mensal.
 */
function calculateStreamMaturity(
  spanDays: number,
  occurrences: number,
): number {
  const spanFactor = Math.min(1, spanDays / 180);
  const countFactor = Math.min(1, occurrences / 6);
  return spanFactor * 0.6 + countFactor * 0.4;
}

/**
 * Analisa recorrencia de um grupo de transacoes.
 * Retorna metricas completas: mediana, periodo, habituality, maturity.
 */
export function analyzeRecurrence(group: TransactionGroup): RecurrenceMetrics {
  const dates = group.transactions
    .map((t) => t.date.getTime())
    .sort((a, b) => a - b);

  if (dates.length < 2) {
    return {
      medianInterval: 0,
      periodType: 'unknown',
      habitualityScore: 0,
      streamMaturity: 0,
      intervalCount: 0,
      intervals: [],
    };
  }

  // Calcula deltas entre datas consecutivas (em dias)
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const delta = (dates[i]! - dates[i - 1]!) / MS_PER_DAY;
    intervals.push(Math.round(delta));
  }

  const medianInterval = median(intervals);
  const periodType = classifyPeriod(medianInterval);
  const habitualityScore = calculateHabituality(intervals, periodType);

  const spanDays = (dates[dates.length - 1]! - dates[0]!) / MS_PER_DAY;
  const streamMaturity = calculateStreamMaturity(spanDays, dates.length);

  return {
    medianInterval,
    periodType,
    habitualityScore,
    streamMaturity,
    intervalCount: intervals.length,
    intervals,
  };
}

/**
 * Enriquece grupos com metricas de recorrencia.
 * Chamado pelo grouping-stage DEPOIS de agrupar.
 */
export function enrichGroupsWithRecurrence(groups: TransactionGroup[]): void {
  for (const group of groups) {
    const metrics = analyzeRecurrence(group);
    group.recurrenceMetrics = metrics;
    group.habitualityScore = metrics.habitualityScore;
    group.streamMaturity = metrics.streamMaturity;
    group.detectedPeriod = metrics.periodType;
  }
}
