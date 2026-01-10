/**
 * Detector de Assinaturas Recorrentes - v2.0
 *
 * Este é o módulo mais crítico do Cancelaí. Ele analisa transações
 * e identifica padrões de cobrança recorrente (assinaturas).
 *
 * ALGORITMO DE SCORE PONDERADO:
 * ═══════════════════════════════════════════════════════════════
 *
 * O score final é calculado com a fórmula:
 *
 * confidenceScore =
 *   stringSimilarityScore * 0.25 +      // Similaridade de descrição
 *   recurrenceScore * 0.35 +            // Regularidade temporal
 *   valueStabilityScore * 0.20 +        // Estabilidade de valor
 *   knownServiceBonus * 0.20            // Match com serviço conhecido
 *
 * CLASSIFICAÇÃO:
 * - score >= 0.80 → Alta confiança (quase certeza de assinatura)
 * - 0.60 <= score < 0.80 → Média confiança (provável assinatura)
 * - score < 0.60 → Baixa confiança (verificar manualmente)
 *
 * DECISÕES DE DESIGN:
 * 1. Pesos calibrados com base em análise de extratos reais
 * 2. Recorrência temporal tem maior peso (padrão mensal é forte indicador)
 * 3. Serviços conhecidos aumentam confiança significativamente
 * 4. Tolerância de ±5 dias para variações de data de cobrança
 * 5. Tolerância de ±15% para variações de valor
 */

import type {
  Transaction,
  DetectedSubscription,
  SubscriptionTransaction,
  AnalysisResult,
  AnalysisSummary,
  AnalysisMetadata,
} from '../types/index.js';
import { config } from '../config/index.js';
import {
  normalizeDescription,
  calculateSimilarity,
  extractServiceName,
  capitalizeServiceName,
} from '../utils/string.js';
import { isMonthlyPattern, getDateRange, daysBetween } from '../utils/date.js';
import { isWithinTolerance, calculateAverage, roundToTwo } from '../utils/amount.js';
import {
  findKnownService,
  getCancelInstructions,
  isValueInTypicalRange,
  type KnownService,
} from '../services/known-services.js';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

/**
 * Grupo de transações com descrições similares
 */
interface TransactionGroup {
  normalizedName: string;
  originalNames: Set<string>;
  transactions: Transaction[];
  averageAmount: number;
  stringSimilarityScore: number; // Média de similaridade entre descrições
}

/**
 * Scores individuais para cálculo de confiança
 */
interface ConfidenceScores {
  stringSimilarityScore: number; // 0-1: Quão similares são as descrições
  recurrenceScore: number; // 0-1: Quão regular é o padrão temporal
  valueStabilityScore: number; // 0-1: Quão estáveis são os valores
  knownServiceBonus: number; // 0-1: Bônus por ser serviço conhecido
  finalScore: number; // 0-1: Score ponderado final
}

/**
 * Pesos para cálculo do score final
 */
const SCORE_WEIGHTS = {
  stringSimilarity: 0.25,
  recurrence: 0.35,
  valueStability: 0.20,
  knownService: 0.20,
} as const;

/**
 * Limiares de confiança
 */
const CONFIDENCE_THRESHOLDS = {
  high: 0.80,
  medium: 0.60,
} as const;

// ═══════════════════════════════════════════════════════════════
// VALIDAÇÃO E FILTRAGEM - Regras de Sanidade Financeira
// ═══════════════════════════════════════════════════════════════

/**
 * Padrões de descrição que indicam TOTAIS ou valores agregados
 * Estes NUNCA são assinaturas - são linhas de resumo de fatura
 */
