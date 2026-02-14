/**
 * Parser Itau
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /itau|itaú/i;

const CSV_COLUMNS = {
  date: ['data', 'Data', 'DATA', 'dt_lancamento'],
  description: ['historico', 'Historico', 'HISTORICO', 'descricao', 'lancamento'],
  amount: ['valor', 'Valor', 'VALOR'],
  type: ['tipo', 'Tipo', 'TIPO', 'dc', 'DC'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*([DC])?$/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const itauParser: BankParserPlugin = {
  bankId: 'itau',
  displayName: 'Itaú',
  bankCode: '341',
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

registry.register(itauParser);
export default itauParser;
