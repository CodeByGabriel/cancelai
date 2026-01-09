/**
 * Serviço de Análise de Extratos
 *
 * Orquestra o processo completo: parsing → detecção → resultado.
 * SEGURANÇA: Todos os dados são processados em memória e descartados.
 */

import type { AnalysisResult, DetectedSubscription } from '../types/index.js';
import { parseStatements, type FileToProcess } from '../parsers/index.js';
import { detectSubscriptions } from '../detector/index.js';
import { classifyWithAI } from './ai-classifier.js';

/**
 * Resultado do serviço de análise
 */
export interface AnalysisServiceResult {
  success: boolean;
  result?: AnalysisResult;
  errors: string[];
  warnings: string[];
}

/**
 * Analisa arquivos de extrato e retorna assinaturas detectadas
 *
 * @param files - Arquivos de extrato (PDF ou CSV)
 * @returns Resultado da análise com assinaturas detectadas
 */
export async function analyzeStatements(
  files: FileToProcess[]
): Promise<AnalysisServiceResult> {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  try {
    // 1. Valida se há arquivos
    if (files.length === 0) {
      return {
        success: false,
        errors: ['Nenhum arquivo enviado para análise'],
        warnings: [],
      };
    }

    // 2. Parse dos arquivos
    const { transactions, results: parseResults } = await parseStatements(files);

    // Coleta erros e avisos do parsing
    for (const result of parseResults) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    // Se nenhum arquivo foi parseado com sucesso
    const successfulParses = parseResults.filter((r) => r.success);
    if (successfulParses.length === 0) {
      return {
        success: false,
        errors: allErrors.length > 0 ? allErrors : ['Não foi possível processar nenhum arquivo'],
        warnings: allWarnings,
      };
    }

    // 3. Se não encontrou transações reconhecíveis
    // NOTA: Isso NÃO é um erro - o extrato pode ser válido mas conter apenas
    // transações que não seguem padrões reconhecíveis (Pix, transferências avulsas)
    if (transactions.length === 0) {
      // Retorna sucesso com resultado vazio e mensagem informativa
      return {
        success: true,
        result: {
          subscriptions: [],
          summary: {
            totalMonthlySpending: 0,
            totalAnnualSpending: 0,
            subscriptionCount: 0,
            highConfidenceCount: 0,
            mediumConfidenceCount: 0,
            lowConfidenceCount: 0,
            periodStart: new Date(),
            periodEnd: new Date(),
            transactionsAnalyzed: 0,
          },
          metadata: {
            processedAt: new Date(),
            processingTimeMs: Date.now() - Date.now(),
            filesProcessed: successfulParses.length,
            bankFormatsDetected: parseResults.filter((r) => r.success).map((r) => r.bankDetected),
            version: '1.0.0',
          },
        },
        errors: [],
        warnings: [
          ...allWarnings,
          'Nenhuma transação reconhecível encontrada nos arquivos.',
          'Pagamentos via Pix e transferências avulsas não são considerados assinaturas.',
        ],
      };
    }

    // 4. Detecta assinaturas (detector heurístico principal)
    const analysisResult = await detectSubscriptions(transactions);

    // 5. Classificação com IA (camada FINAL e ADITIVA)
    // - Separa confirmed/ambiguous
    // - Envia apenas resumos de ambíguos para IA
    // - Fallback silencioso se IA falhar
    let finalSubscriptions: DetectedSubscription[] = [...analysisResult.subscriptions];
    if (analysisResult.subscriptions.length > 0) {
      finalSubscriptions = await classifyWithAI(analysisResult.subscriptions);
    }

    // 6. Atualiza metadados com informações do parsing
    const banksDetected = parseResults
      .filter((r) => r.success)
      .map((r) => r.bankDetected);

    // Prepara mensagens informativas baseadas no resultado
    const resultWarnings: string[] = [...allWarnings];
    const resultInfo: string[] = [];

    // Se não encontrou assinaturas, adiciona mensagens informativas
    if (analysisResult.subscriptions.length === 0) {
      resultInfo.push(
        'Nenhuma assinatura recorrente foi detectada nesse período.',
        'Pagamentos via Pix e compras avulsas não são considerados assinaturas.',
        'Para melhores resultados, envie extratos do cartão de crédito dos últimos 2-3 meses.'
      );
    }

    // Recalcula summary com assinaturas refinadas (confiança pode ter mudado)
    const highCount = finalSubscriptions.filter((s) => s.confidence === 'high').length;
    const mediumCount = finalSubscriptions.filter((s) => s.confidence === 'medium').length;
    const lowCount = finalSubscriptions.filter((s) => s.confidence === 'low').length;

    const enrichedResult: AnalysisResult = {
      ...analysisResult,
      subscriptions: finalSubscriptions,
      summary: {
        ...analysisResult.summary,
        highConfidenceCount: highCount,
        mediumConfidenceCount: mediumCount,
        lowConfidenceCount: lowCount,
      },
      metadata: {
        ...analysisResult.metadata,
        filesProcessed: successfulParses.length,
        bankFormatsDetected: [...new Set(banksDetected)],
      },
      warnings: resultWarnings.length > 0 ? resultWarnings : undefined,
      info: resultInfo.length > 0 ? resultInfo : undefined,
    };

    // SEGURANÇA: Limpa referências aos dados originais
    // O garbage collector vai cuidar do resto
    files.forEach((f) => {
      (f as { content: Buffer | null }).content = null;
    });

    return {
      success: true,
      result: enrichedResult,
      errors: allErrors,
      warnings: allWarnings,
    };
  } catch (error) {
    // SEGURANÇA: Não expõe detalhes internos do erro
    console.error('[AnalysisService] Erro interno:', error);

    return {
      success: false,
      errors: ['Erro interno ao processar os arquivos. Tente novamente.'],
      warnings: allWarnings,
    };
  }
}
