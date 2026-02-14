/**
 * Parser Genérico (fallback)
 *
 * Usado quando nenhum parser específico de banco detecta o arquivo.
 * Tenta extrair transações usando heurísticas genéricas.
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';
import { parseOFXTransactions } from '../formats/ofx-format.js';

const CSV_COLUMNS = {
  date: ['Data', 'data', 'DATA', 'Date', 'date', 'Fecha', 'fecha'],
  description: [
    'Descrição', 'descricao', 'DESCRICAO', 'Histórico', 'historico',
    'Description', 'description', 'Lançamento', 'lancamento', 'Memo',
  ],
  amount: ['Valor', 'valor', 'VALOR', 'Amount', 'amount', 'Monto', 'monto'],
  type: ['D/C', 'Tipo', 'tipo', 'Type', 'type'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,60}?)\s+R?\$?\s*(-?[\d.,]+)/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const genericParser: BankParserPlugin = {
  bankId: 'generic',
  displayName: 'Extrato Bancário',
  bankCode: '000',
  supportedFormats: ['csv', 'pdf', 'ofx'],

  canParse(_content: string, _metadata: FileMetadata): boolean {
    return true;
  },

  async parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format === 'csv') {
      return parseCSVWithMapping(content, CSV_COLUMNS, this.displayName);
    }
    if (options.format === 'pdf') {
      return parsePDFWithPattern(content, PDF_PATTERN, parseStandardDate, this.displayName, PDF_FALLBACK);
    }
    if (options.format === 'ofx') {
      return parseOFXTransactions(content, this.displayName);
    }
    return [];
  },
};

registry.register(genericParser);
export default genericParser;
