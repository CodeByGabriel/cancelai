/**
 * Parser Banco Original
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /banco original|original/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Descrição', 'descricao', 'Lançamento'],
  amount: ['Valor', 'valor', 'VALOR'],
  type: ['Tipo', 'D/C'],
} as const;

const originalParser: BankParserPlugin = {
  bankId: 'original',
  displayName: 'Banco Original',
  bankCode: '212',
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

registry.register(originalParser);
export default originalParser;
