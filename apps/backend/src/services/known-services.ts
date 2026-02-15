/**
 * Módulo de Serviços Conhecidos - MOAT do Cancelaí
 *
 * Matching engine para 150+ serviços de assinatura brasileiros.
 * Dados em config/known-services-data.ts, lógica de matching aqui.
 *
 * MATCHING PIPELINE (4 passes + LRU cache):
 * 1. HashMap exact match (O(1)) — aliases + billingDescriptors normalizados
 * 2. Gateway prefix removal + HashMap retry — preserva two-pass existente
 * 3. Substring match — aliases >= 4 chars contidos no input
 * 4. Fuse.js fuzzy fallback — threshold 0.4
 *
 * ÚLTIMA ATUALIZAÇÃO: Fevereiro 2026
 */

import type { SubscriptionCategory, CancelMethod } from '../types/index.js';
import { KNOWN_SERVICES_DATA } from '../config/known-services-data.js';
import { GATEWAY_PREFIXES as GATEWAY_PATTERNS, PLATFORM_HINTS } from '../config/index.js';
import { LRUCache } from '../utils/lru-cache.js';
import Fuse from 'fuse.js';

// ══════════════════════════════════════════════════════════════
// INTERFACE (re-exportada para consumidores)
// ══════════════════════════════════════════════════════════════

/**
 * Definição de um serviço conhecido
 */
export interface KnownService {
  /** Nome canônico para exibição */
  readonly canonicalName: string;

  /** Aliases encontrados em extratos (lowercase, sem acentos) */
  readonly aliases: readonly string[];

  /** Strings como aparecem em faturas COM prefixo de gateway (PAG*NETFLIX, GOOGLE*SPOTIFY, etc.) */
  readonly billingDescriptors: readonly string[];

  /** Categoria do serviço */
  readonly category: SubscriptionCategory;

  /** URL de cancelamento (quando disponível online) */
  readonly cancelUrl?: string;

  /** Instruções de cancelamento manual */
  readonly cancelInstructions?: string;

  /** Método de cancelamento */
  readonly cancelMethod?: CancelMethod | undefined;

  /** Faixa de preço típica em BRL (para validação de valores) */
  readonly typicalPriceRange: {
    readonly min: number;
    readonly max: number;
  };

  /** Indica se é um serviço muito comum (aumenta confiança) */
  readonly isPopular?: boolean;

  /** Moeda de cobrança (default BRL quando omitido) */
  readonly currency?: 'BRL' | 'USD' | 'EUR' | 'BRL/USD' | 'EUR/USD';

  /** Se IOF (3.5%) é aplicável — serviços cobrados em moeda estrangeira */
  readonly iofApplicable?: boolean;

  /** Status do serviço */
  readonly status?: 'active' | 'merged' | 'discontinued';

  /** Para serviços merged/discontinued, chave do serviço que o absorveu */
  readonly mergedInto?: string;

  /** Serviço cobra apenas anualmente (não tem plano mensal) */
  readonly annualOnly?: boolean;

  /** Plataforma intermediária de billing */
  readonly platformBilled?: 'apple' | 'google' | 'amazon' | 'hotmart' | 'direct';
}

// ══════════════════════════════════════════════════════════════
// DADOS (re-export para backward compat)
// ══════════════════════════════════════════════════════════════

export const KNOWN_SERVICES: Record<string, KnownService> = KNOWN_SERVICES_DATA;

// ══════════════════════════════════════════════════════════════
// NORMALIZATION & GATEWAY
// ══════════════════════════════════════════════════════════════

/**
 * Derive lowercase prefix strings from config regex patterns for startsWith() matching.
 * After normalizeForMatching(), gateway delimiters (*, +, .) become spaces,
 * so "PAG*NETFLIX" → "pag netflix" and prefix "pag " matches via startsWith().
 *
 * Single source of truth: GATEWAY_PREFIXES em config/index.ts (Fase 9 reconciliação)
 */
