/**
 * Servico de Analise de Extratos
 *
 * Facade que orquestra o pipeline de processamento.
 * Mantem a mesma interface publica (analyzeStatements) para backward compat.
 *
 * SEGURANCA: Todos os dados sao processados em memoria e descartados.
 */

import type { AnalysisResult } from '../types/index.js';
import type { FileToProcess } from '../parsers/index.js';
import { runPipeline } from '../pipeline/index.js';

/**
 * Resultado do servico de analise
 */
export interface AnalysisServiceResult {
  readonly success: boolean;
  readonly result?: AnalysisResult | undefined;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Analisa arquivos de extrato e retorna assinaturas detectadas.
 *
 * Internamente usa o pipeline de async generators,
 * mas retorna o resultado como um unico objeto (request-response).
 *
 * @param files - Arquivos de extrato (PDF ou CSV)
 * @returns Resultado da analise com assinaturas detectadas
 */
export async function analyzeStatements(
  files: FileToProcess[]
): Promise<AnalysisServiceResult> {
  const requestId = `svc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  let result: AnalysisResult | undefined;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    for await (const event of runPipeline(files, requestId)) {
      switch (event.type) {
        case 'complete':
          result = event.result;
          if (event.result.warnings) {
            warnings.push(...event.result.warnings);
          }
          break;
        case 'error':
          errors.push(event.message);
          break;
        case 'file-error':
          errors.push(event.error);
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.error('[AnalysisService] Erro interno:', error);
    errors.push('Erro interno ao processar os arquivos. Tente novamente.');
  }

  if (!result && errors.length === 0) {
    errors.push('Erro interno ao processar os arquivos. Tente novamente.');
  }

  return {
    success: !!result,
    ...(result && { result }),
    errors,
    warnings,
  };
}
