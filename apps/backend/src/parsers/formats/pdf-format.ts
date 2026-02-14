/**
 * Helpers compartilhados para parsing de PDF
 *
 * Extraido de pdf-parser.ts para reuso por bank parsers individuais.
 * A extracao de texto do PDF (pdfParse) e feita pelo registry,
 * nao pelos bank parsers. Estes helpers trabalham com texto ja extraido.
 */

import type { Transaction } from '../../types/index.js';
import { parseDate } from '../../utils/date.js';
import { parseAmount, isDebit } from '../../utils/amount.js';

/**
 * Tipo para funcao de parse de data customizada por banco
 */
export type DateParser = (dateStr: string) => Date | null;

/**
 * Match raw de uma transacao extraida por regex
 */
export interface RawTransactionMatch {
  readonly dateStr: string;
  readonly description: string;
  readonly amountStr: string;
  readonly typeIndicator?: string | undefined;
}

/**
 * Normaliza texto extraido de PDF (whitespace, quebras de linha)
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ');
}

/**
 * Aplica um regex pattern contra o texto e retorna matches raw
 */
export function matchTransactions(
  text: string,
  pattern: RegExp,
): RawTransactionMatch[] {
  const normalizedText = normalizeText(text);
  const regex = new RegExp(pattern);
  const matches: RawTransactionMatch[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalizedText)) !== null) {
    const [, dateStr, description, amountStr, typeIndicator] = match;
    if (dateStr && description && amountStr) {
      matches.push({
        dateStr,
        description,
        amountStr,
        typeIndicator: typeIndicator || undefined,
      });
    }
  }

  return matches;
}

/**
 * Limpa descricao removendo ruidos comuns de PDF
 */
export function cleanDescription(description: string): string {
  return description
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\b\d{8,}\b/g, '')
    .replace(/\d{2}:\d{2}(:\d{2})?/g, '')
    .trim();
}

/**
 * Determina se e debito ou credito baseado no valor, indicador e descricao
 */
export function determineTransactionType(
  amountStr: string,
  typeIndicator?: string,
  description?: string
): 'debit' | 'credit' {
  if (typeIndicator) {
    return typeIndicator.toUpperCase() === 'D' ? 'debit' : 'credit';
  }

  if (isDebit(amountStr)) {
    return 'debit';
  }

  if (description) {
    const creditKeywords = [
      'deposito', 'depósito', 'recebido', 'recebimento',
      'transferencia recebida', 'pix recebido', 'ted recebida',
      'estorno', 'reembolso', 'devolucao', 'devolução',
    ];

    const descLower = description.toLowerCase();
    if (creditKeywords.some((keyword) => descLower.includes(keyword))) {
      return 'credit';
    }
  }

  return 'debit';
}

/**
 * Parser de data do Nubank (ex: "02 DEZ 2024")
 */
export function parseNubankDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
    JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  };

  const match = dateStr.match(/(\d{2})\s+(\w{3})\s+(\d{4})/i);
  if (!match) return null;

  const day = parseInt(match[1]!, 10);
  const monthStr = match[2]!.toUpperCase();
  const year = parseInt(match[3]!, 10);

  const month = months[monthStr];
  if (month === undefined) return null;

  return new Date(year, month, day);
}

/**
 * Parser de data padrao (DD/MM/YYYY ou DD/MM/YY)
 */
export function parseStandardDate(dateStr: string): Date | null {
  return parseDate(dateStr);
}

/**
 * Converte matches raw em Transactions com deduplicacao
 */
export function convertMatchesToTransactions(
  matches: readonly RawTransactionMatch[],
  dateParser: DateParser,
  source: string
): Transaction[] {
  const transactions: Transaction[] = [];
  const seen = new Set<string>();

  for (const rawMatch of matches) {
    try {
      const date = dateParser(rawMatch.dateStr);
      if (!date) continue;

      const amount = parseAmount(rawMatch.amountStr);
      if (amount === null || amount === 0) continue;

      const type = determineTransactionType(rawMatch.amountStr, rawMatch.typeIndicator, rawMatch.description);

      const desc = cleanDescription(rawMatch.description);
      if (desc.length < 3) continue;

      const key = `${date.toISOString().split('T')[0]}-${amount}-${desc.substring(0, 20)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      transactions.push({
        date,
        description: desc,
        originalDescription: rawMatch.description,
        amount: Math.abs(amount),
        type,
        source,
      });
    } catch {
      continue;
    }
  }

  return transactions;
}

/**
 * Pipeline completo de PDF parsing para um bank parser
 *
 * 1. Aplica regex pattern ao texto
 * 2. Converte matches em transactions com deduplicacao
 * 3. Se nao encontrou com pattern especifico, tenta o fallback
 */
export function parsePDFWithPattern(
  text: string,
  pattern: RegExp,
  dateParser: DateParser,
  source: string,
  fallbackPattern?: RegExp,
): Transaction[] {
  const matches = matchTransactions(text, pattern);
  const transactions = convertMatchesToTransactions(matches, dateParser, source);

  if (transactions.length === 0 && fallbackPattern) {
    const fallbackMatches = matchTransactions(text, fallbackPattern);
    return convertMatchesToTransactions(fallbackMatches, parseStandardDate, source);
  }

  return transactions;
}