const AGGREGATE_PATTERNS = [
  /\bTOTAL\b/i,
  /\bFATURA\b/i,
  /\bVALOR\s*TOTAL\b/i,
  /\bTOTAL\s*GERAL\b/i,
  /\bVALOR\s*FINANCIADO\b/i,
  /\bSALDO\b/i,
  /\bSUBTOTAL\b/i,
  /\bTOTAL\s*A\s*PAGAR\b/i,
  /\bVALOR\s*DA\s*FATURA\b/i,
  /\bPAGAMENTO\s*FATURA\b/i,
  /\bPAGAMENTO\s*MINIMO\b/i,
];

/**
 * Padrões de parcelamento - NÃO devem ser anualizados automaticamente
 * Exemplos: "PARC 01/12", "PARCELA 3/6", "2/5"
 */
const INSTALLMENT_PATTERNS = [
  /\bPARC\s*\d+\s*[\/\\]\s*\d+/i,      // PARC 01/12, PARC01/06
  /\bPARCEL\w*\s*\d+\s*[\/\\]\s*\d+/i, // PARCELA 1/3, PARCELAMENTO 2/6
  /\bPARCELA\b/i,                       // PARCELA simples
  /\bPARCELADO\b/i,                     // PARCELADO
  /\b\d+\s*[\/\\]\s*\d+\s*(PARC|X)\b/i, // 01/12 PARC, 3/6X
  /\b\d+\s*DE\s*\d+\b/i,                // 1 DE 12
];

/**
 * Padrões de PIX e transferências - NÃO são assinaturas
 */
const TRANSFER_PATTERNS = [
  /\bPIX\b/i,
  /\bTRANSFER[EÊ]NCIA\b/i,
  /\bTED\b/i,
  /\bDOC\b/i,
  /\bTRANSF\b/i,
  /\bDEP[OÓ]SITO\b/i,
  /\bSAQUE\b/i,
  /\bRESGATE\b/i,
];

/**
 * Verifica se uma descrição é um total/valor agregado
 */
function isAggregateValue(description: string): boolean {
  return AGGREGATE_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Verifica se uma descrição é um parcelamento
 */
function isInstallment(description: string): boolean {
  return INSTALLMENT_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Verifica se uma descrição é PIX/transferência
 */
function isTransferOrPix(description: string): boolean {
  return TRANSFER_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Filtra transações que não devem ser consideradas para detecção de assinaturas
 * Remove: totais, parcelamentos, PIX, transferências
 */
function filterInvalidTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => {
    const desc = t.description;

    // Exclui totais e valores agregados
    if (isAggregateValue(desc)) return false;

    // Exclui parcelamentos (não são assinaturas recorrentes)
    if (isInstallment(desc)) return false;

    // Exclui PIX e transferências
    if (isTransferOrPix(desc)) return false;

    return true;
  });
}

/**
 * Valida se um grupo passa nas regras de sanidade matemática
 * Retorna true se o grupo é válido para ser considerado assinatura
 */
function validateGroupSanity(
  group: TransactionGroup,
  allTransactions: readonly Transaction[]
): { valid: boolean; reason?: string } {
  const { transactions, averageAmount } = group;

  // Regra 1: Valor deve ser positivo e razoável
  if (averageAmount <= 0) {
    return { valid: false, reason: 'Valor zero ou negativo' };
  }

  // Regra 2: Validação de sanidade - valor mensal não pode exceder
  // soma de todas as transações do período (impossível matematicamente)
  const totalAllTransactions = allTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  if (averageAmount > totalAllTransactions) {
    return { valid: false, reason: 'Valor excede total do período' };
  }

  // Regra 3: Detecta possíveis valores de parsing incorreto
  // Valores > R$ 50.000 mensais são extremamente raros para assinaturas pessoais
  // e provavelmente são erros de parsing ou totais de fatura
  const MAX_REASONABLE_MONTHLY = 50000;
  if (averageAmount > MAX_REASONABLE_MONTHLY) {
    // Para valores muito altos, exige mais evidência
    // Deve ter alta recorrência E valor muito estável
    const sortedDates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(daysBetween(sortedDates[i - 1]!, sortedDates[i]!));
    }

    // Precisa ter pelo menos 3 ocorrências com intervalos mensais consistentes
    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;
    const isMonthlyConsistent = intervals.length >= 2 && Math.abs(avgInterval - 30) <= 5;

    if (!isMonthlyConsistent) {
      return { valid: false, reason: 'Valor alto sem padrão mensal claro' };
    }
  }

  return { valid: true };
}

