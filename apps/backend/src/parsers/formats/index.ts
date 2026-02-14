/**
 * Barrel export para format helpers
 */
export {
  detectDelimiter,
  parseCSVRecords,
  resolveColumn,
  extractRecordValue,
  parseCSVTransaction,
  parseCSVWithMapping,
} from './csv-format.js';

export {
  normalizeText,
  matchTransactions,
  cleanDescription,
  determineTransactionType,
  parseNubankDate,
  parseStandardDate,
  convertMatchesToTransactions,
  parsePDFWithPattern,
} from './pdf-format.js';
export type { DateParser, RawTransactionMatch } from './pdf-format.js';

export {
  isOFXContent,
  parseOFXTransactions,
} from './ofx-format.js';
