/**
 * Tipos compartilhados do frontend
 * Espelha os tipos da API para type safety
 */

export type RecurrencePeriodType =
  | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'
  | 'quarterly' | 'semiannual' | 'annual' | 'unknown';

export type CancelMethod = 'web' | 'app' | 'phone' | 'platform' | 'telecom';

export interface DetectedSubscription {
  id: string;
  name: string;
  originalNames: string[];
  monthlyAmount: number;
  annualAmount: number;
  occurrences: number;
  transactions: SubscriptionTransaction[];
  confidence: 'high' | 'medium' | 'low';
  confidenceScore?: number;
  confidenceReasons: string[];
  category?: SubscriptionCategory;
  cancelInstructions?: string;
  cancelMethod?: CancelMethod;
  detectedPeriod?: RecurrencePeriodType;
  priceRangeFlag?: 'normal' | 'promo' | 'above_range';
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

export interface DetectedInstallment {
  description: string;
  originalDescription: string;
  amount: number;
  date: string;
  installmentInfo?: { current: number; total: number };
}

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
  warnings?: string[];
  info?: string[];
  installments?: DetectedInstallment[];
}

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ══════════════════════════════════════════════════════════════
// SSE Event types (espelha backend PipelineEvent)
// ══════════════════════════════════════════════════════════════

export interface SSEStageStartEvent {
  type: 'stage-start';
  stage: string;
  timestamp: number;
}

export interface SSEStageCompleteEvent {
  type: 'stage-complete';
  stage: string;
  timestamp: number;
  durationMs: number;
  summary: Record<string, number | string>;
}

export interface SSESubscriptionDetectedEvent {
  type: 'subscription-detected';
  subscription: DetectedSubscription;
  index: number;
  total: number;
}

export interface SSEProgressEvent {
  type: 'progress';
  stage: string;
  current: number;
  total: number;
  message: string;
}

export interface SSEFilePartialEvent {
  type: 'file-partial';
  filename: string;
  transactionCount: number;
  bankDetected: string;
}

export interface SSEFileErrorEvent {
  type: 'file-error';
  filename: string;
  error: string;
}

export interface SSECompleteEvent {
  type: 'complete';
  result: AnalysisResult;
  durationMs: number;
}

export interface SSEErrorEvent {
  type: 'error';
  code: string;
  message: string;
  recoverable: boolean;
}

export type SSEEvent =
  | SSEStageStartEvent
  | SSEStageCompleteEvent
  | SSESubscriptionDetectedEvent
  | SSEProgressEvent
  | SSEFilePartialEvent
  | SSEFileErrorEvent
  | SSECompleteEvent
  | SSEErrorEvent;

// ══════════════════════════════════════════════════════════════
// State Machine types
// ══════════════════════════════════════════════════════════════

export type AppState =
  | { status: 'idle' }
  | { status: 'uploading'; files: File[] }
  | { status: 'connecting-bank' }
  | { status: 'fetching-transactions'; connectionId: string; accountId: string }
  | { status: 'processing'; files: File[]; jobId: string; streamUrl: string }
  | {
      status: 'streaming';
      files: File[];
      jobId: string;
      streamUrl: string;
      subscriptions: DetectedSubscription[];
      progressMessage: string;
      currentStage: string;
      filesProcessed: string[];
      startTime: number;
    }
  | { status: 'complete'; result: AnalysisResult; durationMs: number }
  | { status: 'error'; message: string; canRetry: boolean };

export type AppAction =
  | { type: 'START_UPLOAD'; files: File[] }
  | { type: 'UPLOAD_COMPLETE'; jobId: string; streamUrl: string }
  | { type: 'START_BANK_CONNECTION' }
  | { type: 'BANK_CONNECTED'; connectionId: string; accountId: string }
  | { type: 'OPEN_FINANCE_READY'; jobId: string; streamUrl: string }
  | { type: 'SSE_CONNECTED' }
  | { type: 'SUBSCRIPTION_DETECTED'; subscription: DetectedSubscription }
  | { type: 'PROGRESS'; stage: string; message: string }
  | { type: 'FILE_PROCESSED'; filename: string; bank: string }
  | { type: 'COMPLETE'; result: AnalysisResult; durationMs: number }
  | { type: 'ERROR'; message: string; canRetry: boolean }
  | { type: 'RESET' }
  | { type: 'FALLBACK_COMPLETE'; result: AnalysisResult };
