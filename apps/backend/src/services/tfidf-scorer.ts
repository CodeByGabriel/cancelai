/**
 * TF-IDF Cosine Similarity Scorer
 *
 * Scorer secundario para resolver ambiguidades quando Jaro-Winkler
 * retorna scores na zona 0.6-0.85 (inconclusivo).
 *
 * TF-IDF funciona melhor que JW para descricoes com mesmas palavras
 * em ordem diferente: "NETFLIX STREAMING" vs "STREAMING NETFLIX".
 *
 * Uso: scoring-stage chama tfidfCosineSimilarity() apenas na zona ambigua.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TfidfCorpus {
  readonly documentCount: number;
  readonly documentFrequency: ReadonlyMap<string, number>;
}

interface TfidfVector {
  readonly terms: ReadonlyMap<string, number>;
  readonly magnitude: number;
}

// ═══════════════════════════════════════════════════════════════
// CORPUS BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Constroi corpus de IDF a partir de documentos normalizados.
 * Cada documento e uma descricao de transacao ja normalizada (lowercase, sem acentos).
 */
export function buildCorpus(documents: readonly string[]): TfidfCorpus {
  const documentFrequency = new Map<string, number>();

  for (const doc of documents) {
    const uniqueTerms = new Set(tokenize(doc));
    for (const term of uniqueTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return {
    documentCount: documents.length,
    documentFrequency,
  };
}

// ═══════════════════════════════════════════════════════════════
// TF-IDF COSINE SIMILARITY
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula cosine similarity entre dois textos usando TF-IDF.
 * Retorna valor entre 0 e 1.
 *
 * @param a - Primeiro texto (normalizado)
 * @param b - Segundo texto (normalizado)
 * @param corpus - Corpus para calculo de IDF
 */
export function tfidfCosineSimilarity(
  a: string,
  b: string,
  corpus: TfidfCorpus,
): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const vecA = buildTfidfVector(a, corpus);
  const vecB = buildTfidfVector(b, corpus);

  if (vecA.magnitude === 0 || vecB.magnitude === 0) return 0;

  let dotProduct = 0;
  for (const [term, weightA] of vecA.terms) {
    const weightB = vecB.terms.get(term);
    if (weightB !== undefined) {
      dotProduct += weightA * weightB;
    }
  }

  const similarity = dotProduct / (vecA.magnitude * vecB.magnitude);
  return Math.min(1, Math.max(0, similarity));
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 0);
}

function buildTfidfVector(text: string, corpus: TfidfCorpus): TfidfVector {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { terms: new Map(), magnitude: 0 };

  // Term frequency
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }

  // TF-IDF weights
  const terms = new Map<string, number>();
  let magnitudeSquared = 0;

  for (const [term, count] of tf) {
    const termFreq = count / tokens.length;
    const df = corpus.documentFrequency.get(term) ?? 0;
    const idf = df > 0
      ? Math.log((corpus.documentCount + 1) / (df + 1)) + 1
      : Math.log(corpus.documentCount + 1) + 1;

    const weight = termFreq * idf;
    terms.set(term, weight);
    magnitudeSquared += weight * weight;
  }

  return {
    terms,
    magnitude: Math.sqrt(magnitudeSquared),
  };
}
