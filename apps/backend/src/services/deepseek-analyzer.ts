/**
 * DeepSeek Analyzer - Camada auxiliar de IA para refinamento de resultados
 *
 * IMPORTANTE: Este serviço é OPCIONAL e AUXILIAR. Ele NUNCA:
 * - Cria novas assinaturas
 * - Remove assinaturas detectadas
 * - Substitui o detector principal
 *
 * Ele APENAS pode:
 * - Ajustar confidence em ±0.1 (máximo)
 * - Sugerir nome canônico mais legível
 * - Sugerir categoria mais apropriada
 *
 * Se a API falhar ou não estiver configurada, o sistema continua normalmente.
 */

import type { DetectedSubscription, SubscriptionCategory } from '../types/index.js';

/**
 * Resposta esperada do DeepSeek para cada assinatura
 */
interface DeepSeekSubscriptionAnalysis {
  id: string;
  canonicalName?: string;
  category?: SubscriptionCategory;
  confidenceAdjustment: number; // -0.1 a +0.1
  reason?: string;
}

/**
 * Resposta completa do DeepSeek
 */
interface DeepSeekResponse {
  analyses: DeepSeekSubscriptionAnalysis[];
}

/**
 * Configuração do serviço
 */
const CONFIG = {
  API_URL: 'https://api.deepseek.com/v1/chat/completions',
  MODEL: 'deepseek-chat',
  TIMEOUT_MS: 3000,
  MAX_CONFIDENCE_ADJUSTMENT: 0.1,
};

/**
 * Verifica se o serviço está configurado
 */
export function isDeepSeekConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

/**
 * Monta o prompt para análise das assinaturas
 */
function buildPrompt(subscriptions: readonly DetectedSubscription[]): string {
  const subscriptionData = subscriptions.map((s) => ({
    id: s.id,
    name: s.name,
    originalNames: s.originalNames,
    monthlyAmount: s.monthlyAmount,
    occurrences: s.occurrences,
    confidence: s.confidence,
    confidenceScore: s.confidenceScore,
    category: s.category,
  }));

  return `Você é um especialista em identificar assinaturas e serviços recorrentes em extratos bancários brasileiros.

Analise as seguintes assinaturas detectadas e para cada uma:
1. Sugira um nome canônico mais legível (se o atual estiver confuso)
2. Sugira uma categoria mais apropriada se necessário
3. Ajuste a confiança em -0.1 a +0.1 baseado em:
   - Se o nome parece claramente uma assinatura conhecida: +0.05 a +0.1
   - Se parece parcela ou compra única: -0.05 a -0.1
   - Se há dúvida: 0

Assinaturas para analisar:
${JSON.stringify(subscriptionData, null, 2)}

Responda APENAS com JSON válido no formato:
{
  "analyses": [
    {
      "id": "id-da-assinatura",
      "canonicalName": "Nome Sugerido ou null",
      "category": "categoria-sugerida ou null",
      "confidenceAdjustment": 0.05,
      "reason": "motivo breve"
    }
  ]
}

Categorias válidas: streaming, music, gaming, software, cloud, news, fitness, food, transport, education, finance, other

IMPORTANTE:
- confidenceAdjustment DEVE estar entre -0.1 e 0.1
- Se não tiver certeza, use 0
- Não invente serviços que não existem
- Serviços brasileiros conhecidos: Netflix, Spotify, Amazon Prime, Disney+, HBO Max, Globoplay, YouTube Premium, iFood Club, Rappi Prime, 99 Pass, Uber Pass, Gympass, Smart Fit, Apple (iCloud, Music, TV+), Google (One, Play Pass), Microsoft 365, Adobe, Notion, Canva, Duolingo, Coursera, LinkedIn Premium`;
}

/**
 * Chama a API do DeepSeek
 */
