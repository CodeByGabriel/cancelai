/**
 * Parser Caixa Economica Federal
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /caixa economica|caixa federal|cef/i;

const CSV_COLUMNS = {
  date: ['Data Mov.', 'Data', 'DATA'],
  description: ['Histórico', 'Descrição', 'DESCRICAO'],
  amount: ['Valor', 'VALOR'],
  type: ['Débito/Crédito', 'D/C'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*$/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const caixaParser: BankParserPlugin = {
  bankId: 'caixa',
  displayName: 'Caixa Econômica',
  bankCode: '104',
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
      return parsePDFWithPattern(content, PDF_PATTERN, parseStandardDate, this.displayName, PDF_FALLBACK);
    }
    return [];
  },
};

registry.register(caixaParser);
export default caixaParser;