const gatewayPrefixStrings: readonly string[] = GATEWAY_PATTERNS.map((pattern) =>
  pattern
    .replace(/\\\*/g, '*')
    .replace(/\\\+/g, '+')
    .replace(/\\\./g, '.')
    .replace(/\\s\+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' '),
);

const INSTALLMENT_PATTERNS = [
  /parc\s*\d+\/\d+/i,
  /parcela\s*\d+/i,
  /\d+\/\d+$/,
  /parcel/i,
];

function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeGatewayPrefix(description: string): string {
  const normalized = normalizeForMatching(description);

  for (const prefix of gatewayPrefixStrings) {
    if (normalized.startsWith(prefix)) {
      return normalized.substring(prefix.length).trim();
    }
  }

  return normalized;
}

// ══════════════════════════════════════════════════════════════
// PRE-COMPUTED INDEXES (built once at module load)
// ══════════════════════════════════════════════════════════════

/** HashMap: normalized alias/descriptor → KnownService */
const aliasIndex = new Map<string, KnownService>();

/** Long aliases (>= 4 chars) for substring matching */
const longAliasEntries: Array<readonly [string, KnownService]> = [];

// Build indexes
for (const service of Object.values(KNOWN_SERVICES_DATA)) {
  // Index aliases
  for (const alias of service.aliases) {
    const normalized = normalizeForMatching(alias);
    if (normalized.length > 0 && !aliasIndex.has(normalized)) {
      aliasIndex.set(normalized, service);
    }
    if (normalized.length >= 4) {
      longAliasEntries.push([normalized, service] as const);
    }
  }

  // Index billing descriptors
  for (const descriptor of service.billingDescriptors) {
    const normalized = normalizeForMatching(descriptor);
    if (normalized.length > 0 && !aliasIndex.has(normalized)) {
      aliasIndex.set(normalized, service);
    }
  }

  // Index canonical name
  const normalizedName = normalizeForMatching(service.canonicalName);
  if (normalizedName.length > 0 && !aliasIndex.has(normalizedName)) {
    aliasIndex.set(normalizedName, service);
  }
}

// Sort long aliases by length descending (prefer longer matches first)
longAliasEntries.sort((a, b) => b[0].length - a[0].length);

// ── Collision detection (billingDescriptors duplicados entre serviços) ──
const descriptorOwners = new Map<string, string[]>();
for (const [key, service] of Object.entries(KNOWN_SERVICES_DATA)) {
  for (const descriptor of service.billingDescriptors) {
    const norm = normalizeForMatching(descriptor);
    if (norm.length === 0) continue;
    const owners = descriptorOwners.get(norm);
    if (owners) {
      owners.push(key);
    } else {
      descriptorOwners.set(norm, [key]);
    }
  }
}
for (const [desc, owners] of descriptorOwners) {
  if (owners.length > 1) {
    console.warn(
      `[known-services] descriptor collision: "${desc}" → ${owners.join(', ')}`
    );
  }
}

/** Fuse.js index for fuzzy matching */
const fuseItems = Object.values(KNOWN_SERVICES_DATA).map((service) => ({
  service,
  canonicalName: normalizeForMatching(service.canonicalName),
  aliases: service.aliases.map(normalizeForMatching).join(' '),
}));

