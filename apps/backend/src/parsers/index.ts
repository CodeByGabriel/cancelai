/**
 * Gerenciador de Parsers
 *
 * Coordena múltiplos parsers e escolhe o mais apropriado para cada arquivo.
 * Usa o registry de bank parsers (plugin system) internamente.
 */

import type { ParseResult, Transaction } from '../types/index.js';
import { registry } from './registry/index.js';
import './banks/index.js';

/**
 * Interface para arquivo a ser processado
 */
export interface FileToProcess {
  readonly filename: string;
  readonly content: Buffer;
  readonly mimetype: string;
}

/**
 * Processa múltiplos arquivos de extrato
 *
 * SEGURANÇA: Cada arquivo é processado independentemente e descartado após uso.
 */
export async function parseStatements(
  files: FileToProcess[]
): Promise<{
  transactions: Transaction[];
  results: ParseResult[];
}> {
  const allTransactions: Transaction[] = [];
  const results: ParseResult[] = [];

  for (const file of files) {
    const result = await registry.parseFile(file);
    results.push(result);

    if (result.success) {
      allTransactions.push(...result.transactions);
    }
  }

  // Deduplica transações entre arquivos (caso o usuário envie extratos sobrepostos)
  const deduplicatedTransactions = deduplicateTransactions(allTransactions);

  return {
    transactions: deduplicatedTransactions,
    results,
  };
}

/**
 * Remove transações duplicadas
 *
 * Considera duplicada se: mesma data, mesmo valor, descrição similar
 */
function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();

  for (const transaction of transactions) {
    const key = generateDeduplicationKey(transaction);

    // Se já existe, mantém apenas se a descrição for mais completa
    const existing = seen.get(key);
    if (existing) {
      if (transaction.description.length > existing.description.length) {
        seen.set(key, transaction);
      }
    } else {
      seen.set(key, transaction);
    }
  }

  return Array.from(seen.values());
}

/**
 * Gera uma chave única para deduplicação
 */
function generateDeduplicationKey(transaction: Transaction): string {
  const dateStr = transaction.date.toISOString().split('T')[0];
  const amountStr = transaction.amount.toFixed(2);

  // Usa apenas os primeiros 20 caracteres da descrição normalizada
  const descNorm = transaction.description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  return `${dateStr}|${amountStr}|${descNorm}`;
}

export type { BankParser } from './base.js';
export { registry } from './registry/index.js';
export type { BankParserPlugin } from './registry/index.js';
