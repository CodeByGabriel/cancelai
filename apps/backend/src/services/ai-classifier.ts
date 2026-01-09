/**
 * AI Classifier - Classificação Semântica para Cobranças Ambíguas
 *
 * Este serviço é uma camada FINAL e ADITIVA que:
 * - NÃO altera o detector heurístico existente
 * - NÃO recebe transações cruas (apenas resumos)
 * - SÓ processa cobranças recorrentes AMBÍGUAS
 * - Tem fallback silencioso se falhar
 *
 * ARQUITETURA:
 * 1. Recebe apenas subscriptions com confidence !== 'high'
 * 2. Envia resumos estruturados (não dados sensíveis)
 * 3. IA classifica: subscription | installment | not_subscription
 * 4. Se subscription com confidence >= 0.75: promove para resultado final
 */

import type { DetectedSubscription, SubscriptionCategory } from '../types/index.js';
import { findKnownService, KNOWN_SERVICES } from './known-services.js';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

/**
 * Resumo de uma cobrança ambígua para envio à IA
 * NÃO contém dados sensíveis nem transações cruas
 */
export interface AmbiguousChargeSummary {
  id: string;
  normalizedDescription: string;
  occurrenceCount: number;
  values: number[];
  monthsDetected: string[];
  flags: ChargeFlags;
  possibleServiceMatches: string[];
}

/**
 * Flags que indicam características da cobrança
 */
interface ChargeFlags {
  hasParc: boolean;           // Contém "PARC" ou variações
  hasGoogle: boolean;         // Cobrado via Google
  hasApple: boolean;          // Cobrado via Apple
  hasInstallmentPattern: boolean; // Padrão de parcelamento
  isKnownService: boolean;    // Match com serviço conhecido
  hasConsistentValue: boolean; // Valores consistentes
  hasMonthlyPattern: boolean;  // Padrão mensal detectado
}

/**
 * Resposta da IA para cada cobrança
 */
export interface AIClassification {
  id: string;
  classification: 'subscription' | 'installment' | 'not_subscription';
  confidence: number; // 0-1
  reason: string;
}

/**
 * Resultado da classificação por IA
 */