const fuseIndex = new Fuse(fuseItems, {
  keys: [
    { name: 'canonicalName', weight: 1.0 },
    { name: 'aliases', weight: 0.8 },
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true,
});

/** LRU cache: description → KnownService | null */
const MATCH_CACHE_SIZE = 5_000;
const matchCache = new LRUCache<string, KnownService | null>(MATCH_CACHE_SIZE);

// ══════════════════════════════════════════════════════════════
// MATCHING FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Verifica se a descrição indica parcelamento
 */
export function isInstallmentPayment(description: string): boolean {
  return INSTALLMENT_PATTERNS.some((pattern) => pattern.test(description));
}

/**
 * Encontra um serviço conhecido pela descrição
 *
 * Pipeline de matching (4 passes + LRU cache):
 * 1. HashMap exact match (O(1))
 * 2. Gateway prefix removal + HashMap retry
 * 3. Substring match (aliases >= 4 chars contidos no input)
 * 4. Fuse.js fuzzy fallback (threshold 0.4)
 */
export function findKnownService(description: string): KnownService | null {
  // 0. LRU cache check
  const cached = matchCache.get(description);
  if (cached !== undefined) return cached;

  const normalized = normalizeForMatching(description);
  let result: KnownService | null = null;

  // 1. HashMap exact match
  result = aliasIndex.get(normalized) ?? null;

  // 2. Gateway prefix removal + HashMap retry
  if (!result) {
    const stripped = removeGatewayPrefix(description);
    if (stripped !== normalized) {
      result = aliasIndex.get(stripped) ?? null;
    }
  }

  // 3. Substring match (aliases >= 4 chars contained in input)
  if (!result) {
    for (const [alias, service] of longAliasEntries) {
      if (normalized.includes(alias)) {
        result = service;
        break;
      }
    }
  }

  // 4. Fuse.js fuzzy fallback
  if (!result) {
    const fuseResults = fuseIndex.search(normalized);
    const topResult = fuseResults[0];
    if (topResult && topResult.score !== undefined && topResult.score < 0.4) {
      result = topResult.item.service;
    }
  }

  // 5. Cache store (including nulls to avoid re-search)
  matchCache.set(description, result);
  return result;
}

/**
 * Detecta plataforma de billing quando o serviço específico não é identificado.
 * Roda como FALLBACK após findKnownService() retornar null.
 * Retorna label genérico + categoria para boost de scoring.
 */
export function detectPlatformHint(description: string): {
  label: string;
  category: SubscriptionCategory;
} | null {
  const normalized = normalizeForMatching(description);
  for (const hint of PLATFORM_HINTS) {
    if (normalized.includes(hint.pattern)) {
      return { label: hint.label, category: hint.category as SubscriptionCategory };
    }
  }
  return null;
}

/**
 * Verifica se um valor está na faixa típica de um serviço
 */
export function isValueInTypicalRange(
  service: KnownService,
  value: number,
): boolean {
  if (!service.typicalPriceRange) {
    return true;
  }

  const { min, max } = service.typicalPriceRange;
  const tolerance = 0.2;

  return value >= min * (1 - tolerance) && value <= max * (1 + tolerance);
}

/**
 * Retorna instruções de cancelamento formatadas
 */
export function getCancelInstructions(service: KnownService): string {
  if (service.cancelUrl) {
    return service.cancelUrl;
  }
  if (service.cancelInstructions) {
    return service.cancelInstructions;
  }
  return 'Entre em contato com o serviço para cancelar';
}

/**
 * Lista todos os serviços conhecidos
 */
export function getAllKnownServices(): KnownService[] {
  return Object.values(KNOWN_SERVICES);
}

/**
 * Retorna estatísticas do banco de serviços
 */
export function getServiceStats(): {
  total: number;
  byCategory: Record<string, number>;
  popular: number;
  totalAliases: number;
  totalDescriptors: number;
  indexSize: number;
} {
  const services = getAllKnownServices();
  const byCategory: Record<string, number> = {};
  let totalAliases = 0;
  let totalDescriptors = 0;

  for (const service of services) {
    byCategory[service.category] = (byCategory[service.category] ?? 0) + 1;
    totalAliases += service.aliases.length;
    totalDescriptors += service.billingDescriptors.length;
  }

  return {
    total: services.length,
    byCategory,
    popular: services.filter((s) => s.isPopular).length,
    totalAliases,
    totalDescriptors,
    indexSize: aliasIndex.size,
  };
}

/**
 * Exporta lista simplificada para uso em APIs públicas
 */
export function getPublicServiceList(): Array<{
  name: string;
  category: string;
  hasOnlineCancellation: boolean;
}> {
  return getAllKnownServices().map((service) => ({
    name: service.canonicalName,
    category: service.category,
    hasOnlineCancellation: !!service.cancelUrl,
  }));
}

/**
 * Limpa cache de matching (para testes)
 */
export function clearMatchCache(): void {
  matchCache.clear();
}
