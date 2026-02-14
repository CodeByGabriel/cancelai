/**
 * Parser Sicredi
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /sicredi/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Histórico', 'Descrição', 'Lançamento'],
  amount: ['Valor', 'VALOR'],
  type: ['D/C', 'Tipo'],
} as const;

const sicrediParser: BankParserPlugin = {
  bankId: 'sicredi',
  displayName: 'Sicredi',
  bankCode: '748',
  supportedFormats: ['csv'],

  canParse(content: string, metadata: FileMetadata): boolean {
    if (metadata.format !== 'csv') return false;
    return DETECT.test(content);
  },

  async parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format !== 'csv') return [];
    return parseCSVWithMapping(content, CSV_COLUMNS, this.displayName);
  },
};

registry.register(sicrediParser);
export default sicrediParser;