/**
 * Para valores elevados (> R$ 500), aplica requisitos mais rigorosos
 */
function validateHighValueSubscription(
  group: TransactionGroup,
  scores: ConfidenceScores
): { valid: boolean; adjustedScore?: number } {
  const HIGH_VALUE_THRESHOLD = 500;

  if (group.averageAmount <= HIGH_VALUE_THRESHOLD) {
    return { valid: true };
  }

  // Para valores altos, exige:
  // 1. Recorrência consistente (score >= 0.6)
  // 2. Estabilidade de valor (score >= 0.7)
  // 3. Descrição estável (similaridade >= 0.8)

  const meetsRecurrence = scores.recurrenceScore >= 0.6;
  const meetsStability = scores.valueStabilityScore >= 0.7;
  const meetsDescriptionStability = group.stringSimilarityScore >= 0.8;

  // Verifica que descrição não contém termos de totalização
  const hasAggregateTerm = Array.from(group.originalNames).some(name => isAggregateValue(name));

  if (hasAggregateTerm) {
    return { valid: false };
  }

  // Se não atende pelo menos 2 dos 3 critérios, descarta
  const criteriaMet = [meetsRecurrence, meetsStability, meetsDescriptionStability]
    .filter(Boolean).length;

  if (criteriaMet < 2) {
    return { valid: false };
  }

  // Aplica penalidade no score se não atende todos os critérios
  if (criteriaMet < 3) {
    return { valid: true, adjustedScore: scores.finalScore * 0.85 };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

/**
 * Detecta assinaturas recorrentes a partir de transações
 */
export async function detectSubscriptions(
  transactions: Transaction[]
): Promise<AnalysisResult> {
  const startTime = Date.now();

  // Filtra apenas débitos (assinaturas são gastos)
  const debits = transactions.filter((t) => t.type === 'debit');

  if (debits.length === 0) {
    return createEmptyResult(startTime, transactions.length);
  }

  // VALIDAÇÃO: Remove transações que não são assinaturas
  // (totais de fatura, parcelamentos, PIX, transferências)
  const validDebits = filterInvalidTransactions(debits);

  if (validDebits.length === 0) {
    return createEmptyResult(startTime, transactions.length);
  }

  // 1. Agrupa transações por descrição similar
  const groups = groupTransactionsBySimilarity(validDebits);

  // 2. Filtra grupos que podem ser assinaturas (mínimo 2 ocorrências)
  const potentialSubscriptions = groups.filter(
    (group) => group.transactions.length >= config.detection.minOccurrences
  );

  // 3. Analisa cada grupo com o sistema de score ponderado
  // VALIDAÇÃO: Aplica regras de sanidade matemática
  const subscriptions: DetectedSubscription[] = [];

  for (const group of potentialSubscriptions) {
    // Validação de sanidade matemática antes do cálculo
    const sanityCheck = validateGroupSanity(group, transactions);
    if (!sanityCheck.valid) {
      continue; // Descarta grupos que falham na validação
    }

    const subscription = analyzeGroupWithScore(group, transactions);
    if (subscription) {
      subscriptions.push(subscription);
    }
  }

  // 4. Ordena por score (maior primeiro), depois por valor
  subscriptions.sort((a, b) => {
    const scoreDiff = (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0);
    if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
    return b.monthlyAmount - a.monthlyAmount;
  });

  // 5. Calcula resumo
  const summary = calculateSummary(subscriptions, transactions);

  // 6. Monta metadados
  const metadata = createMetadata(startTime, transactions);

  return {
    subscriptions,
    summary,
    metadata,
  };
}

// ═══════════════════════════════════════════════════════════════
// AGRUPAMENTO
// ═══════════════════════════════════════════════════════════════

/**
 * Agrupa transações com descrições similares
 */
function groupTransactionsBySimilarity(
  transactions: Transaction[]
): TransactionGroup[] {
  const groups: TransactionGroup[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < transactions.length; i++) {
    if (processed.has(i)) continue;

    const baseTransaction = transactions[i]!;
    const baseName = normalizeDescription(baseTransaction.description);

    const group: TransactionGroup = {
      normalizedName: baseName,
      originalNames: new Set([baseTransaction.description]),
      transactions: [baseTransaction],
      averageAmount: baseTransaction.amount,
      stringSimilarityScore: 1.0, // Similaridade consigo mesmo
    };

    processed.add(i);

    const similarities: number[] = [1.0];

    // Procura outras transações similares
    for (let j = i + 1; j < transactions.length; j++) {
      if (processed.has(j)) continue;

      const candidate = transactions[j]!;
      const candidateName = normalizeDescription(candidate.description);

      // Verifica similaridade de descrição
      const similarity = calculateSimilarity(baseName, candidateName);

      if (similarity >= config.detection.similarityThreshold) {
        // Verifica também se os valores são próximos
        const amountSimilar = isWithinTolerance(
          baseTransaction.amount,
          candidate.amount,
          config.detection.amountTolerancePercent
        );

        if (amountSimilar) {
          group.transactions.push(candidate);
          group.originalNames.add(candidate.description);
          similarities.push(similarity);
          processed.add(j);
        }
      }
    }

    // Calcula média de valores e similaridade do grupo
    const amounts = group.transactions.map((t) => t.amount);
    group.averageAmount = calculateAverage(amounts);
    group.stringSimilarityScore = calculateAverage(similarities);

    groups.push(group);
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISE COM SCORE PONDERADO
// ═══════════════════════════════════════════════════════════════

/**
 * Analisa um grupo de transações usando o sistema de score ponderado
 */
function analyzeGroupWithScore(
  group: TransactionGroup,
  allTransactions: readonly Transaction[]
): DetectedSubscription | null {
  const { transactions } = group;

  // Extrai datas e valores
  const dates = transactions.map((t) => t.date);
  const amounts = transactions.map((t) => t.amount);

  // Identifica serviço conhecido
  const serviceName = extractServiceName(group.normalizedName);
  const knownService = findKnownService(serviceName);

  // Calcula cada score individual
  const scores = calculateAllScores(
    group,
    dates,
    amounts,
    knownService
  );

  // VALIDAÇÃO: Para valores altos, aplica requisitos mais rigorosos
  const highValueCheck = validateHighValueSubscription(group, scores);
  if (!highValueCheck.valid) {
    return null;
  }

  // Aplica ajuste de score se necessário (penalidade para valores altos com menos evidência)
  const finalScore = highValueCheck.adjustedScore ?? scores.finalScore;

  // Se score muito baixo e não é serviço conhecido, descarta
  if (finalScore < 0.40 && !knownService) {
    return null;
  }

  // Determina nível de confiança
  const confidenceLevel = getConfidenceLevel(finalScore);

  // Gera razões de confiança
  const confidenceReasons = generateConfidenceReasons(
    { ...scores, finalScore },
    knownService
  );

  // Monta a assinatura detectada
  // IMPORTANTE: monthlyAmount é derivado APENAS das transações reais detectadas
  const avgAmount = calculateAverage(amounts);

  const subscription: DetectedSubscription = {
    id: generateId(),
    name: knownService?.canonicalName ?? capitalizeServiceName(serviceName),
    originalNames: Array.from(group.originalNames),
    // O valor mensal é calculado a partir da média das transações reais
    monthlyAmount: roundToTwo(avgAmount),
    // O impacto anual é SEMPRE: valor mensal * 12 (derivado dos dados reais)
    annualAmount: roundToTwo(avgAmount * 12),
    occurrences: transactions.length,
    transactions: transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Mais recente primeiro
      .map(
        (t): SubscriptionTransaction => ({
          date: t.date,
          amount: t.amount,
          description: t.description,
        })
      ),
    confidence: confidenceLevel,
    confidenceScore: roundToTwo(finalScore * 100) / 100, // 0-1 com 2 decimais
    confidenceReasons,
    ...(knownService?.category && { category: knownService.category }),
    ...(knownService && { cancelInstructions: getCancelInstructions(knownService) }),
  };

  return subscription;
}

/**
 * Calcula todos os scores de confiança
 */
function calculateAllScores(
  group: TransactionGroup,
  dates: Date[],
  amounts: number[],
  knownService: KnownService | null
): ConfidenceScores {
  // 1. Score de similaridade de string (já calculado no grupo)
  const stringSimilarityScore = group.stringSimilarityScore;

  // 2. Score de recorrência temporal
  const recurrenceScore = calculateRecurrenceScore(dates);

  // 3. Score de estabilidade de valor
  const valueStabilityScore = calculateValueStabilityScore(amounts);

  // 4. Bônus por serviço conhecido
  const knownServiceBonus = calculateKnownServiceBonus(
    knownService,
    calculateAverage(amounts)
  );

  // Calcula score final ponderado
  const finalScore =
    stringSimilarityScore * SCORE_WEIGHTS.stringSimilarity +
    recurrenceScore * SCORE_WEIGHTS.recurrence +
    valueStabilityScore * SCORE_WEIGHTS.valueStability +
    knownServiceBonus * SCORE_WEIGHTS.knownService;

  return {
    stringSimilarityScore,
    recurrenceScore,
    valueStabilityScore,
    knownServiceBonus,
    finalScore: Math.min(1, finalScore), // Cap em 1.0
  };
}

/**
 * Calcula score de recorrência temporal (0-1)
 *
 * Analisa se os intervalos entre transações são consistentes (~30 dias)
 */
function calculateRecurrenceScore(dates: Date[]): number {
  if (dates.length < 2) return 0;

  // Ordena as datas
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Calcula intervalos entre datas consecutivas
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const interval = daysBetween(sorted[i - 1]!, sorted[i]!);
    intervals.push(interval);
  }

  // Intervalo ideal é 30 dias (mensal)
  const idealInterval = 30;
  const tolerance = config.detection.dateToleranceDays;

  // Calcula quão próximo cada intervalo está do ideal
  let totalScore = 0;
  for (const interval of intervals) {
    const deviation = Math.abs(interval - idealInterval);

    if (deviation <= tolerance) {
      // Dentro da tolerância: score alto
      totalScore += 1 - deviation / (tolerance * 2);
    } else if (deviation <= tolerance * 2) {
      // Próximo da tolerância: score médio
      totalScore += 0.5 - (deviation - tolerance) / (tolerance * 4);
    } else {
      // Fora da tolerância: score baixo (mas não zero)
      totalScore += Math.max(0, 0.2 - deviation / 100);
    }
  }

  return totalScore / intervals.length;
}

/**
 * Calcula score de estabilidade de valor (0-1)
 *
 * Quanto mais consistentes os valores, maior o score
 */
function calculateValueStabilityScore(amounts: number[]): number {
  if (amounts.length < 2) return 0.5; // Neutro para uma única transação

  const avg = calculateAverage(amounts);
  if (avg === 0) return 0;

  // Calcula coeficiente de variação (desvio padrão / média)
  const squaredDiffs = amounts.map((a) => Math.pow(a - avg, 2));
  const variance = calculateAverage(squaredDiffs);
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;

  // Converte CV em score (quanto menor o CV, maior o score)
  // CV = 0 → score = 1
  // CV = 0.15 (15%) → score ≈ 0.5
  // CV > 0.30 → score baixo
  const score = Math.exp(-coefficientOfVariation * 5);

  return Math.min(1, Math.max(0, score));
}

/**
 * Calcula bônus por ser serviço conhecido (0-1)
 */
function calculateKnownServiceBonus(
  service: KnownService | null,
  avgAmount: number
): number {
  if (!service) return 0;

  let bonus = 0.7; // Base por ser serviço conhecido

  // Bônus extra se é serviço popular
  if (service.isPopular) {
    bonus += 0.15;
  }

  // Bônus se o valor está na faixa típica
  if (isValueInTypicalRange(service, avgAmount)) {
    bonus += 0.15;
  }

  return Math.min(1, bonus);
}

/**
 * Determina o nível de confiança baseado no score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Gera razões de confiança para exibição
 */
function generateConfidenceReasons(
  scores: ConfidenceScores,
  knownService: KnownService | null
): string[] {
  const reasons: string[] = [];

  // Recorrência
  if (scores.recurrenceScore >= 0.8) {
    reasons.push('Padrão mensal consistente');
  } else if (scores.recurrenceScore >= 0.5) {
    reasons.push('Padrão mensal detectado');
  }

  // Estabilidade de valor
  if (scores.valueStabilityScore >= 0.8) {
    reasons.push('Valores muito consistentes');
  } else if (scores.valueStabilityScore >= 0.5) {
    reasons.push('Valores similares');
  }

  // Serviço conhecido
  if (knownService) {
    if (knownService.isPopular) {
      reasons.push('Serviço popular reconhecido');
    } else {
      reasons.push('Serviço de assinatura conhecido');
    }
  }

  // Score geral
  if (scores.finalScore >= 0.9) {
    reasons.push('Confiança muito alta');
  }

  // Se não tem razões, adiciona uma genérica
  if (reasons.length === 0) {
    reasons.push('Padrão de cobrança recorrente');
  }

  return reasons;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula o resumo da análise
 */
function calculateSummary(
  subscriptions: readonly DetectedSubscription[],
  allTransactions: readonly Transaction[]
): AnalysisSummary {
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);

  const dates = allTransactions.map((t) => t.date);
  const dateRange = getDateRange([...dates]);

  const highCount = subscriptions.filter((s) => s.confidence === 'high').length;
  const mediumCount = subscriptions.filter((s) => s.confidence === 'medium').length;
  const lowCount = subscriptions.filter((s) => s.confidence === 'low').length;

  return {
    totalMonthlySpending: roundToTwo(totalMonthly),
    totalAnnualSpending: roundToTwo(totalMonthly * 12),
    subscriptionCount: subscriptions.length,
    highConfidenceCount: highCount,
    mediumConfidenceCount: mediumCount,
    lowConfidenceCount: lowCount,
    periodStart: dateRange?.start ?? new Date(),
    periodEnd: dateRange?.end ?? new Date(),
    transactionsAnalyzed: allTransactions.length,
  };
}

/**
 * Cria metadados da análise
 */
function createMetadata(
  startTime: number,
  transactions: readonly Transaction[]
): AnalysisMetadata {
  const banksDetected = new Set(transactions.map((t) => t.source));

  return {
    processedAt: new Date(),
    processingTimeMs: Date.now() - startTime,
    filesProcessed: 1,
    bankFormatsDetected: Array.from(banksDetected),
    version: config.version,
  };
}

/**
 * Cria resultado vazio
 */
function createEmptyResult(
  startTime: number,
  transactionCount: number
): AnalysisResult {
  return {
    subscriptions: [],
    summary: {
      totalMonthlySpending: 0,
      totalAnnualSpending: 0,
      subscriptionCount: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
      transactionsAnalyzed: transactionCount,
    },
    metadata: {
      processedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
      filesProcessed: 0,
      bankFormatsDetected: [],
      version: config.version,
    },
  };
}

/**
 * Gera um ID único para a assinatura
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sub_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
