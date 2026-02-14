/**
 * Parser Agibank
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /agibank|agi bank/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Descrição', 'descricao', 'Lançamento'],
  amount: ['Valor', 'valor', 'VALOR'],
} as const;

const agibankParser: BankParserPlugin = {
  bankId: 'agibank',
  displayName: 'Agibank',
  bankCode: '121',
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

registry.register(agibankParser);
export default agibankParser;
