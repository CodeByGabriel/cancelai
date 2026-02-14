/**
 * Pipeline Events & Types
 *
 * Define todos os tipos de eventos SSE, o contexto compartilhado
 * entre stages, e a interface que cada stage deve implementar.
 *
 * DECISAO: PipelineContext e mutavel internamente (stages escrevem nele)
 * mas todos os event types sao readonly (imutaveis apos emitidos).
 */

import type {
  Transaction,
  DetectedSubscription,
  DetectedInstallment,
  AnalysisResult,
  ParseResult,
  RecurrencePeriodType,
  RecurrenceMetrics,
} from '../types/index.js';
import type { FileToProcess } from '../parsers/index.js';

// ═══════════════════════════════════════════════════════════════
// TRANSACTION GROUP — extraido de subscription-detector.ts
// ═══════════════════════════════════════════════════════════════

/**
 * Grupo de transacoes com descricoes similares
 * Compartilhado entre grouping-stage e scoring-stage
 */
export interface TransactionGroup {
  normalizedName: string;
  originalNames: Set<string>;
  transactions: Transaction[];
  averageAmount: number;
  stringSimilarityScore: number;
  habitualityScore?: number | undefined;
  streamMaturity?: number | undefined;
  detectedPeriod?: RecurrencePeriodType | undefined;
  recurrenceMetrics?: RecurrenceMetrics | undefined;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE CONTEXT — estado compartilhado entre stages
// ═══════════════════════════════════════════════════════════════

export interface PipelineContext {
  /** ID unico para rastreamento (sem dados sensiveis) */
  readonly requestId: string;
  /** Signal do AbortController para timeout global */
  readonly signal: AbortSignal;
  /** Timestamp de inicio para calculo de duracao */
  readonly startTime: number;

  // --- Campos acumulados pelos stages ---
  files: FileToProcess[];
  parseResults: ParseResult[];
  transactions: Transaction[];
  validTransactions: Transaction[];
  groups: TransactionGroup[];
  scoredSubscriptions: DetectedSubscription[];
  finalSubscriptions: DetectedSubscription[];
  installments: DetectedInstallment[];
  errors: string[];
  warnings: string[];
  info: string[];
  banksDetected: string[];
  /** Flag indicando que controller ja validou os arquivos */
  filesValidated: boolean;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE EVENTS — discriminated union
// ═══════════════════════════════════════════════════════════════

export interface StageStartEvent {
  readonly type: 'stage-start';
  readonly stage: string;
  readonly timestamp: number;
}

export interface StageCompleteEvent {
  readonly type: 'stage-complete';
  readonly stage: string;
  readonly timestamp: number;
  readonly durationMs: number;
  readonly summary: Record<string, number | string>;
}

export interface SubscriptionDetectedEvent {
  readonly type: 'subscription-detected';
  readonly subscription: DetectedSubscription;
  readonly index: number;
  readonly total: number;
}

export interface ProgressEvent {
  readonly type: 'progress';
  readonly stage: string;
  readonly current: number;
  readonly total: number;
  readonly message: string;
}

export interface FileErrorEvent {
  readonly type: 'file-error';
  readonly filename: string;
  readonly error: string;
}

export interface FilePartialEvent {
  readonly type: 'file-partial';
  readonly filename: string;
  readonly transactionCount: number;
  readonly bankDetected: string;
}

export interface CompleteEvent {
  readonly type: 'complete';
  readonly result: AnalysisResult;
  readonly durationMs: number;
}

export interface ErrorEvent {
  readonly type: 'error';
  readonly code: string;
  readonly message: string;
  readonly recoverable: boolean;
}

export type PipelineEvent =
  | StageStartEvent
  | StageCompleteEvent
  | SubscriptionDetectedEvent
  | ProgressEvent
  | FileErrorEvent
  | FilePartialEvent
  | CompleteEvent
  | ErrorEvent;

// ═══════════════════════════════════════════════════════════════
// PIPELINE STAGE INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface PipelineStage {
  readonly name: string;
  execute(context: PipelineContext): AsyncGenerator<PipelineEvent>;
  canSkip?(context: PipelineContext): boolean;
  readonly timeout?: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE SCORES (shared by scoring-stage and sanity-stage)
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceScores {
  readonly stringSimilarityScore: number;
  readonly recurrenceScore: number;
  readonly valueStabilityScore: number;
  readonly knownServiceBonus: number;
  readonly habitualityScore: number;
  readonly streamMaturity: number;
  readonly finalScore: number;
}
