/**
 * Parser Bradesco
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /bradesco/i;

const CSV_COLUMNS = {
  date: ['Data', 'DATA', 'Dt. Movimento'],
  description: ['Histórico', 'HISTORICO', 'Descrição', 'Lancamento'],
  amount: ['Valor', 'VALOR', 'Vlr. Movimento'],
  type: ['D/C', 'Tipo'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*([DC])?$/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const bradescoParser: BankParserPlugin = {
  bankId: 'bradesco',
  displayName: 'Bradesco',
  bankCode: '237',
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

registry.register(bradescoParser);
export default bradescoParser;