async function callDeepSeekAPI(prompt: string): Promise<DeepSeekResponse | null> {
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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Baixa temperatura para respostas mais consistentes
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[DeepSeekAnalyzer] API retornou status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('[DeepSeekAnalyzer] Resposta sem conteúdo');
      return null;
    }

    // Extrai JSON da resposta (pode vir com markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[DeepSeekAnalyzer] Não foi possível extrair JSON da resposta');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as DeepSeekResponse;
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[DeepSeekAnalyzer] Timeout ao chamar API');
    } else {
      console.warn('[DeepSeekAnalyzer] Erro ao chamar API:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Valida e limita o ajuste de confiança
 */
function clampConfidenceAdjustment(adjustment: number): number {
  if (typeof adjustment !== 'number' || isNaN(adjustment)) {
    return 0;
  }
  return Math.max(-CONFIG.MAX_CONFIDENCE_ADJUSTMENT, Math.min(CONFIG.MAX_CONFIDENCE_ADJUSTMENT, adjustment));
}

/**
 * Valida se uma categoria é válida
 */
function isValidCategory(category: unknown): category is SubscriptionCategory {
  const validCategories: SubscriptionCategory[] = [
    'streaming',
    'music',
    'gaming',
    'software',
    'cloud',
    'news',
    'fitness',
    'food',
    'transport',
    'education',
    'finance',
    'other',
  ];
  return typeof category === 'string' && validCategories.includes(category as SubscriptionCategory);
}

/**
 * Aplica as análises do DeepSeek nas assinaturas
 * Retorna uma nova lista com os refinamentos aplicados
 */
function applyAnalyses(
  subscriptions: readonly DetectedSubscription[],
  analyses: DeepSeekSubscriptionAnalysis[]
): DetectedSubscription[] {
  const analysisMap = new Map(analyses.map((a) => [a.id, a]));

  return subscriptions.map((sub) => {
    const analysis = analysisMap.get(sub.id);

    if (!analysis) {
      return { ...sub };
    }

    const adjustment = clampConfidenceAdjustment(analysis.confidenceAdjustment);
    const currentScore = sub.confidenceScore ?? 0.5;
    const newScore = Math.max(0, Math.min(1, currentScore + adjustment));

    // Determina novo nível de confiança baseado no score
    let newConfidence: 'high' | 'medium' | 'low' = sub.confidence;
    if (newScore >= 0.7) {
      newConfidence = 'high';
    } else if (newScore >= 0.4) {
      newConfidence = 'medium';
    } else {
      newConfidence = 'low';
    }

    // Determina categoria final
    const finalCategory = isValidCategory(analysis.category) ? analysis.category : sub.category;

    // Aplica refinamentos
    const refined = {
      ...sub,
      name: analysis.canonicalName && analysis.canonicalName.trim() ? analysis.canonicalName.trim() : sub.name,
      ...(finalCategory ? { category: finalCategory } : {}),
      confidenceScore: newScore,
      confidence: newConfidence,
      confidenceReasons:
        analysis.reason && adjustment !== 0
          ? [...sub.confidenceReasons, `IA: ${analysis.reason}`]
          : [...sub.confidenceReasons],
    } as DetectedSubscription;

    return refined;
  });
}

/**
 * Refina as assinaturas detectadas usando DeepSeek
 *
 * Esta função é segura para chamar mesmo sem API key configurada.
 * Se falhar por qualquer motivo, retorna as assinaturas originais.
 *
 * @param subscriptions - Assinaturas detectadas pelo detector principal
 * @returns Assinaturas refinadas (ou originais se falhar)
 */
export async function refineWithDeepSeek(
  subscriptions: readonly DetectedSubscription[]
): Promise<DetectedSubscription[]> {
  // Se não há assinaturas, retorna vazio
  if (subscriptions.length === 0) {
    return [];
  }

  // Se não está configurado, retorna originais silenciosamente
  if (!isDeepSeekConfigured()) {
    return subscriptions.map((s) => ({ ...s }));
  }

  try {
    const prompt = buildPrompt(subscriptions);
    const response = await callDeepSeekAPI(prompt);

    if (!response || !Array.isArray(response.analyses)) {
      // Falha silenciosa - retorna originais
      return subscriptions.map((s) => ({ ...s }));
    }

    const refined = applyAnalyses(subscriptions, response.analyses);
    console.log(`[DeepSeekAnalyzer] Refinou ${refined.length} assinaturas`);

    return refined;
  } catch (error) {
    // Qualquer erro - retorna originais silenciosamente
    console.warn('[DeepSeekAnalyzer] Erro ao refinar:', error);
    return subscriptions.map((s) => ({ ...s }));
  }
}
