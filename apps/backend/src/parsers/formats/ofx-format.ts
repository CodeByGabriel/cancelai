/**
 * Helpers para parsing de arquivos OFX/QFX
 *
 * Usa ofx-data-extractor (TypeScript nativo, zero deps).
 * QFX e o mesmo formato OFX com extensao diferente (Quicken Financial Exchange).
 */

import { Reader, Extractor } from 'ofx-data-extractor';
import type { Transaction } from '../../types/index.js';

/**
 * Verifica se o conteudo e um arquivo OFX/QFX
 */
export function isOFXContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('OFXHEADER') || trimmed.includes('<OFX>');
}

/**
 * Parseia data OFX (formato YYYYMMDD ou YYYYMMDDHHMMSS)
 */
function parseOFXDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length < 8) return null;

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  return new Date(year, month, day);
}

/**
 * Determina tipo de transacao OFX
 */
function mapOFXType(trnType: string): 'debit' | 'credit' {
  const creditTypes = ['CREDIT', 'DEP', 'INT', 'DIV', 'DIRECTDEP'];
  return creditTypes.includes(trnType) ? 'credit' : 'debit';
}

/**
 * Extrai transacoes de conteudo OFX/QFX
 */
export function parseOFXTransactions(content: string, source: string): Transaction[] {
  const reader = Reader.fromString(content);
  const extractor = new Extractor();
  extractor.data(reader);

  const transactions: Transaction[] = [];

  // Tenta extrair transacoes bancarias
  try {
    const bankTransactions = extractor.getBankTransferList();
    for (const trn of bankTransactions) {
      const date = parseOFXDate(trn.DTPOSTED);
      if (!date) continue;

      const amount = typeof trn.TRNAMT === 'number' ? trn.TRNAMT : parseFloat(String(trn.TRNAMT));
      if (isNaN(amount) || amount === 0) continue;

      const description = (trn.MEMO ?? trn.FITID ?? '').trim();
      if (description.length < 2) continue;

      transactions.push({
        date,
        description,
        originalDescription: description,
        amount: Math.abs(amount),
        type: mapOFXType(trn.TRNTYPE),
        source,
      });
    }
  } catch {
    // Nao e um extrato bancario, tenta cartao de credito
  }

  // Tenta extrair transacoes de cartao de credito
  if (transactions.length === 0) {
    try {
      const ccTransactions = extractor.getCreditCardTransferList();
      for (const trn of ccTransactions) {
        const date = parseOFXDate(trn.DTPOSTED);
        if (!date) continue;

        const amount = typeof trn.TRNAMT === 'number' ? trn.TRNAMT : parseFloat(String(trn.TRNAMT));
        if (isNaN(amount) || amount === 0) continue;

        const description = (trn.MEMO ?? trn.FITID ?? '').trim();
        if (description.length < 2) continue;

        transactions.push({
          date,
          description,
          originalDescription: description,
          amount: Math.abs(amount),
          type: mapOFXType(trn.TRNTYPE),
          source,
        });
      }
    } catch {
      // Sem transacoes de cartao tambem
    }
  }

  return transactions;
}
