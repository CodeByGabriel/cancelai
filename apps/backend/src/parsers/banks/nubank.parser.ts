/**
 * Parser Nubank
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseNubankDate, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /nubank|nu pagamentos|nu bank/i;

const CSV_COLUMNS = {
  date: ['Data', 'date', 'data'],
  description: ['Descrição', 'Título', 'description', 'titulo', 'descricao'],
  amount: ['Valor', 'value', 'valor', 'amount'],
} as const;

const PDF_PATTERN =
  /(\d{2}\s+(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+\d{4})\s+(.+?)\s+R?\$?\s*([\d.,]+)/gi;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const nubankParser: BankParserPlugin = {
  bankId: 'nubank',
  displayName: 'Nubank',
  bankCode: '260',
  supportedFormats: ['csv', 'pdf'],

  canParse(content: string, metadata: FileMetadata): boolean {
    if (!this.supportedFormats.includes(metadata.format)) return false;
    return DETECT.test(content);
  },

  async parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format === 'csv') {
      return parseCSVWithMapping(content, CSV_COLUMNS, this.displayName);
    }
    if (options.format === 'pdf') {
      return parsePDFWithPattern(content, PDF_PATTERN, parseNubankDate, this.displayName, PDF_FALLBACK);
    }
    return [];
  },
};

registry.register(nubankParser);
export default nubankParser;
