/**
 * Parser Mercado Pago
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import { parsePDFWithPattern, parseStandardDate } from '../formats/pdf-format.js';

const DETECT = /mercado\s*pago|meli|mercadolibre|mercado\s*livre/i;

const CSV_COLUMNS = {
  date: ['Fecha', 'Data', 'data', 'fecha_creacion', 'date_created'],
  description: ['Descripción', 'Descrição', 'descricao', 'motivo', 'description'],
  amount: ['Monto', 'Valor', 'valor', 'monto_neto', 'net_amount'],
  type: ['Tipo', 'tipo', 'tipo_operacion', 'operation_type'],
} as const;

const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.{5,60}?)\s+R?\$?\s*(-?[\d.,]+)/gim;

const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim;

const mercadopagoParser: BankParserPlugin = {
  bankId: 'mercadopago',
  displayName: 'Mercado Pago',
  bankCode: '10573',
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

registry.register(mercadopagoParser);
export default mercadopagoParser;
