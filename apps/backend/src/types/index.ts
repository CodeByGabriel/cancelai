/**
 * Tipos centrais do Cancelaí
 *
 * DECISÃO DE DESIGN: Todos os tipos são imutáveis (readonly) para prevenir
 * mutações acidentais durante o processamento de dados sensíveis.
 */

/**
 * Representa uma transação bancária normalizada
 */
export interface Transaction {
  readonly date: Date;
  readonly description: string;
  readonly originalDescription: string; // Mantém descrição original para auditoria
  readonly amount: number; // Sempre positivo, tipo indica direção
  readonly type: 'debit' | 'credit';
  readonly source: string; // Qual banco/formato originou
}

/**
 * Transação com metadados adicionais após processamento
 */
export interface ProcessedTransaction extends Transaction {
  readonly normalizedDescription: string; // Descrição limpa para comparação
  readonly hash: string; // Hash único para deduplicação
}

/**
 * Tipo de periodo de recorrencia detectado
 */
export type RecurrencePeriodType =
  | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'
  | 'quarterly' | 'semiannual' | 'annual' | 'unknown';

/**
 * Metricas de recorrencia calculadas para um grupo de transacoes
 */
export interface RecurrenceMetrics {
  readonly medianInterval: number;
  readonly periodType: RecurrencePeriodType;
  readonly habitualityScore: number;
  readonly streamMaturity: number;
  readonly intervalCount: number;
  readonly intervals: readonly number[];
}

/**
 * Parcela detectada (separada de assinaturas)
 */
export interface DetectedInstallment {
  readonly description: string;
  readonly originalDescription: string;
  readonly amount: number;
  readonly date: Date;
  readonly installmentInfo?: { readonly current: number; readonly total: number } | undefined;
}

/**
 * Representa uma assinatura detectada
 */
export interface DetectedSubscription {
  readonly id: string;
  readonly name: string; // Nome normalizado do serviço
  readonly originalNames: readonly string[]; // Todas as variações encontradas
  readonly monthlyAmount: number;
  readonly annualAmount: number;
  readonly occurrences: number; // Quantas vezes foi cobrada no período
  readonly transactions: readonly SubscriptionTransaction[];
  readonly confidence: 'high' | 'medium' | 'low';
  readonly confidenceScore?: number; // Score numérico 0-1 para ordenação e exibição
  readonly confidenceReasons: readonly string[];
  readonly category?: SubscriptionCategory;
  readonly cancelInstructions?: string;
  readonly detectedPeriod?: RecurrencePeriodType | undefined;
  readonly priceRangeFlag?: 'normal' | 'promo' | 'above_range' | undefined;
}

/**
 * Transação associada a uma assinatura
 */
export interface SubscriptionTransaction {
  readonly date: Date;
  readonly amount: number;
  readonly description: string;
}

/**
 * Categorias de assinaturas conhecidas (14 categorias)
 */
export type SubscriptionCategory =
  | 'streaming'
  | 'music'
  | 'gaming'
  | 'software'
  | 'education'
  | 'fitness'
  | 'food'
  | 'transport'
  | 'telecom'
  | 'news'
  | 'security'
  | 'dating'
  | 'finance'
  | 'other';

/**
 * Método de cancelamento do serviço
 */
export type CancelMethod = 'web' | 'app' | 'phone' | 'platform' | 'telecom';

/**
 * Resultado do processamento de extratos
 */
export interface AnalysisResult {
  readonly subscriptions: readonly DetectedSubscription[];
  readonly summary: AnalysisSummary;
  readonly metadata: AnalysisMetadata;
  readonly warnings?: readonly string[]; // Avisos informativos (não são erros)
  readonly info?: readonly string[]; // Mensagens informativas para o usuário
  readonly installments?: readonly DetectedInstallment[] | undefined;
}

/**
 * Resumo da análise
 */
export interface AnalysisSummary {
  readonly totalMonthlySpending: number;
  readonly totalAnnualSpending: number;
  readonly subscriptionCount: number;
  readonly highConfidenceCount: number;
  readonly mediumConfidenceCount: number;
  readonly lowConfidenceCount: number;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly transactionsAnalyzed: number;
}

/**
 * Metadados da análise (para debugging, sem dados sensíveis)
 */
export interface AnalysisMetadata {
  readonly processedAt: Date;
  readonly processingTimeMs: number;
  readonly filesProcessed: number;
  readonly bankFormatsDetected: readonly string[];
  readonly version: string;
}

/**
 * Configuração de um parser de banco
 */
export interface BankParserConfig {
  readonly name: string;
  readonly patterns: readonly RegExp[];
  readonly dateFormats: readonly string[];
  readonly columnMappings?: CSVColumnMapping;
}

/**
 * Mapeamento de colunas para CSV
 */
export interface CSVColumnMapping {
  readonly date: string | readonly string[];
  readonly description: string | readonly string[];
  readonly amount: string | readonly string[];
  readonly type?: string | readonly string[];
}

/**
 * Resultado do parsing de um arquivo
 */
export interface ParseResult {
  readonly success: boolean;
  readonly transactions: readonly Transaction[];
  readonly bankDetected: string;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Erro estruturado da API
 */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
}
