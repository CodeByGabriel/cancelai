/**
 * Parsing Stage
 *
 * Processa cada arquivo individualmente com try/catch isolado.
 * Um arquivo falhando NAO bloqueia os outros.
 *
 * Delega para o registry de bank parsers (plugin system).
 */

import type { Transaction } from '../../types/index.js';
import type { PipelineContext, PipelineEvent, PipelineStage } from '../pipeline-events.js';
import { registry } from '../../parsers/registry/index.js';
import '../../parsers/banks/index.js';

/**
 * Remove transacoes duplicadas entre arquivos
 */
function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();

  for (const transaction of transactions) {
    const dateStr = transaction.date.toISOString().split('T')[0];
    const amountStr = transaction.amount.toFixed(2);
    const descNorm = transaction.description
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    const key = `${dateStr}|${amountStr}|${descNorm}`;

    const existing = seen.get(key);
    if (existing) {
      if (transaction.description.length > existing.description.length) {
        seen.set(key, transaction);
      }
    } else {
      seen.set(key, transaction);
    }
  }

  return Array.from(seen.values());
}

// ═══════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════

export class ParsingStage implements PipelineStage {
  readonly name = 'parsing';

  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    const allTransactions: Transaction[] = [];

    for (let i = 0; i < context.files.length; i++) {
      const file = context.files[i]!;

      yield {
        type: 'progress',
        stage: this.name,
        current: i + 1,
        total: context.files.length,
        message: `Processando ${file.filename}`,
      };

      try {
        const result = await registry.parseFile(file);
        context.parseResults.push(result);

        if (result.success) {
          allTransactions.push(...result.transactions);
          context.banksDetected.push(result.bankDetected);

          yield {
            type: 'file-partial',
            filename: file.filename,
            transactionCount: result.transactions.length,
            bankDetected: result.bankDetected,
          };
        } else {
          context.errors.push(...result.errors);

          yield {
            type: 'file-error',
            filename: file.filename,
            error: result.errors.join('; '),
          };
        }

        context.warnings.push(...result.warnings);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        context.errors.push(`Erro ao processar ${file.filename}: ${errorMessage}`);

        yield {
          type: 'file-error',
          filename: file.filename,
          error: errorMessage,
        };
      }
    }

    // Deduplicacao
    context.transactions = deduplicateTransactions(allTransactions);

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: {
        filesProcessed: context.files.length,
        successfulParses: context.parseResults.filter((r) => r.success).length,
        totalTransactions: context.transactions.length,
        banksDetected: [...new Set(context.banksDetected)].join(', '),
      },
    };
  }
}