export interface AIClassificationResult {
  processed: boolean;
  classifications: AIClassification[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  API_URL: 'https://api.deepseek.com/v1/chat/completions',
  MODEL: 'deepseek-chat',
  TIMEOUT_MS: 5000,
  MIN_CONFIDENCE_TO_INCLUDE: 0.75,
  MAX_ITEMS_PER_REQUEST: 10,
};

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica se a IA está configurada
 */
export function isAIConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

/**
 * Extrai meses das transações para o resumo
 */
function extractMonths(subscription: DetectedSubscription): string[] {
  const months = new Set<string>();
  for (const tx of subscription.transactions) {
    const date = new Date(tx.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(monthYear);
  }
  return Array.from(months).sort();
}

/**
 * Detecta flags de uma cobrança
 */
function detectFlags(subscription: DetectedSubscription): ChargeFlags {
  const desc = subscription.name.toUpperCase();
  const originalDescs = subscription.originalNames.map(n => n.toUpperCase());
  const allDescs = [desc, ...originalDescs].join(' ');

  // Detecta padrões
  const hasParc = /\bPARC\b/.test(allDescs) || /\bPARCEL/.test(allDescs);
  const hasGoogle = /\bGOOGLE\b/.test(allDescs);
  const hasApple = /\bAPPLE\b/.test(allDescs) || /\biTUNES\b/.test(allDescs);
  const hasInstallmentPattern = /\d+\s*[\/\\]\s*\d+/.test(allDescs) || /\d+\s*DE\s*\d+/.test(allDescs);

  // Verifica se é serviço conhecido
  const knownService = findKnownService(subscription.name);
  const isKnownService = !!knownService;

  // Verifica consistência de valor
  const values = subscription.transactions.map(t => t.amount);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
  const maxDeviation = Math.max(...values.map(v => Math.abs(v - avgValue)));
  const hasConsistentValue = avgValue > 0 && (maxDeviation / avgValue) < 0.15;

  // Verifica padrão mensal (baseado no score de recorrência original)
  const hasMonthlyPattern = subscription.confidenceScore !== undefined && subscription.confidenceScore >= 0.5;

  return {
    hasParc,
    hasGoogle,
    hasApple,
    hasInstallmentPattern,
    isKnownService,
    hasConsistentValue,
    hasMonthlyPattern,
  };
}

/**
 * Encontra possíveis matches com serviços conhecidos
 */
function findPossibleMatches(subscription: DetectedSubscription): string[] {
  const matches: string[] = [];
  const searchTerms = [subscription.name, ...subscription.originalNames];

  for (const term of searchTerms) {
    const service = findKnownService(term);
    if (service && !matches.includes(service.canonicalName)) {
      matches.push(service.canonicalName);
    }
  }

  return matches;
}

/**
 * Converte uma subscription ambígua em resumo para a IA
 */
function toSummary(subscription: DetectedSubscription): AmbiguousChargeSummary {
  return {
    id: subscription.id,
    normalizedDescription: subscription.name,
    occurrenceCount: subscription.occurrences,
    values: subscription.transactions.map(t => t.amount),
    monthsDetected: extractMonths(subscription),
    flags: detectFlags(subscription),
    possibleServiceMatches: findPossibleMatches(subscription),
  };
}

// ═══════════════════════════════════════════════════════════════
// SEPARAÇÃO DE RESULTADOS
// ═══════════════════════════════════════════════════════════════

/**
 * Separa assinaturas confirmadas das ambíguas
 * Assinaturas confirmadas: confidence === 'high' OU score >= 0.80
 * Ambíguas: todas as outras
 */
export function separateSubscriptions(subscriptions: readonly DetectedSubscription[]): {
  confirmed: DetectedSubscription[];
  ambiguous: DetectedSubscription[];
} {
  const confirmed: DetectedSubscription[] = [];
  const ambiguous: DetectedSubscription[] = [];

  for (const sub of subscriptions) {
    if (sub.confidence === 'high') {
      confirmed.push({ ...sub });
    } else {
      ambiguous.push({ ...sub });
    }
  }

  return { confirmed, ambiguous };
}

// ═══════════════════════════════════════════════════════════════
// PROMPT E CHAMADA À IA
// ═══════════════════════════════════════════════════════════════

/**
 * Monta o prompt para a IA
 */
function buildPrompt(summaries: AmbiguousChargeSummary[]): string {
  const data = summaries.map(s => ({
    id: s.id,
    desc: s.normalizedDescription,
    count: s.occurrenceCount,
    values: s.values,
    months: s.monthsDetected,
    flags: s.flags,
    matches: s.possibleServiceMatches,
  }));

  return `Você é um especialista em identificar assinaturas recorrentes em extratos bancários brasileiros.

Analise as seguintes cobranças AMBÍGUAS e classifique cada uma:

${JSON.stringify(data, null, 2)}

Para CADA item, responda:
- "subscription": É uma assinatura recorrente (streaming, software, academia, etc)
- "installment": É uma compra parcelada (mesmo comerciante, mas é parcela de compra)
- "not_subscription": Não é assinatura nem parcelamento recorrente

REGRAS DE CLASSIFICAÇÃO:
1. Se flags.hasParc ou flags.hasInstallmentPattern → provavelmente "installment"
2. Se possibleServiceMatches não está vazio → provavelmente "subscription"
3. Se flags.hasConsistentValue E flags.hasMonthlyPattern → pode ser "subscription"
4. Se valores variam muito (>15%) entre ocorrências → provavelmente "not_subscription"
5. Cobranças via Google/Apple com valores consistentes → provavelmente "subscription"

Responda APENAS com JSON válido:
{
  "classifications": [
    {
      "id": "id-do-item",
      "classification": "subscription" | "installment" | "not_subscription",
      "confidence": 0.0 a 1.0,
      "reason": "motivo curto em português"
    }
  ]
}`;
}

/**
 * Chama a API de IA
 */
async function callAI(prompt: string): Promise<AIClassification[] | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[AIClassifier] API retornou status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('[AIClassifier] Resposta sem conteúdo');
      return null;
    }

