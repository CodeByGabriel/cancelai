/**
 * Parser BTG Pactual
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';

const DETECT = /btg\s*pactual|btg/i;

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA'],
  description: ['Descrição', 'descricao', 'Histórico'],
  amount: ['Valor', 'VALOR'],
} as const;

const btgParser: BankParserPlugin = {
  bankId: 'btg',
  displayName: 'BTG Pactual',
  bankCode: '208',
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

registry.register(btgParser);
export default btgParser;
