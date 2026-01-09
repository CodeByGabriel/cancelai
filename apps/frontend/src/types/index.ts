/**
 * Tipos compartilhados do frontend
 * Espelha os tipos da API para type safety
 */

export interface DetectedSubscription {
  id: string;
  name: string;
  originalNames: string[];
  monthlyAmount: number;
  annualAmount: number;
  occurrences: number;
  transactions: SubscriptionTransaction[];
  confidence: 'high' | 'medium' | 'low';
  confidenceScore?: number; // Score numérico 0-1 para exibição
  confidenceReasons: string[];
  category?: SubscriptionCategory;
  cancelInstructions?: string;
}

export interface SubscriptionTransaction {
  date: string;
  amount: number;
  description: string;
}

export type SubscriptionCategory =
  | 'streaming'
  | 'music'
  | 'gaming'
  | 'software'
  | 'cloud'
  | 'news'
  | 'fitness'
  | 'food'
  | 'transport'
  | 'education'
  | 'finance'
  | 'other';

export interface AnalysisSummary {
  totalMonthlySpending: number;
  totalAnnualSpending: number;
  subscriptionCount: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  periodStart: string;
  periodEnd: string;
  transactionsAnalyzed: number;
}

export interface AnalysisMetadata {
  processedAt: string;
  processingTimeMs: number;
  filesProcessed: number;
  bankFormatsDetected: string[];
  version: string;
}

export interface AnalysisResult {
  subscriptions: DetectedSubscription[];
  summary: AnalysisSummary;
  metadata: AnalysisMetadata;
  warnings?: string[]; // Avisos informativos (não são erros)
  info?: string[]; // Mensagens informativas para o usuário
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

/**
 * Estados mais granulares para feedback de progresso
 */
export type AnalysisStep =
  | 'uploading'
  | 'reading'
  | 'analyzing'
  | 'validating'
  | 'complete';
