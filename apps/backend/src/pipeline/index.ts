/**
 * Barrel export para o pipeline
 */
export { runPipeline, runPipelineFromTransactions, createPipelineContext, buildAnalysisResult } from './pipeline-orchestrator.js';
export type {
  PipelineContext,
  PipelineEvent,
  PipelineStage,
  TransactionGroup,
  StageStartEvent,
  StageCompleteEvent,
  SubscriptionDetectedEvent,
  ProgressEvent,
  FileErrorEvent,
  FilePartialEvent,
  CompleteEvent,
  ErrorEvent,
} from './pipeline-events.js';
