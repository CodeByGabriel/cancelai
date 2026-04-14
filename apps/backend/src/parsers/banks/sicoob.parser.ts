/**
 * Parser Sicoob
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /sicoob|cooperativa/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA', 'Data Movimento'],
  description: ['Histórico', 'Descrição', 'DESCRICAO'],
  amount: ['Valor', 'VALOR'],
  type: ['D/C', 'Tipo'],
} as const;

const sicoobParser: BankParserPlugin = {
  bankId: 'sicoob',
  displayName: 'Sicoob',
  bankCode: '756',
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

registry.register(sicoobParser);
export default sicoobParser;
