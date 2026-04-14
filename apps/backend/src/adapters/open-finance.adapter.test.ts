/**
 * Testes do Open Finance Adapter
 *
 * Cenario 4: Adapter correctness — mapeamento de campos,
 * normalizacao de sinal, parse de data, formato de source
 */

import { describe, it, expect } from 'vitest';
import { adaptTransactions } from './open-finance.adapter.js';
import type { OpenFinanceTransaction } from '../services/open-finance.service.js';

describe('Open Finance Adapter', () => {
  const baseTransaction: OpenFinanceTransaction = {
    id: 'tx-001',
    date: new Date('2024-11-01'),
    description: 'NETFLIX.COM',
    descriptionRaw: 'PAG*NETFLIX.COM INTERNET',
    amount: -55.90,
    type: 'DEBIT',
    category: 'streaming',
    merchantName: 'Netflix',
  };

  describe('adaptTransactions', () => {
    it('deve mapear merchantName para description quando disponivel', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result).toHaveLength(1);
      expect(result[0]!.description).toBe('Netflix');
    });

    it('deve usar description quando merchantName e null', () => {
      const tx: OpenFinanceTransaction = {
        ...baseTransaction,
        merchantName: null,
      };

      const result = adaptTransactions([tx], 'itau');

      expect(result[0]!.description).toBe('NETFLIX.COM');
    });

    it('deve usar descriptionRaw como originalDescription', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result[0]!.originalDescription).toBe('PAG*NETFLIX.COM INTERNET');
    });

    it('deve usar description como originalDescription quando descriptionRaw e null', () => {
      const tx: OpenFinanceTransaction = {
        ...baseTransaction,
        descriptionRaw: null,
      };

      const result = adaptTransactions([tx], 'nubank');

      expect(result[0]!.originalDescription).toBe('NETFLIX.COM');
    });

    it('deve converter amount para positivo (Math.abs)', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result[0]!.amount).toBeCloseTo(55.90, 2);
    });

    it('deve manter amount positivo quando ja e positivo', () => {
      const tx: OpenFinanceTransaction = {
        ...baseTransaction,
        amount: 55.90,
        type: 'CREDIT',
      };

      const result = adaptTransactions([tx], 'nubank');

      expect(result[0]!.amount).toBeCloseTo(55.90, 2);
    });

    it('deve mapear DEBIT para debit', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result[0]!.type).toBe('debit');
    });

    it('deve mapear CREDIT para credit', () => {
      const tx: OpenFinanceTransaction = {
        ...baseTransaction,
        type: 'CREDIT',
      };

      const result = adaptTransactions([tx], 'nubank');

      expect(result[0]!.type).toBe('credit');
    });

    it('deve formatar source como open-finance:{bankName}', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result[0]!.source).toBe('open-finance:nubank');
    });

    it('deve converter date string ISO para Date', () => {
      const tx: OpenFinanceTransaction = {
        ...baseTransaction,
        date: '2024-11-01T00:00:00.000Z' as unknown as Date,
      };

      const result = adaptTransactions([tx], 'nubank');

      expect(result[0]!.date).toBeInstanceOf(Date);
      expect(result[0]!.date.getFullYear()).toBe(2024);
    });

    it('deve preservar Date quando ja e Date', () => {
      const result = adaptTransactions([baseTransaction], 'nubank');

      expect(result[0]!.date).toBeInstanceOf(Date);
      expect(result[0]!.date.getTime()).toBe(new Date('2024-11-01').getTime());
    });

    it('deve converter multiplas transacoes', () => {
      const transactions: OpenFinanceTransaction[] = [
        baseTransaction,
        {
          id: 'tx-002',
          date: new Date('2024-11-01'),
          description: 'SPOTIFY BRASIL',
          descriptionRaw: 'SPOTIFY AB',
          amount: -21.90,
          type: 'DEBIT',
          category: 'music',
          merchantName: 'Spotify',
        },
        {
          id: 'tx-003',
          date: new Date('2024-11-15'),
          description: 'MERCADO LIVRE',
          descriptionRaw: null,
          amount: -150.00,
          type: 'DEBIT',
          category: null,
          merchantName: null,
        },
      ];

      const result = adaptTransactions(transactions, 'bradesco');

      expect(result).toHaveLength(3);
      expect(result[0]!.description).toBe('Netflix');
      expect(result[1]!.description).toBe('Spotify');
      expect(result[2]!.description).toBe('MERCADO LIVRE');
      expect(result.every((t) => t.source === 'open-finance:bradesco')).toBe(true);
    });

    it('deve retornar array vazio para entrada vazia', () => {
      const result = adaptTransactions([], 'nubank');

      expect(result).toHaveLength(0);
    });
  });
});
