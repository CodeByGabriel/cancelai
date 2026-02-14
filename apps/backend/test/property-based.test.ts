/**
 * Property-Based Tests
 *
 * Usa fast-check para validar invariantes do pipeline de deteccao:
 * 1. Idempotencia: mesma entrada → mesma saida
 * 2. Monotonia: adicionar transacao nao-relacionada nao remove deteccoes
 * 3. Min ocorrencias: toda assinatura detectada tem >= 2 ocorrencias
 * 4. Amounts positivos: monthlyAmount > 0
 * 5. Confidence range: confidenceScore entre 0 e 1
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { analyzeStatements } from '../src/services/analysis-service.js';
import type { FileToProcess } from '../src/parsers/index.js';

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function buildCSV(
  transactions: Array<{ date: string; description: string; amount: string }>
): string {
  const header = 'Data,Descricao,Valor';
  const rows = transactions.map((t) => `${t.date},${t.description},${t.amount}`);
  return [header, ...rows].join('\n');
}

function toFiles(csv: string): FileToProcess[] {
  return [{
    filename: 'test-property.csv',
    content: Buffer.from(csv),
    mimetype: 'text/csv',
  }];
}

// Base dataset com assinaturas conhecidas (Netflix 3x, Spotify 3x)
const BASE_TRANSACTIONS = [
  { date: '01/10/2024', description: 'NETFLIX.COM', amount: '-55.90' },
  { date: '05/10/2024', description: 'SPOTIFY BRASIL', amount: '-21.90' },
  { date: '15/10/2024', description: 'SUPERMERCADO DIA', amount: '-89.00' },
  { date: '20/10/2024', description: 'FARMACIA POPULAR', amount: '-32.50' },
  { date: '01/11/2024', description: 'NETFLIX.COM', amount: '-55.90' },
  { date: '05/11/2024', description: 'SPOTIFY BRASIL', amount: '-21.90' },
  { date: '18/11/2024', description: 'RESTAURANTE HABBIBS', amount: '-45.00' },
  { date: '25/11/2024', description: 'POSTO SHELL', amount: '-175.00' },
  { date: '01/12/2024', description: 'NETFLIX.COM', amount: '-55.90' },
  { date: '05/12/2024', description: 'SPOTIFY BRASIL', amount: '-21.90' },
  { date: '12/12/2024', description: 'LOJAS AMERICANAS', amount: '-78.00' },
  { date: '22/12/2024', description: 'UBER *TRIP', amount: '-23.40' },
];

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

describe('Property-Based Tests', () => {
  const originalEnv = process.env['DEEPSEEK_API_KEY'];

  beforeAll(() => {
    delete process.env['DEEPSEEK_API_KEY'];
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env['DEEPSEEK_API_KEY'] = originalEnv;
    } else {
      delete process.env['DEEPSEEK_API_KEY'];
    }
  });

  it('idempotency: same input produces same output', async () => {
    const csv = buildCSV(BASE_TRANSACTIONS);

    await fc.assert(
      fc.asyncProperty(fc.constant(csv), async (input) => {
        const result1 = await analyzeStatements(toFiles(input));
        const result2 = await analyzeStatements(toFiles(input));

        expect(result1.success).toBe(result2.success);
        expect(result1.result?.subscriptions.length).toBe(
          result2.result?.subscriptions.length
        );

        // Compare subscription names (sort for order-independence)
        const names1 = (result1.result?.subscriptions ?? [])
          .map((s) => s.name.toLowerCase())
          .sort();
        const names2 = (result2.result?.subscriptions ?? [])
          .map((s) => s.name.toLowerCase())
          .sort();
        expect(names1).toEqual(names2);

        // Compare amounts
        const amounts1 = (result1.result?.subscriptions ?? [])
          .map((s) => s.monthlyAmount)
          .sort();
        const amounts2 = (result2.result?.subscriptions ?? [])
          .map((s) => s.monthlyAmount)
          .sort();
        expect(amounts1).toEqual(amounts2);
      }),
      { numRuns: 3 }
    );
  });

  it('monotonicity: adding unrelated transaction does not remove detections', async () => {
    // First, get the base result
    const baseCsv = buildCSV(BASE_TRANSACTIONS);
    const baseResult = await analyzeStatements(toFiles(baseCsv));
    const baseNames = new Set(
      (baseResult.result?.subscriptions ?? []).map((s) => s.name.toLowerCase())
    );

    const unrelatedDescArb = fc.constantFrom(
      'PADARIA NOVA',
      'POSTO COMBUSTIVEL XYZ',
      'RESTAURANTE COMIDA BOA',
      'LOJA ROUPAS FASHION',
      'ACADEMIA MUSCULACAO FIT',
      'PAPELARIA KALUNGA',
      'LANCHONETE SUBWAY',
      'FLORICULTURA BELAS FLORES',
    );

    const unrelatedAmountArb = fc.integer({ min: 5, max: 500 })
      .map((v) => `-${v}.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`);

    const dayArb = fc.integer({ min: 1, max: 28 })
      .map((d) => String(d).padStart(2, '0'));

    await fc.assert(
      fc.asyncProperty(unrelatedDescArb, unrelatedAmountArb, dayArb, async (desc, amt, day) => {
        const extended = [
          ...BASE_TRANSACTIONS,
          { date: `${day}/12/2024`, description: desc, amount: amt },
        ];
        const extendedCsv = buildCSV(extended);
        const extendedResult = await analyzeStatements(toFiles(extendedCsv));

        const extendedNames = new Set(
          (extendedResult.result?.subscriptions ?? []).map((s) => s.name.toLowerCase())
        );

        // All base detections should still be present
        for (const name of baseNames) {
          expect(extendedNames.has(name)).toBe(true);
        }
      }),
      { numRuns: 5 }
    );
  });

  it('min occurrences: every detected subscription has >= 2 occurrences', async () => {
    const csv = buildCSV(BASE_TRANSACTIONS);

    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const result = await analyzeStatements(toFiles(csv));

        if (result.result) {
          for (const sub of result.result.subscriptions) {
            expect(sub.occurrences).toBeGreaterThanOrEqual(2);
          }
        }
      }),
      { numRuns: 3 }
    );
  });

  it('non-negative amounts: all monthlyAmount > 0', async () => {
    const csv = buildCSV(BASE_TRANSACTIONS);

    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const result = await analyzeStatements(toFiles(csv));

        if (result.result) {
          for (const sub of result.result.subscriptions) {
            expect(sub.monthlyAmount).toBeGreaterThan(0);
            expect(sub.annualAmount).toBeGreaterThan(0);
          }
        }
      }),
      { numRuns: 3 }
    );
  });

  it('confidence score range: all scores between 0 and 1', async () => {
    const csv = buildCSV(BASE_TRANSACTIONS);

    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const result = await analyzeStatements(toFiles(csv));

        if (result.result) {
          for (const sub of result.result.subscriptions) {
            if (sub.confidenceScore !== undefined) {
              expect(sub.confidenceScore).toBeGreaterThanOrEqual(0);
              expect(sub.confidenceScore).toBeLessThanOrEqual(1);
            }
            expect(['high', 'medium', 'low']).toContain(sub.confidence);
          }
        }
      }),
      { numRuns: 3 }
    );
  });
});
