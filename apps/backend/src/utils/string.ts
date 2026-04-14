/**
 * Utilitários de manipulação de strings para o Cancelaí
 *
 * Funções especializadas para normalização de descrições bancárias brasileiras.
 * Pipeline de similaridade híbrido: Token Jaccard → Jaro-Winkler → Dice tiebreaker.
 */

import { JaroWrinker, SorensenDice } from 'string-comparisons';
import { LRUCache } from './lru-cache.js';
import {
  GATEWAY_PREFIXES,
  NOISE_STOP_WORDS,
  SIMILARITY_CONFIG,
  NORMALIZATION_CACHE_SIZE,
} from '../config/index.js';

// ── Pre-compiled regexes ────────────────────────────────────────────

const GATEWAY_REGEX = new RegExp(
  `^(?:${GATEWAY_PREFIXES.join('|')})`,
  'i',
);

const STOP_WORDS_REGEX = new RegExp(
  `\\b(?:${NOISE_STOP_WORDS.join('|')})\\b`,
  'gi',
);

const ACCENT_REGEX = /[\u0300-\u036f]/g;
// Auth codes: sequences with at least one digit AND 6+ total alnum chars (not pure alpha words)
const AUTH_CODE_REGEX = /\b(?=[A-Z0-9]*\d)[A-Z0-9]{6,}\b/g;
const DATE_REGEX = /\d{2}\/\d{2}(?:\/\d{2,4})?/g;
const TIME_REGEX = /\d{2}:\d{2}(?::\d{2})?/g;
const INSTALLMENT_REGEX = /\b(?:PARC(?:ELA)?\.?\s*\d+\s*(?:\/|DE)\s*\d+|\d+\s*[Xx]\s|\d+\/\d+)\b/gi;
const TRAILING_REF_REGEX = /\s*\d{6,}\s*$/;
const SPECIAL_CHARS_REGEX = /[^\w\s]/g;
const MULTI_SPACE_REGEX = /\s+/g;

// ── LRU Cache ───────────────────────────────────────────────────────

const normalizationCache = new LRUCache<string, string>(NORMALIZATION_CACHE_SIZE);

/**
 * Limpa o cache de normalizacao (para testes)
 */
export function clearNormalizationCache(): void {
  normalizationCache.clear();
}

/**
 * Normaliza uma descrição de transação para comparação
 *
 * Pipeline:
 * 1. Cache check
 * 2. Strip acentos (NFD)
 * 3. Uppercase (para regex matching)
 * 4. Remove gateway prefixes (PAG*, MP*, etc.)
 * 5. Remove codigos alfanumericos 6+ chars
 * 6. Remove datas embutidas DD/MM, timestamps
 * 7. Remove marcadores de parcela
 * 8. Remove stop words financeiras
 * 9. Remove chars especiais, collapse whitespace
 * 10. Lowercase final, trim
 */
export function normalizeDescription(description: string): string {
  const cached = normalizationCache.get(description);
  if (cached !== undefined) return cached;

  let result = description;

  // Strip acentos
  result = result.normalize('NFD').replace(ACCENT_REGEX, '');

  // Uppercase para regex matching
  result = result.toUpperCase();

  // Remove gateway prefixes
  result = result.replace(GATEWAY_REGEX, '');

  // Remove codigos alfanumericos 6+ chars (auth codes, IDs)
  result = result.replace(AUTH_CODE_REGEX, '');

  // Remove numeros de referencia no final (6+ digitos)
  result = result.replace(TRAILING_REF_REGEX, '');

  // Remove datas embutidas
  result = result.replace(DATE_REGEX, '');

  // Remove timestamps
  result = result.replace(TIME_REGEX, '');

  // Remove marcadores de parcela
  result = result.replace(INSTALLMENT_REGEX, '');

  // Remove stop words financeiras
  result = result.replace(STOP_WORDS_REGEX, '');

  // Remove chars especiais
  result = result.replace(SPECIAL_CHARS_REGEX, ' ');

  // Collapse whitespace
  result = result.replace(MULTI_SPACE_REGEX, ' ');

  // Lowercase final + trim
  result = result.toLowerCase().trim();

  normalizationCache.set(description, result);
  return result;
}

/**
 * Extrai o nome provável do serviço de uma descrição
 *
 * Tenta identificar o nome comercial removendo ruídos comuns.
 */