    // Extrai JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[AIClassifier] Não foi possível extrair JSON');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as { classifications?: AIClassification[] };
    return parsed.classifications ?? null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[AIClassifier] Timeout');
    } else {
      console.warn('[AIClassifier] Erro:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

/**
 * Classifica cobranças ambíguas usando IA
 *
 * @param ambiguousSubscriptions - Subscriptions com confidence !== 'high'
 * @returns Resultado da classificação
 */
export async function classifyAmbiguousCharges(
  ambiguousSubscriptions: readonly DetectedSubscription[]
): Promise<AIClassificationResult> {
  // Se não há itens ambíguos, retorna vazio
  if (ambiguousSubscriptions.length === 0) {
    return { processed: false, classifications: [] };
  }

  // Se IA não está configurada, retorna sem processar
  if (!isAIConfigured()) {
    return { processed: false, classifications: [], error: 'AI not configured' };
  }

  try {
    // Limita quantidade de itens por request
    const itemsToProcess = ambiguousSubscriptions.slice(0, CONFIG.MAX_ITEMS_PER_REQUEST);

    // Converte para resumos (sem dados sensíveis)
    const summaries = itemsToProcess.map(toSummary);

    // Monta prompt e chama IA
    const prompt = buildPrompt(summaries);
    const classifications = await callAI(prompt);

    if (!classifications) {
      return { processed: false, classifications: [], error: 'AI call failed' };
    }

    console.log(`[AIClassifier] Classificou ${classifications.length} itens`);
    return { processed: true, classifications };
  } catch (error) {
    console.warn('[AIClassifier] Erro ao classificar:', error);
    return { processed: false, classifications: [], error: String(error) };
  }
}

/**
 * Aplica classificações da IA nas subscriptions ambíguas
 * Retorna apenas as que foram classificadas como subscription com alta confiança
 *
 * @param ambiguous - Subscriptions ambíguas originais
 * @param classifications - Classificações da IA
 * @returns Subscriptions promovidas (agora confirmadas)
 */
export function applyAIClassifications(
  ambiguous: readonly DetectedSubscription[],
  classifications: AIClassification[]
): {
  promoted: DetectedSubscription[];
  discarded: DetectedSubscription[];
  unchanged: DetectedSubscription[];
} {
  const classificationMap = new Map(classifications.map(c => [c.id, c]));

  const promoted: DetectedSubscription[] = [];
  const discarded: DetectedSubscription[] = [];
  const unchanged: DetectedSubscription[] = [];

  for (const sub of ambiguous) {
    const classification = classificationMap.get(sub.id);

    if (!classification) {
      // Não foi classificado pela IA - mantém como está
      unchanged.push({ ...sub });
      continue;
    }

    if (
      classification.classification === 'subscription' &&
      classification.confidence >= CONFIG.MIN_CONFIDENCE_TO_INCLUDE
    ) {
      // Promovido: IA confirmou como assinatura com alta confiança
      promoted.push({
        ...sub,
        confidence: 'medium', // Promove para medium (não high, pois veio da IA)
        confidenceScore: Math.min(0.79, (sub.confidenceScore ?? 0.5) + 0.1),
        confidenceReasons: [
          ...sub.confidenceReasons,
          `IA: ${classification.reason}`,
        ],
      });
    } else if (
      classification.classification === 'installment' ||
      classification.classification === 'not_subscription'
    ) {
      // Descartado: IA classificou como parcelamento ou não-assinatura
      discarded.push({
        ...sub,
        confidenceReasons: [
          ...sub.confidenceReasons,
          `IA descartou: ${classification.reason}`,
        ],
      });
    } else {
      // Confiança baixa ou classificação incerta - mantém
      unchanged.push({ ...sub });
    }
  }

  return { promoted, discarded, unchanged };
}

/**
 * Pipeline completo de classificação com IA
 *
 * 1. Separa confirmed/ambiguous
 * 2. Envia ambiguous para IA
 * 3. Aplica classificações
 * 4. Retorna resultado final (confirmed + promoted + unchanged)
 */
export async function classifyWithAI(
  subscriptions: readonly DetectedSubscription[]
): Promise<DetectedSubscription[]> {
  // 1. Separa confirmadas das ambíguas
  const { confirmed, ambiguous } = separateSubscriptions(subscriptions);

  // Se não há ambíguas, retorna confirmadas
  if (ambiguous.length === 0) {
    return confirmed;
  }

  // Se IA não está configurada, retorna tudo junto (fallback silencioso)
  if (!isAIConfigured()) {
    return [...confirmed, ...ambiguous];
  }

  try {
    // 2. Classifica ambíguas com IA
    const result = await classifyAmbiguousCharges(ambiguous);

    if (!result.processed || result.classifications.length === 0) {
      // IA falhou - retorna tudo junto (fallback silencioso)
      return [...confirmed, ...ambiguous];
    }

    // 3. Aplica classificações
    const { promoted, discarded, unchanged } = applyAIClassifications(
      ambiguous,
      result.classifications
    );

    console.log(
      `[AIClassifier] Resultado: ${promoted.length} promovidos, ` +
      `${discarded.length} descartados, ${unchanged.length} inalterados`
    );

    // 4. Retorna resultado final
    // - confirmed: já eram high confidence
    // - promoted: IA confirmou como subscription
    // - unchanged: IA não teve certeza, mantém no resultado com confiança original
    // - discarded: NÃO incluído (IA disse que não é assinatura)
    return [...confirmed, ...promoted, ...unchanged];
  } catch (error) {
    console.warn('[AIClassifier] Erro no pipeline:', error);
    // Fallback silencioso - retorna tudo
    return [...confirmed, ...ambiguous];
  }
}
