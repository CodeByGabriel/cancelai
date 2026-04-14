/**
 * Parser PicPay
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /picpay|pic\s*pay/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Descrição', 'descricao', 'Título', 'titulo'],
  amount: ['Valor', 'valor', 'VALOR'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,60}?)\s+R?\$?\s*(-?[\d.,]+)/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const picpayParser: BankParserPlugin = {
  bankId: 'picpay',
  displayName: 'PicPay',
  bankCode: '380',
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

registry.register(picpayParser);
export default picpayParser;
