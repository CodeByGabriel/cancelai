/**
 * Grouping Stage
 *
 * Agrupa transacoes por similaridade de descricao usando bigram inverted index
 * para pre-filtrar candidatos (O(n × avg_candidates) em vez de O(n²)).
 * Apos agrupamento, enriquece com metricas de recorrencia.
 */

import type { Transaction } from '../../types/index.js';
import type { PipelineContext, PipelineEvent, PipelineStage, TransactionGroup } from '../pipeline-events.js';
import { normalizeDescription, calculateSimilarity } from '../../utils/string.js';
import { isWithinTolerance, calculateAverage } from '../../utils/amount.js';
import { config } from '../../config/index.js';
import { enrichGroupsWithRecurrence } from './recurrence-analyzer.js';

/**
 * Gera bigrams (pares de caracteres consecutivos) de uma string
 */
function generateBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Constroi indice invertido: bigram → Set<indice da transacao>
 */
function buildBigramIndex(normalizedNames: string[]): Map<string, Set<number>> {
  const index = new Map<string, Set<number>>();

  for (let i = 0; i < normalizedNames.length; i++) {
    const bigrams = generateBigrams(normalizedNames[i]!);
    for (const bigram of bigrams) {
      let set = index.get(bigram);
      if (!set) {
        set = new Set<number>();
        index.set(bigram, set);
      }
      set.add(i);
    }
  }

  return index;
}

/**
 * Encontra candidatos que compartilham >= 2 bigrams com a string alvo
 */
function findCandidates(
  targetBigrams: Set<string>,
  bigramIndex: Map<string, Set<number>>,
  minShared: number,
): Set<number> {
  const counts = new Map<number, number>();

  for (const bigram of targetBigrams) {
    const indices = bigramIndex.get(bigram);
    if (!indices) continue;
    for (const idx of indices) {
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
  }

  const candidates = new Set<number>();
  for (const [idx, count] of counts) {
    if (count >= minShared) {
      candidates.add(idx);
    }
  }

  return candidates;
}

const MIN_SHARED_BIGRAMS = 2;

/**
 * Agrupa transacoes com descricoes similares usando bigram index
 */
function groupTransactionsBySimilarity(transactions: Transaction[]): TransactionGroup[] {
  const groups: TransactionGroup[] = [];
  const processed = new Set<number>();

  // Pre-normaliza todas as descricoes
  const normalizedNames = transactions.map((t) => normalizeDescription(t.description));

  // Constroi bigram inverted index
  const bigramIndex = buildBigramIndex(normalizedNames);

  for (let i = 0; i < transactions.length; i++) {
    if (processed.has(i)) continue;

    const baseTransaction = transactions[i]!;
    const baseName = normalizedNames[i]!;

    const group: TransactionGroup = {
      normalizedName: baseName,
      originalNames: new Set([baseTransaction.description]),
      transactions: [baseTransaction],
      averageAmount: baseTransaction.amount,
      stringSimilarityScore: 1.0,
    };

    processed.add(i);

    const similarities: number[] = [1.0];

    // Encontra candidatos via bigram index
    const baseBigrams = generateBigrams(baseName);
    const candidates = findCandidates(baseBigrams, bigramIndex, MIN_SHARED_BIGRAMS);

    for (const j of candidates) {
      if (j <= i || processed.has(j)) continue;

      const candidate = transactions[j]!;
      const candidateName = normalizedNames[j]!;

      const similarity = calculateSimilarity(baseName, candidateName);

      if (similarity >= config.detection.similarityThreshold) {
        const amountSimilar = isWithinTolerance(
          baseTransaction.amount,
          candidate.amount,
          config.detection.amountTolerancePercent,
        );

        if (amountSimilar) {
          group.transactions.push(candidate);
          group.originalNames.add(candidate.description);
          similarities.push(similarity);
          processed.add(j);
        }
      }
    }

    const amounts = group.transactions.map((t) => t.amount);
    group.averageAmount = calculateAverage(amounts);
    group.stringSimilarityScore = calculateAverage(similarities);

    groups.push(group);
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════

export class GroupingStage implements PipelineStage {
  readonly name = 'grouping';

  // eslint-disable-next-line @typescript-eslint/require-await -- async required for AsyncGenerator return type
  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    const allGroups = groupTransactionsBySimilarity(context.validTransactions);

    // Filtra grupos com minimo de ocorrencias
    const potentialGroups = allGroups.filter(
      (group) => group.transactions.length >= config.detection.minOccurrences,
    );

    // Enriquece com metricas de recorrencia
    enrichGroupsWithRecurrence(potentialGroups);

    context.groups = potentialGroups;

    yield {
      type: 'progress',
      stage: this.name,
      current: context.validTransactions.length,
      total: context.validTransactions.length,
      message: `${allGroups.length} grupos encontrados, ${potentialGroups.length} com >= ${config.detection.minOccurrences} ocorrencias`,
    };

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: {
        totalGroups: allGroups.length,
        potentialGroups: potentialGroups.length,
        transactionsProcessed: context.validTransactions.length,
      },
    };
  }
}
