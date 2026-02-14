/**
 * Classification Accuracy Tests
 *
 * Processa fixtures CSV pelo pipeline completo e compara contra golden files.
 * Computa confusion matrix (TP/FP/FN), Precision, Recall, F1, F2.
 *
 * CI Gates (aggregate):
 *   F1 >= 0.85 | Recall >= 0.90 | Precision >= 0.80
 *
 * Para regenerar golden snapshots:
 *   UPDATE_GOLDEN=true npx vitest run test/classification-accuracy
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { analyzeStatements } from '../src/services/analysis-service.js';
import type { FileToProcess } from '../src/parsers/index.js';
import type { DetectedSubscription } from '../src/types/index.js';

// ══════════════════════════════════════════════════════════════
// ESM __dirname
// ══════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

interface GoldenFile {
  groundTruth: {
    subscriptions: string[];
  };
  snapshot: unknown;
}

interface ConfusionMatrix {
  tp: number;
  fn: number;
  fp: number;
}

interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  f2: number;
}

// ══════════════════════════════════════════════════════════════
// MATCHING — normaliza nomes para comparacao ground truth
// ══════════════════════════════════════════════════════════════

const GATEWAY_PREFIXES = ['pag', 'google', 'mp', 'mercpago', 'merpago', 'iz', 'pg', 'apple', 'amzn', 'openai'];

function normalizeForMatching(name: string): string {
  let normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')    // strip acentos
    .replace(/[^a-z0-9\s]/g, ' ')       // remove special chars
    .replace(/\s+/g, ' ')
    .trim();

  // Remove gateway prefixes
  for (const prefix of GATEWAY_PREFIXES) {
    if (normalized.startsWith(prefix + ' ')) {
      normalized = normalized.substring(prefix.length + 1).trim();
    }
  }

  return normalized;
}

function matchesGroundTruth(detectedName: string, truthPattern: string): boolean {
  const detected = normalizeForMatching(detectedName);
  const truth = normalizeForMatching(truthPattern);

  // Exact match
  if (detected === truth) return true;

  // Substring match (either direction)
  if (detected.includes(truth) || truth.includes(detected)) return true;

  // First-word match (>= 3 chars)
  const detectedFirst = detected.split(' ')[0] ?? '';
  const truthFirst = truth.split(' ')[0] ?? '';
  if (detectedFirst.length >= 3 && truthFirst.length >= 3) {
    if (detectedFirst === truthFirst) return true;
  }

  return false;
}

// ══════════════════════════════════════════════════════════════
// CONFUSION MATRIX + METRICS
// ══════════════════════════════════════════════════════════════

function computeConfusionMatrix(
  detected: readonly DetectedSubscription[],
  groundTruth: readonly string[]
): ConfusionMatrix {
  const detectedNames = detected.map((s) => s.name);
  const matchedDetected = new Set<number>();

  let tp = 0;
  let fn = 0;

  // For each ground truth, find a matching detection (greedy 1:1)
  for (const truthName of groundTruth) {
    const matchIndex = detectedNames.findIndex(
      (dName, idx) => !matchedDetected.has(idx) && matchesGroundTruth(dName, truthName)
    );
    if (matchIndex >= 0) {
      tp++;
      matchedDetected.add(matchIndex);
    } else {
      fn++;
    }
  }

  const fp = detectedNames.length - matchedDetected.size;

  return { tp, fn, fp };
}

function computeMetrics(cm: ConfusionMatrix): Metrics {
  const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
  const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const f2 = precision + recall > 0 ? (5 * precision * recall) / (4 * precision + recall) : 0;
  return { precision, recall, f1, f2 };
}

// ══════════════════════════════════════════════════════════════
// FIXTURES
// ══════════════════════════════════════════════════════════════

const FIXTURES = [
  { csv: 'nubank-3months.csv', golden: 'nubank-3months.golden.json' },
  { csv: 'itau-credit-2months.csv', golden: 'itau-credit-2months.golden.json' },
  { csv: 'bradesco-checking-1month.csv', golden: 'bradesco-checking-1month.golden.json' },
  { csv: 'inter-credit-3months.csv', golden: 'inter-credit-3months.golden.json' },
  { csv: 'generic-csv-2months.csv', golden: 'generic-csv-2months.golden.json' },
];

// ══════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════

describe('Classification Accuracy', () => {
  const originalEnv = process.env['DEEPSEEK_API_KEY'];

  beforeAll(() => {
    // Desabilita IA para testes deterministicos
    delete process.env['DEEPSEEK_API_KEY'];
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env['DEEPSEEK_API_KEY'] = originalEnv;
    } else {
      delete process.env['DEEPSEEK_API_KEY'];
    }
  });

  const allMatrices: ConfusionMatrix[] = [];

  for (const fixture of FIXTURES) {
    describe(fixture.csv, () => {
      it('should detect subscriptions with acceptable accuracy', async () => {
        // 1. Load CSV fixture
        const csvPath = join(__dirname, 'fixtures', fixture.csv);
        expect(existsSync(csvPath)).toBe(true);
        const csvContent = readFileSync(csvPath);

        const files: FileToProcess[] = [{
          filename: fixture.csv,
          content: csvContent,
          mimetype: 'text/csv',
        }];

        // 2. Run pipeline
        const serviceResult = await analyzeStatements(files);
        expect(serviceResult.success).toBe(true);

        const result = serviceResult.result!;

        // 3. Load golden file
        const goldenPath = join(__dirname, 'golden', fixture.golden);
        expect(existsSync(goldenPath)).toBe(true);

        const goldenRaw = readFileSync(goldenPath, 'utf-8');
        const golden: GoldenFile = JSON.parse(goldenRaw);

        // 4. If UPDATE_GOLDEN, write snapshot (preserving groundTruth)
        if (process.env['UPDATE_GOLDEN'] === 'true') {
          golden.snapshot = JSON.parse(JSON.stringify(result, (_key, value) => {
            // Serialize Date objects to ISO strings
            if (value instanceof Date) return value.toISOString();
            return value;
          }));
          writeFileSync(goldenPath, JSON.stringify(golden, null, 2) + '\n');
        }

        const groundTruth: string[] = golden.groundTruth.subscriptions;

        // 5. Compute confusion matrix
        const cm = computeConfusionMatrix(result.subscriptions, groundTruth);
        allMatrices.push(cm);

        // 6. Compute metrics
        const metrics = computeMetrics(cm);

        // 7. Log for debugging
        console.log(`\n  [${fixture.csv}]`);
        console.log(`    TP=${cm.tp} FN=${cm.fn} FP=${cm.fp}`);
        console.log(`    Precision=${metrics.precision.toFixed(2)} Recall=${metrics.recall.toFixed(2)} F1=${metrics.f1.toFixed(2)} F2=${metrics.f2.toFixed(2)}`);
        console.log(`    Detected: ${result.subscriptions.map((s) => s.name).join(', ') || '(none)'}`);
        console.log(`    Expected: ${groundTruth.join(', ')}`);

        if (cm.fn > 0) {
          const missed = groundTruth.filter((t) =>
            !result.subscriptions.some((s) => matchesGroundTruth(s.name, t))
          );
          console.log(`    Missed (FN): ${missed.join(', ')}`);
        }
        if (cm.fp > 0) {
          const matchedIndices = new Set<number>();
          for (const t of groundTruth) {
            const idx = result.subscriptions.findIndex(
              (s, i) => !matchedIndices.has(i) && matchesGroundTruth(s.name, t)
            );
            if (idx >= 0) matchedIndices.add(idx);
          }
          const spurious = result.subscriptions
            .filter((_, i) => !matchedIndices.has(i))
            .map((s) => s.name);
          console.log(`    Spurious (FP): ${spurious.join(', ')}`);
        }

        // 8. Per-fixture assertions (relaxed — aggregate gates are stricter)
        expect(metrics.recall).toBeGreaterThanOrEqual(0.60);
        expect(metrics.precision).toBeGreaterThanOrEqual(0.50);
      });
    });
  }

  describe('Aggregate metrics', () => {
    it('should meet CI gate thresholds across all fixtures', () => {
      // Ensure all per-fixture tests ran
      expect(allMatrices.length).toBe(FIXTURES.length);

      // Sum all confusion matrices
      const aggregate = allMatrices.reduce(
        (acc, cm) => ({
          tp: acc.tp + cm.tp,
          fn: acc.fn + cm.fn,
          fp: acc.fp + cm.fp,
        }),
        { tp: 0, fn: 0, fp: 0 }
      );

      const metrics = computeMetrics(aggregate);

      console.log('\n  [AGGREGATE]');
      console.log(`    TP=${aggregate.tp} FN=${aggregate.fn} FP=${aggregate.fp}`);
      console.log(`    Precision=${metrics.precision.toFixed(3)} Recall=${metrics.recall.toFixed(3)} F1=${metrics.f1.toFixed(3)} F2=${metrics.f2.toFixed(3)}`);

      // CI gates
      expect(metrics.f1).toBeGreaterThanOrEqual(0.85);
      expect(metrics.recall).toBeGreaterThanOrEqual(0.90);
      expect(metrics.precision).toBeGreaterThanOrEqual(0.80);
    });
  });
});
