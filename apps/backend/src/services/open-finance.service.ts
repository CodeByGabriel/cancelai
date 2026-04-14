/**
 * Open Finance Service
 *
 * Integra com o Pluggy SDK para conexao bancaria via Open Finance Brasil.
 *
 * DECISOES:
 * - Cliente Pluggy instanciado lazily (evita falha se env vars ausentes)
 * - Circuit breaker via opossum para todas as chamadas ao agregador
 * - Nenhum dado persistido — connectionIds sao efemeros
 * - LGPD: merchant.cnpj e paymentData sao descartados antes de retornar
 */

import { PluggyClient } from 'pluggy-sdk';
import type {
  Transaction as PluggyTransaction,
  Account as PluggyAccount,
} from 'pluggy-sdk';
import CircuitBreaker from 'opossum';

// ═══════════════════════════════════════════════════════════════
// TIPOS PUBLICOS
// ═══════════════════════════════════════════════════════════════

export interface OpenFinanceLink {
  readonly accessToken: string;
}

export interface OpenFinanceAccount {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly subtype: string;
  readonly number: string;
}

export interface OpenFinanceTransaction {
  readonly id: string;
  readonly date: Date;
  readonly description: string;
  readonly descriptionRaw: string | null;
  readonly amount: number;
  readonly type: 'DEBIT' | 'CREDIT';
  readonly category: string | null;
  readonly merchantName: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACAO
// ═══════════════════════════════════════════════════════════════

const AGGREGATOR_CLIENT_ID = process.env['AGGREGATOR_CLIENT_ID'] ?? '';
const AGGREGATOR_CLIENT_SECRET = process.env['AGGREGATOR_CLIENT_SECRET'] ?? '';

export function isOpenFinanceConfigured(): boolean {
  return AGGREGATOR_CLIENT_ID.length > 0 && AGGREGATOR_CLIENT_SECRET.length > 0;
}

// ═══════════════════════════════════════════════════════════════
// CLIENTE LAZY
// ═══════════════════════════════════════════════════════════════

let pluggyClient: PluggyClient | null = null;

function getClient(): PluggyClient {
  if (!isOpenFinanceConfigured()) {
    throw new Error('Open Finance nao configurado: AGGREGATOR_CLIENT_ID e AGGREGATOR_CLIENT_SECRET sao obrigatorios');
  }
  if (!pluggyClient) {
    pluggyClient = new PluggyClient({
      clientId: AGGREGATOR_CLIENT_ID,
      clientSecret: AGGREGATOR_CLIENT_SECRET,
    });
  }
  return pluggyClient;
}

// ═══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════

const breakerOptions = {
  timeout: 15_000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  name: 'pluggy-api',
};

function createBreaker<T>(fn: (...args: never[]) => Promise<T>): CircuitBreaker {
  return new CircuitBreaker(fn, breakerOptions);
}

// ═══════════════════════════════════════════════════════════════
// FUNCOES PUBLICAS
// ═══════════════════════════════════════════════════════════════

/**
 * Cria um connect token para o widget Pluggy Connect.
 * O token permite ao frontend abrir o widget sem expor credenciais.
 */
const createLinkBreaker = createBreaker(async (): Promise<OpenFinanceLink> => {
  const client = getClient();
  const result = await client.createConnectToken();
  return { accessToken: result.accessToken };
});

export async function createLink(): Promise<OpenFinanceLink> {
  return createLinkBreaker.fire() as Promise<OpenFinanceLink>;
}

/**
 * Lista contas associadas a um item (conexao bancaria).
 * LGPD: Remove dados sensiveis (owner, taxNumber) antes de retornar.
 */
const getAccountsBreaker = createBreaker(async (itemId: string): Promise<readonly OpenFinanceAccount[]> => {
  const client = getClient();
  const response = await client.fetchAccounts(itemId);
  return response.results.map((account: PluggyAccount) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    subtype: account.subtype,
    number: account.number,
  }));
});

export async function getAccounts(itemId: string): Promise<readonly OpenFinanceAccount[]> {
  return getAccountsBreaker.fire(itemId) as Promise<readonly OpenFinanceAccount[]>;
}

/**
 * Busca transacoes de uma conta no periodo especificado.
 * LGPD: Remove dados de pagamento (CPF/CNPJ, conta, agencia) antes de retornar.
 */
const getTransactionsBreaker = createBreaker(
  async (accountId: string, dateRange: { readonly from: Date; readonly to: Date }): Promise<readonly OpenFinanceTransaction[]> => {
    const client = getClient();

    const allTransactions: PluggyTransaction[] = [];
    let page = 1;
    const pageSize = 500;
    let hasMore = true;

    while (hasMore) {
      const response = await client.fetchTransactions(accountId, {
        from: dateRange.from.toISOString().split('T')[0]!,
        to: dateRange.to.toISOString().split('T')[0]!,
        page,
        pageSize,
      });

      allTransactions.push(...response.results);
      hasMore = response.results.length === pageSize;
      page++;
    }

    return allTransactions.map((tx: PluggyTransaction): OpenFinanceTransaction => ({
      id: tx.id,
      date: tx.date instanceof Date ? tx.date : new Date(tx.date),
      description: tx.description,
      descriptionRaw: tx.descriptionRaw,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      merchantName: tx.merchant?.name ?? null,
    }));
  }
);

export async function getTransactions(
  accountId: string,
  dateRange: { readonly from: Date; readonly to: Date },
): Promise<readonly OpenFinanceTransaction[]> {
  return getTransactionsBreaker.fire(accountId, dateRange) as Promise<readonly OpenFinanceTransaction[]>;
}

/**
 * Revoga acesso a um item (conexao bancaria).
 * Remove todos os dados associados no Pluggy.
 */
const revokeConnectionBreaker = createBreaker(async (itemId: string): Promise<boolean> => {
  const client = getClient();
  await client.deleteItem(itemId);
  return true;
});

export async function revokeConnection(itemId: string): Promise<boolean> {
  return revokeConnectionBreaker.fire(itemId) as Promise<boolean>;
}
