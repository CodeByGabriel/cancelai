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

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { analyzeStatements } from '../src/services/analysis-service.js';
import type { FileToProcess } from '../src/parsers/index.js';
import { buildCorpus, tfidfCosineSimilarity } from '../src/services/tfidf-scorer.js';
import { normalizeDescription, clearNormalizationCache } from '../src/utils/string.js';

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

// ══════════════════════════════════════════════════════════════
// TF-IDF PROPERTY TESTS
// ══════════════════════════════════════════════════════════════

describe('TF-IDF Property Tests', () => {
  const sampleCorpus = buildCorpus([
    'netflix streaming', 'spotify music', 'disney plus',
    'youtube premium', 'amazon prime video', 'globoplay',
  ]);

  const wordArb = fc.string({ minLength: 2, maxLength: 10 }).map((s) => s.replace(/\s+/g, '').toLowerCase() || 'ab');
  const textArb = fc.array(wordArb, { minLength: 1, maxLength: 5 }).map((words) => words.join(' '));

  it('identity: tfidfCosineSimilarity(x, x) === 1.0', () => {
    fc.assert(
      fc.property(textArb, (text) => {
        const score = tfidfCosineSimilarity(text, text, sampleCorpus);
        expect(score).toBeCloseTo(1.0, 5);
      }),
      { numRuns: 1000 }
    );
  });

  it('symmetry: tfidfCosineSimilarity(a, b) === tfidfCosineSimilarity(b, a)', () => {
    fc.assert(
      fc.property(textArb, textArb, (a, b) => {
        const scoreAB = tfidfCosineSimilarity(a, b, sampleCorpus);
        const scoreBA = tfidfCosineSimilarity(b, a, sampleCorpus);
        expect(scoreAB).toBeCloseTo(scoreBA, 10);
      }),
      { numRuns: 1000 }
    );
  });

  it('range: 0 <= tfidfCosineSimilarity(a, b) <= 1', () => {
    fc.assert(
      fc.property(textArb, textArb, (a, b) => {
        const score = tfidfCosineSimilarity(a, b, sampleCorpus);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }),
      { numRuns: 1000 }
    );
  });

  it('empty string: tfidfCosineSimilarity("", x) === 0', () => {
    fc.assert(
      fc.property(textArb, (text) => {
        expect(tfidfCosineSimilarity('', text, sampleCorpus)).toBe(0);
        expect(tfidfCosineSimilarity(text, '', sampleCorpus)).toBe(0);
      }),
      { numRuns: 1000 }
    );
  });
});

// ══════════════════════════════════════════════════════════════
// NORMALIZATION PROPERTY TESTS
// ══════════════════════════════════════════════════════════════

describe('Normalization Property Tests', () => {
  // Realistic bank description generator: uppercase letters, digits, spaces, common separators
  const bankDescArb = fc.constantFrom(
    'PAG*NETFLIX 123456 01/02',
    'SPOTIFY BRASIL SAO PAULO',
    'GOOGLE*YOUTUBE PREMIUM',
    'MERCPAGO*DISNEY PLUS',
    'DEB.AUT SMART FIT',
    'NETFLIX.COM 202501',
    'ADOBE CREATIVE CLOUD',
    'MICROSOFT 365 OFFICE',
    'APPLE.COM/BILL ITUNES',
    'AMAZON PRIME VIDEO',
    'UBER*UBERONE',
    'CARTAO GLOBOPLAY',
    'IFOOD SAO PAULO BR',
    'SEM PARAR LTDA',
    'ALURA TREINAMENTOS',
  );

  // Also test with word-based random descriptions (alphanumeric only)
  const wordOnlyArb = fc.array(
    fc.constantFrom('PAG', 'NETFLIX', 'SPOTIFY', 'GOOGLE', 'APPLE', 'AMAZON', 'UBER', '123', '456789', 'SAO', 'PAULO', 'BR', 'LTDA', 'COM'),
    { minLength: 1, maxLength: 6 },
  ).map((words) => words.join(' '));

  const combinedArb = fc.oneof(bankDescArb, wordOnlyArb);

  beforeAll(() => {
    clearNormalizationCache();
  });

  afterEach(() => {
    clearNormalizationCache();
  });

  it('idempotency: normalize(normalize(x)) === normalize(x)', () => {
    fc.assert(
      fc.property(combinedArb, (input) => {
        clearNormalizationCache();
        const once = normalizeDescription(input);
        clearNormalizationCache();
        const twice = normalizeDescription(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 1000 }
    );
  });

  it('never grows: normalize(x).length <= x.length', () => {
    fc.assert(
      fc.property(combinedArb, (input) => {
        clearNormalizationCache();
        const normalized = normalizeDescription(input);
        expect(normalized.length).toBeLessThanOrEqual(input.length);
      }),
      { numRuns: 1000 }
    );
  });
});
