/**
 * Normalization Stage
 *
 * Filtra transacoes invalidas: totais de fatura, PIX, transferencias.
 * Parcelas sao separadas em context.installments (nao descartadas).
 * Mantem apenas debitos que podem ser assinaturas recorrentes.
 *
 * Extraido de subscription-detector.ts linhas 107-188.
 */

import type { Transaction, DetectedInstallment } from '../../types/index.js';
import type { PipelineContext, PipelineEvent, PipelineStage } from '../pipeline-events.js';

// ═══════════════════════════════════════════════════════════════
// PATTERNS — extraidos de subscription-detector.ts
// ═══════════════════════════════════════════════════════════════

const AGGREGATE_PATTERNS = [
  /\bTOTAL\b/i,
  /\bFATURA\b/i,
  /\bVALOR\s*TOTAL\b/i,
  /\bTOTAL\s*GERAL\b/i,
  /\bVALOR\s*FINANCIADO\b/i,
  /\bSALDO\b/i,
  /\bSUBTOTAL\b/i,
  /\bTOTAL\s*A\s*PAGAR\b/i,
  /\bVALOR\s*DA\s*FATURA\b/i,
  /\bPAGAMENTO\s*FATURA\b/i,
  /\bPAGAMENTO\s*MINIMO\b/i,
];

const INSTALLMENT_PATTERNS = [
  /\bPARC\s*\d+\s*[/\\]\s*\d+/i,
  /\bPARCEL\w*\s*\d+\s*[/\\]\s*\d+/i,
  /\bPARCELA\b/i,
  /\bPARCELADO\b/i,
  /\b\d+\s*[/\\]\s*\d+\s*(PARC|X)\b/i,
  /\b\d+\s*DE\s*\d+\b/i,
];

const INSTALLMENT_EXTRACT_REGEX =
  /(?:PARC(?:ELA)?\s*)?(\d+)\s*[/\\]\s*(\d+)|(\d+)\s*DE\s*(\d+)/i;

const TRANSFER_PATTERNS = [
  /\bPIX\b/i,
  /\bTRANSFER[EÊ]NCIA\b/i,
  /\bTED\b/i,
  /\bDOC\b/i,
  /\bTRANSF\b/i,
  /\bDEP[OÓ]SITO\b/i,
  /\bSAQUE\b/i,
  /\bRESGATE\b/i,
];

// ═══════════════════════════════════════════════════════════════
// FUNCOES DE FILTRO — exportadas para reuso (ex: sanity-stage)
// ═══════════════════════════════════════════════════════════════

export function isAggregateValue(description: string): boolean {
  return AGGREGATE_PATTERNS.some((pattern) => pattern.test(description));
}

export function isInstallment(description: string): boolean {
  return INSTALLMENT_PATTERNS.some((pattern) => pattern.test(description));
}

export function isTransferOrPix(description: string): boolean {
  return TRANSFER_PATTERNS.some((pattern) => pattern.test(description));
}

/**
 * Extrai informacao de parcela (current/total) da descricao.
 * Ex: "PARC 3/12" → { current: 3, total: 12 }
 */
function extractInstallmentInfo(
  description: string,
): { current: number; total: number } | undefined {
  const match = INSTALLMENT_EXTRACT_REGEX.exec(description);
  if (!match) return undefined;

  const current = parseInt(match[1] ?? match[3] ?? '0', 10);
  const total = parseInt(match[2] ?? match[4] ?? '0', 10);

  if (current > 0 && total > 0 && current <= total) {
    return { current, total };
  }
  return undefined;
}

/**
 * Converte Transaction em DetectedInstallment
 */
function toInstallment(t: Transaction): DetectedInstallment {
  const info = extractInstallmentInfo(t.description);
  return {
    description: t.description,
    originalDescription: t.originalDescription,
    amount: t.amount,
    date: t.date,
    ...(info && { installmentInfo: info }),
  };
}

// ═══════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════

export class NormalizationStage implements PipelineStage {
  readonly name = 'normalization';

  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    // Filtra apenas debitos
    const debits = context.transactions.filter((t) => t.type === 'debit');

    const valid: Transaction[] = [];
    let installmentCount = 0;

    for (const t of debits) {
      const desc = t.description;

      // Descarta aggregates e transfers
      if (isAggregateValue(desc)) continue;
      if (isTransferOrPix(desc)) continue;

      // Parcelas → separa em context.installments
      if (isInstallment(desc)) {
        context.installments.push(toInstallment(t));
        installmentCount++;
        continue;
      }

      valid.push(t);
    }

    context.validTransactions = valid;

    const filtered = context.transactions.length - valid.length;

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: {
        total: context.transactions.length,
        debits: debits.length,
        filtered,
        installments: installmentCount,
        remaining: valid.length,
      },
    };
  }
}
