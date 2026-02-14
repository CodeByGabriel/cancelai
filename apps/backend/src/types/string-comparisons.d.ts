declare module 'string-comparisons' {
  interface StringComparator {
    similarity(s1: string, s2: string): number;
  }

  export const Cosine: StringComparator;
  export const DamerauLevenshtein: StringComparator;
  export const HammingDistance: StringComparator;
  export const Jaccard: StringComparator;
  export const Jaro: StringComparator;
  export const JaroWrinker: StringComparator;
  export const Levenshtein: StringComparator;
  export const Ngram: StringComparator;
  export const OptimalStringAlignment: StringComparator;
  export const Qgram: StringComparator;
  export const SmithWaterman: StringComparator;
  export const SorensenDice: StringComparator;
  export const SzymkiewiczSimpsonOverlap: StringComparator;
  export const Trigram: StringComparator;
}
