/**
 * Parser C6 Bank
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /c6\s*bank|c6bank/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA', 'Data da Transação'],
  description: ['Descrição', 'descricao', 'DESCRICAO', 'Estabelecimento'],
  amount: ['Valor', 'valor', 'VALOR'],
} as const;

const c6Parser: BankParserPlugin = {
  bankId: 'c6',
  displayName: 'C6 Bank',
  bankCode: '336',
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

registry.register(c6Parser);
export default c6Parser;
