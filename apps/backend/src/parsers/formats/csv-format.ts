/**
 * Helpers compartilhados para parsing de CSV
 *
 * Extraido de csv-parser.ts para reuso por bank parsers individuais.
 */

import { parse as parseCSV } from 'csv-parse/sync';
import type { Transaction } from '../../types/index.js';
import { parseDate } from '../../utils/date.js';
import { parseAmount, isDebit } from '../../utils/amount.js';
import { normalizeDescription } from '../../utils/string.js';

/**
 * Detecta o delimitador usado no CSV
 */
export function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');

  const delimiters = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let maxCount = 0;

  for (const delimiter of delimiters) {
    const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const count = (firstLines.match(new RegExp(escapedDelimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Faz parse do conteudo CSV em records
 */
export function parseCSVRecords(content: string): Record<string, string>[] {
  if (content.length > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande (maximo 10MB)');
  }

  const delimiter = detectDelimiter(content);

  const records = parseCSV(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  return records;
}

/**
 * Resolve qual header corresponde a uma lista de nomes possiveis
 */
export function resolveColumn(headers: readonly string[], possibleNames: readonly string[]): string | null {
  for (const header of headers) {
    const headerNorm = normalizeDescription(header);
    for (const name of possibleNames) {
      const nameNorm = normalizeDescription(name);
      if (headerNorm === nameNorm || header.toLowerCase() === name.toLowerCase()) {
        return header;
      }
    }
  }
  return null;
}

/**
 * Extrai o valor de um record usando uma lista de nomes possiveis
 */
export function extractRecordValue(
  record: Record<string, string>,
  possibleNames: readonly string[]
): string | undefined {
  for (const name of possibleNames) {
    const value = record[name];
    if (value !== undefined && value !== '') {
      return value;
    }
  }
  return undefined;
}

/**
 * Converte um record CSV em Transaction
 */
export function parseCSVTransaction(
  record: Record<string, string>,
  dateCol: string,
  descCol: string,
  amountCol: string,
  typeCol: string | null,
  source: string
): Transaction | null {
  const dateStr = record[dateCol];
  const descriptionStr = record[descCol];
  const amountStr = record[amountCol];
  const typeStr = typeCol ? record[typeCol] : undefined;

  if (!dateStr || !descriptionStr || !amountStr) {
    return null;
  }

  const date = parseDate(dateStr);
  if (!date) return null;

  const amount = parseAmount(amountStr);
  if (amount === null || amount === 0) return null;

  const type = isDebit(amountStr, typeStr) ? 'debit' : 'credit';

  return {
    date,
    description: descriptionStr.trim(),
    originalDescription: descriptionStr,
    amount: Math.abs(amount),
    type,
    source,
  };
}

/**
 * Pipeline completo de CSV parsing para um bank parser
 *
 * 1. Parseia CSV em records
 * 2. Resolve colunas usando mapeamento do banco
 * 3. Converte cada record em Transaction
 */
export function parseCSVWithMapping(
  content: string,
  columnMapping: {
    readonly date: readonly string[];
    readonly description: readonly string[];
    readonly amount: readonly string[];
    readonly type?: readonly string[];
  },
  source: string
): Transaction[] {
  const records = parseCSVRecords(content);

  if (records.length === 0) {
    return [];
  }

  const headers = Object.keys(records[0] ?? {});
  const dateCol = resolveColumn(headers, columnMapping.date);
  const descCol = resolveColumn(headers, columnMapping.description);
  const amountCol = resolveColumn(headers, columnMapping.amount);
  const typeCol = columnMapping.type ? resolveColumn(headers, columnMapping.type) : null;

  if (!dateCol || !descCol || !amountCol) {
    throw new Error(
      `Nao foi possivel identificar as colunas necessarias (data, descricao, valor). ` +
      `Colunas encontradas: ${headers.join(', ')}`
    );
  }

  const transactions: Transaction[] = [];

  for (const record of records) {
    try {
      const transaction = parseCSVTransaction(record, dateCol, descCol, amountCol, typeCol, source);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch {
      // Ignora linhas que nao conseguiu processar
    }
  }

  return transactions;
}
