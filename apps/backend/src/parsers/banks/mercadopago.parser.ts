/**
 * Parser Mercado Pago
 *
 * Suporta:
 * - CSV de extrato (conta e carteira digital)
 * - PDF de fatura do Cartão Visa Mercado Pago
 *
 * Formato da fatura PDF:
 *   DD/MM   MERCHANT NAME   R$ AMOUNT
 *   DD/MM   Compra internacional em MERCHANT   R$ AMOUNT
 *   (próxima linha pode ter câmbio: USD X = R$ Y — ignorada)
 */

import type { BankParserPlugin, FileMetadata, ParseOptions } from '../registry/bank-parser.interface.js';
import type { Transaction } from '../../types/index.js';
import { registry } from '../registry/parser-registry.js';
import { parseCSVWithMapping } from '../formats/csv-format.js';
import {
  normalizeText,
  matchTransactions,
  convertMatchesToTransactions,
  type RawTransactionMatch,
  type DateParser,
} from '../formats/pdf-format.js';

const DETECT = /mercado\s*pago|meli|mercadolibre|mercado\s*livre/i;

// Mercado Pago credit card statements use DD/MM (no year).
// Infer year: if the month is ahead of today, it's from the previous year.
const parseMercadoPagoDate: DateParser = (dateStr) => {
  const shortMatch = /^(\d{2})\/(\d{2})$/.exec(dateStr);
  if (!shortMatch) {
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const rawYear = parseInt(parts[2], 10);
      const year = parts[2].length === 2 ? (rawYear > 50 ? 1900 + rawYear : 2000 + rawYear) : rawYear;
      const d = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  const day = parseInt(shortMatch[1]!, 10);
  const month = parseInt(shortMatch[2]!, 10) - 1;
  const now = new Date();
  let year = now.getFullYear();
  if (month > now.getMonth() || (month === now.getMonth() && day > now.getDate())) {
    year -= 1;
  }
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
};

const CSV_COLUMNS = {
  date: ['Fecha', 'Data', 'data', 'fecha_creacion', 'date_created'],
  description: ['Descripción', 'Descrição', 'descricao', 'motivo', 'description'],
  amount: ['Monto', 'Valor', 'valor', 'monto_neto', 'net_amount'],
  type: ['Tipo', 'tipo', 'tipo_operacion', 'operation_type'],
} as const;

// Primary: DD/MM with optional year, description, R$ amount
const PDF_PATTERN =
  /(\d{2}\/\d{2}\/?\d{0,4})\s+(.{5,80}?)\s+R\$\s*(-?[\d.,]+)/gim;

// Fallback: less strict amount format
const PDF_FALLBACK =
  /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,60}?)\s+(-?[\d]+[.,][\d]{2})/gim;

// Lines that are charges/credits/summary lines — not purchases
const SKIP_PATTERNS = [
  /pagamento\s*(?:da|de)\s*fatura/i,
  /cr[eé]dito\s*concedido/i,
  /juros\s*do\s*rotativo/i,
  /iof\s*do\s*rotativo/i,
  /iof\s*cobrado/i,
  /rendimento\s*de\s*conta/i,
  /limite\s*disponível/i,
  /limite\s*de\s*cr[eé]dito/i,
  /total\s*(?:da\s*)?fatura/i,
  /valor\s*(?:da\s*)?fatura/i,
  /saldo\s*(?:da\s*)?fatura/i,
  /cobran[cç]a\s*de\s*anuidade/i,
  // Exchange rate lines from international purchases
  /(?:USD|EUR|GBP|ARS|JPY)\s+[\d.,]+\s*=\s*R?\$/i,
  /brl\s+[\d.,]+\s*=\s*(?:USD|EUR)/i,
];

// Strips "Compra internacional em " prefix to expose the actual merchant name
const INTL_PREFIX_RE = /^compra\s+internacional\s+em\s+/i;

function parseMercadoPagoPDF(text: string, source: string): readonly Transaction[] {
  const normalized = normalizeText(text);
  const raw = matchTransactions(normalized, PDF_PATTERN);

  const filtered: RawTransactionMatch[] = [];
  for (const m of raw) {
    if (SKIP_PATTERNS.some((p) => p.test(m.description))) continue;
    const desc = m.description.replace(INTL_PREFIX_RE, '').trim();
    filtered.push({ dateStr: m.dateStr, description: desc, amountStr: m.amountStr, typeIndicator: m.typeIndicator });
  }

  const transactions = convertMatchesToTransactions(filtered, parseMercadoPagoDate, source);

  if (transactions.length === 0) {
    const fallbackRaw = matchTransactions(normalized, PDF_FALLBACK);
    const fallbackFiltered: RawTransactionMatch[] = [];
    for (const m of fallbackRaw) {
      if (SKIP_PATTERNS.some((p) => p.test(m.description))) continue;
      const desc = m.description.replace(INTL_PREFIX_RE, '').trim();
      fallbackFiltered.push({ dateStr: m.dateStr, description: desc, amountStr: m.amountStr, typeIndicator: m.typeIndicator });
    }
    return convertMatchesToTransactions(fallbackFiltered, parseMercadoPagoDate, source);
  }

  return transactions;
}

const mercadopagoParser: BankParserPlugin = {
  bankId: 'mercadopago',
  displayName: 'Mercado Pago',
  bankCode: '10573',
  supportedFormats: ['csv', 'pdf'],

  canParse(content: string, metadata: FileMetadata): boolean {
    if (!this.supportedFormats.includes(metadata.format)) return false;
    return DETECT.test(content);
  },

  parse(content: string, options: ParseOptions): Promise<readonly Transaction[]> {
    if (options.format === 'csv') {
      return Promise.resolve(parseCSVWithMapping(content, CSV_COLUMNS, this.displayName));
    }
    if (options.format === 'pdf') {
      return Promise.resolve(parseMercadoPagoPDF(content, this.displayName));
    }
    return Promise.resolve([]);
  },
};

registry.register(mercadopagoParser);
export default mercadopagoParser;
