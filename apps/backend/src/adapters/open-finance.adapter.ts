/**
 * Open Finance Adapter
 *
 * Converte transacoes do agregador (Pluggy) para o formato Transaction do pipeline.
 * O pipeline recebe essas transacoes como se viessem de CSV/OFX.
 *
 * DECISOES:
 * - merchantName tem prioridade sobre description (mais limpo)
 * - amount e convertido para positivo (pipeline espera sempre positivo)
 * - source indica origem: "open-finance:{bankName}"
 * - Adapter e uma funcao pura — sem side effects
 */

import type { Transaction } from '../types/index.js';
import type { OpenFinanceTransaction } from '../services/open-finance.service.js';

/**
 * Adapta transacoes do agregador para o formato do pipeline.
 *
 * Mapeamento:
 * - merchantName ?? description → description (nome do merchant e mais limpo)
 * - description original → originalDescription (para auditoria)
 * - Math.abs(amount) → amount (pipeline espera positivo)
 * - DEBIT/CREDIT → 'debit'/'credit'
 * - date → Date (ja vem como Date do Pluggy)
 * - "open-finance:{bankName}" → source
 */
export function adaptTransactions(
  aggregatorTransactions: readonly OpenFinanceTransaction[],
  bankName: string,
): readonly Transaction[] {
  return aggregatorTransactions.map((tx): Transaction => ({
    date: tx.date instanceof Date ? tx.date : new Date(tx.date),
    description: tx.merchantName ?? tx.description,
    originalDescription: tx.descriptionRaw ?? tx.description,
    amount: Math.abs(tx.amount),
    type: tx.type === 'DEBIT' ? 'debit' : 'credit',
    source: `open-finance:${bankName}`,
  }));
}
