/**
 * Barrel export para serviços
 */
export { analyzeStatements, type AnalysisServiceResult } from './analysis-service.js';
export {
  classifyWithAI,
  classifyAmbiguousCharges,
  separateSubscriptions,
  isAIConfigured,
  type AmbiguousChargeSummary,
  type AIClassification,
  type AIClassificationResult,
} from './ai-classifier.js';
export {
  SSEManager,
  type SSEManagerConfig,
  type SSEMetrics,
} from './sse-manager.js';
export {
  registerConsent,
  revokeConsent,
  hasConsent,
  getConsent,
  serializeConsent,
  getConsentMetrics,
  type ConsentScope,
} from './consent-service.js';
export {
  trackAnalysis,
  deleteAnalysis,
  deleteBySession,
  getRetentionMetrics,
} from './data-retention-service.js';
export {
  createLink,
  getAccounts,
  getTransactions,
  revokeConnection,
  isOpenFinanceConfigured,
  type OpenFinanceLink,
  type OpenFinanceAccount,
  type OpenFinanceTransaction,
} from './open-finance.service.js';
