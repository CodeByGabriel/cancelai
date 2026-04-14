/**
 * Parser Banco do Brasil
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /banco do brasil|bb\s|^bb$/i;

const CSV_COLUMNS = {
  date: ['Data', 'DATA', 'data'],
  description: ['Histórico', 'HISTORICO', 'Descrição'],
  amount: ['Valor', 'VALOR'],
  type: ['Tipo'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*$/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const bbParser: BankParserPlugin = {
  bankId: 'bb',
  displayName: 'Banco do Brasil',
  bankCode: '001',
  supportedFormats: ['csv', 'pdf'],

  canParse(content: string, metadata: FileMetadata): boolean {
    if (!this.supportedFormats.includes(metadata.format)) return false;
    return DETECT.test(content);
  },

  parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format === 'csv') {
      return Promise.resolve(parseCSVWithMapping(content, CSV_COLUMNS, this.displayName));
    }
    if (options.format === 'pdf') {
      return Promise.resolve(parsePDFWithPattern(content, PDF_PATTERN, parseStandardDate, this.displayName, PDF_FALLBACK));
    }
    return Promise.resolve([]);
  },
};

registry.register(bbParser);
export default bbParser;