export function extractServiceName(description: string): string {
  const normalized = normalizeDescription(description);

  // Pega as primeiras palavras significativas (geralmente o nome do serviço)
  const words = normalized.split(' ').filter((w) => w.length > 2);
  const significantWords = words.slice(0, 3);

  return significantWords.join(' ') || normalized;
}

// ── Similarity Pipeline ─────────────────────────────────────────────

/**
 * Calcula Token Jaccard (set intersection / union de palavras)
 */
function tokenJaccard(s1: string, s2: string): number {
  const tokens1 = new Set(s1.split(' ').filter(Boolean));
  const tokens2 = new Set(s2.split(' ').filter(Boolean));

  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }

  const union = tokens1.size + tokens2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calcula similaridade entre duas descrições
 *
 * Pipeline híbrido:
 * 1. Token Jaccard pre-filter (fast reject se < 0.3)
 * 2. Jaro-Winkler primary (se >= 0.88, retorna JW score)
 * 3. Dice tiebreaker (se >= 0.65, retorna media)
 * 4. Senao retorna max(JW, Dice)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeDescription(str1);
  const normalized2 = normalizeDescription(str2);

  // Strings idênticas após normalização
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Uma das strings está vazia
  if (!normalized1 || !normalized2) {
    return 0;
  }

  // Step 1: Token Jaccard pre-filter
  const jaccard = tokenJaccard(normalized1, normalized2);
  if (jaccard < SIMILARITY_CONFIG.tokenJaccardPreFilter) {
    return jaccard;
  }

  // Step 2: Jaro-Winkler primary
  const jw = JaroWrinker.similarity(normalized1, normalized2);
  if (jw >= SIMILARITY_CONFIG.jaroWinklerPrimary) {
    return jw;
  }

  // Step 3: Dice tiebreaker
  const dice = SorensenDice.similarity(normalized1, normalized2);
  if (dice >= SIMILARITY_CONFIG.diceTiebreaker) {
    return (jw + dice) / 2;
  }

  // Step 4: Return max
  return Math.max(jw, dice);
}

/**
 * Agrupa strings similares
 *
 * Útil para agrupar variações de um mesmo serviço.
 */
export function groupSimilarStrings(
  strings: string[],
  threshold: number
): string[][] {
  const groups: string[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < strings.length; i++) {
    if (used.has(i)) continue;

    const group: string[] = [strings[i]!];
    used.add(i);

    for (let j = i + 1; j < strings.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(strings[i]!, strings[j]!);
      if (similarity >= threshold) {
        group.push(strings[j]!);
        used.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Remove acentos de uma string
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera um hash simples para deduplicação de transações
 *
 * SEGURANÇA: Não é criptográfico, apenas para deduplicação em memória.
 */
export function generateTransactionHash(
  date: Date,
  amount: number,
  description: string
): string {
  const dateStr = date.toISOString().split('T')[0];
  const amountStr = amount.toFixed(2);
  const descNorm = normalizeDescription(description).substring(0, 50);

  // Hash simples baseado em string
  let hash = 0;
  const combined = `${dateStr}|${amountStr}|${descNorm}`;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Converte para 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Capitaliza o nome de um serviço para exibição
 */
export function capitalizeServiceName(name: string): string {
  // Serviços com capitalização específica
  const specialCases: Record<string, string> = {
    netflix: 'Netflix',
    spotify: 'Spotify',
    'amazon prime': 'Amazon Prime',
    'disney+': 'Disney+',
    'disney plus': 'Disney+',
    'hbo max': 'HBO Max',
    max: 'Max',
    globoplay: 'Globoplay',
    youtube: 'YouTube',
    'youtube music': 'YouTube Music',
    'youtube premium': 'YouTube Premium',
    xbox: 'Xbox',
    playstation: 'PlayStation',
    steam: 'Steam',
    adobe: 'Adobe',
    'microsoft 365': 'Microsoft 365',
    dropbox: 'Dropbox',
    'google one': 'Google One',
    icloud: 'iCloud',
    ifood: 'iFood',
    uber: 'Uber',
    rappi: 'Rappi',
    duolingo: 'Duolingo',
    linkedin: 'LinkedIn',
    canva: 'Canva',
    deezer: 'Deezer',
    'smart fit': 'Smart Fit',
    gympass: 'Gympass',
    wellhub: 'Wellhub',
    alura: 'Alura',
    coursera: 'Coursera',
  };

  const lower = name.toLowerCase();
  if (specialCases[lower]) {
    return specialCases[lower];
  }

  // Capitalização padrão: primeira letra de cada palavra
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
