/**
 * Parser XP Investimentos
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /xp\s*investimentos|xp\s*inc/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Descrição', 'descricao', 'Histórico', 'Movimentação'],
  amount: ['Valor', 'VALOR'],
} as const;

const xpParser: BankParserPlugin = {
  bankId: 'xp',
  displayName: 'XP Investimentos',
  bankCode: '102',
  supportedFormats: ['csv'],

  canParse(content: string, metadata: FileMetadata): boolean {
    if (metadata.format !== 'csv') return false;
    return DETECT.test(content);
  },

  parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format !== 'csv') return Promise.resolve([]);
    return Promise.resolve(parseCSVWithMapping(content, CSV_COLUMNS, this.displayName));
  },
};

registry.register(xpParser);
export default xpParser;
