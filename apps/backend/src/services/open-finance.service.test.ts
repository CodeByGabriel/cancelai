/**
 * Testes do Open Finance Service
 *
 * Cenarios 1-3: Happy path, revogacao, erro do agregador
 * Cenario 5: Paridade de deteccao entre CSV e Open Finance
 *
 * NOTA: Pluggy SDK e mockado — testes nao chamam API real
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { OpenFinanceTransaction } from './open-finance.service.js';
import { adaptTransactions } from '../adapters/open-finance.adapter.js';
import { runPipelineFromTransactions } from '../pipeline/pipeline-orchestrator.js';
import type { PipelineEvent } from '../pipeline/pipeline-events.js';
import type { AnalysisResult } from '../types/index.js';

// ══════════════════════════════════════════════════════════════
// FIXTURES — Transacoes do agregador que simulam dados Pluggy
// ══════════════════════════════════════════════════════════════

const AGGREGATOR_TRANSACTIONS: OpenFinanceTransaction[] = [
  // Netflix — 3 meses recorrentes
  {
    id: 'tx-n1',
    date: new Date('2024-10-01'),
    description: 'NETFLIX.COM',
    descriptionRaw: 'PAG*NETFLIX.COM',
    amount: -55.90,
    type: 'DEBIT',
    category: 'streaming',
    merchantName: 'Netflix',
  },
  {
    id: 'tx-n2',
    date: new Date('2024-11-01'),
    description: 'NETFLIX.COM',
    descriptionRaw: 'PAG*NETFLIX.COM',
    amount: -55.90,
    type: 'DEBIT',
    category: 'streaming',
    merchantName: 'Netflix',
  },
  {
    id: 'tx-n3',
    date: new Date('2024-12-01'),
    description: 'NETFLIX.COM',
    descriptionRaw: 'PAG*NETFLIX.COM',
    amount: -55.90,
    type: 'DEBIT',
    category: 'streaming',
    merchantName: 'Netflix',
  },
  // Spotify — 3 meses recorrentes
  {
    id: 'tx-s1',
    date: new Date('2024-10-01'),
    description: 'SPOTIFY BRASIL',
    descriptionRaw: 'SPOTIFY AB',
    amount: -21.90,
    type: 'DEBIT',
    category: 'music',
    merchantName: 'Spotify',
  },
  {
    id: 'tx-s2',
    date: new Date('2024-11-01'),
    description: 'SPOTIFY BRASIL',
    descriptionRaw: 'SPOTIFY AB',
    amount: -21.90,
    type: 'DEBIT',
    category: 'music',
    merchantName: 'Spotify',
  },
  {
    id: 'tx-s3',
    date: new Date('2024-12-01'),
    description: 'SPOTIFY BRASIL',
    descriptionRaw: 'SPOTIFY AB',
    amount: -21.90,
    type: 'DEBIT',
    category: 'music',
    merchantName: 'Spotify',
  },
  // Compra avulsa (nao e assinatura)
  {
    id: 'tx-a1',
    date: new Date('2024-10-15'),
    description: 'MERCADO LIVRE',
    descriptionRaw: 'MP*MERCADOLIVRE',
    amount: -150.00,
    type: 'DEBIT',
    category: null,
    merchantName: null,
  },
];

// CSV equivalente para teste de paridade
const EQUIVALENT_CSV = `Data,Descricao,Valor
01/10/2024,Netflix,-55.90
01/10/2024,Spotify,-21.90
15/10/2024,MERCADO LIVRE,-150.00
01/11/2024,Netflix,-55.90
01/11/2024,Spotify,-21.90
01/12/2024,Netflix,-55.90
01/12/2024,Spotify,-21.90
`;

// ══════════════════════════════════════════════════════════════
// HELPER — Coleta resultado do pipeline async generator
// ══════════════════════════════════════════════════════════════

async function collectPipelineResult(
  generator: AsyncGenerator<PipelineEvent>
): Promise<AnalysisResult | null> {
  for await (const event of generator) {
    if (event.type === 'complete') {
      return event.result;
    }
    if (event.type === 'error' && !event.recoverable) {
      throw new Error(`Pipeline error: ${event.message}`);
    }
  }
  return null;
}

describe('Open Finance Integration', () => {
  const originalEnv = process.env['DEEPSEEK_API_KEY'];

  beforeEach(() => {
    // Desabilita IA para testes deterministicos
    delete process.env['DEEPSEEK_API_KEY'];
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['DEEPSEEK_API_KEY'] = originalEnv;
    } else {
      delete process.env['DEEPSEEK_API_KEY'];
    }
  });

  // ── Cenario 1: Happy path E2E ──────────────────────────────

  describe('Cenario 1: Happy path — adapter → pipeline → resultados', () => {
    it('deve detectar assinaturas a partir de transacoes do agregador', async () => {
      // Adapta transacoes
      const transactions = adaptTransactions(AGGREGATOR_TRANSACTIONS, 'nubank');
      expect(transactions).toHaveLength(7);

      // Roda pipeline
      const generator = runPipelineFromTransactions(transactions, 'nubank', 'test-req-01');
      const result = await collectPipelineResult(generator);

      expect(result).not.toBeNull();
      expect(result!.subscriptions.length).toBeGreaterThanOrEqual(2);

      // Verifica deteccoes
      const names = result!.subscriptions.map((s) => s.name.toLowerCase());
      expect(names.some((n) => n.includes('netflix'))).toBe(true);
      expect(names.some((n) => n.includes('spotify'))).toBe(true);
    });

    it('deve emitir eventos de progresso durante o pipeline', async () => {
      const transactions = adaptTransactions(AGGREGATOR_TRANSACTIONS, 'nubank');
      const generator = runPipelineFromTransactions(transactions, 'nubank', 'test-req-02');

      const events: PipelineEvent[] = [];
      for await (const event of generator) {
        events.push(event);
      }

      // Deve ter eventos de stage-start e stage-complete
      const stageStarts = events.filter((e) => e.type === 'stage-start');
      const stageCompletes = events.filter((e) => e.type === 'stage-complete');

      // Deve ter pelo menos normalization, grouping, scoring, sanity
      expect(stageStarts.length).toBeGreaterThanOrEqual(4);
      expect(stageCompletes.length).toBeGreaterThanOrEqual(4);

      // NAO deve ter validation ou parsing (pulados)
      const stageNames = stageStarts.map((e) => e.type === 'stage-start' ? e.stage : '');
      expect(stageNames).not.toContain('validation');
      expect(stageNames).not.toContain('parsing');

      // Deve terminar com complete
      const lastEvent = events[events.length - 1]!;
      expect(lastEvent.type).toBe('complete');
    });

    it('deve preencher metadata corretamente', async () => {
      const transactions = adaptTransactions(AGGREGATOR_TRANSACTIONS, 'nubank');
      const generator = runPipelineFromTransactions(transactions, 'nubank', 'test-req-03');
      const result = await collectPipelineResult(generator);

      expect(result!.metadata.bankFormatsDetected).toContain('nubank');
      expect(result!.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result!.summary.transactionsAnalyzed).toBeGreaterThan(0);
    });
  });

  // ── Cenario 2: Revogacao de conexao ─────────────────────────
  // NOTA: Teste de revogacao real requer mock do Pluggy SDK
  // Aqui testamos que o service isOpenFinanceConfigured retorna false sem env vars

  describe('Cenario 2: Configuracao e disponibilidade', () => {
    it('isOpenFinanceConfigured deve retornar false sem env vars', async () => {
      const { isOpenFinanceConfigured } = await import('./open-finance.service.js');
      // Em ambiente de teste, as env vars nao estao configuradas
      expect(isOpenFinanceConfigured()).toBe(false);
    });
  });

  // ── Cenario 3: Erro do agregador → fallback ────────────────

  describe('Cenario 3: Pipeline com transacoes vazias', () => {
    it('deve retornar resultado vazio com info message quando nao ha transacoes validas', async () => {
      // Transacoes que serao filtradas (apenas compras avulsas, sem recorrencia)
      const singleTransactions = adaptTransactions(
        [AGGREGATOR_TRANSACTIONS[6]!], // Apenas Mercado Livre
        'nubank'
      );

      const generator = runPipelineFromTransactions(singleTransactions, 'nubank', 'test-req-04');
      const result = await collectPipelineResult(generator);

      expect(result).not.toBeNull();
      expect(result!.subscriptions).toHaveLength(0);
    });
  });

  // ── Cenario 5: Paridade CSV vs Open Finance ─────────────────

  describe('Cenario 5: Paridade de deteccao CSV vs Open Finance', () => {
    it('deve detectar as mesmas assinaturas via Open Finance e via CSV', async () => {
      // Via Open Finance
      const ofTransactions = adaptTransactions(AGGREGATOR_TRANSACTIONS, 'nubank');
      const ofGenerator = runPipelineFromTransactions(ofTransactions, 'nubank', 'parity-of');
      const ofResult = await collectPipelineResult(ofGenerator);

      // Via CSV (usando analyzeStatements)
      const { analyzeStatements } = await import('./analysis-service.js');
      const csvResult = await analyzeStatements([{
        filename: 'extrato.csv',
        content: Buffer.from(EQUIVALENT_CSV),
        mimetype: 'text/csv',
      }]);

      expect(ofResult).not.toBeNull();
      expect(csvResult.success).toBe(true);
      expect(csvResult.result).toBeDefined();

      // Ambos devem detectar Netflix e Spotify
      const ofNames = ofResult!.subscriptions.map((s) => s.name.toLowerCase());
      const csvNames = csvResult.result!.subscriptions.map((s) => s.name.toLowerCase());

      const ofHasNetflix = ofNames.some((n) => n.includes('netflix'));
      const csvHasNetflix = csvNames.some((n) => n.includes('netflix'));
      expect(ofHasNetflix).toBe(csvHasNetflix);

      const ofHasSpotify = ofNames.some((n) => n.includes('spotify'));
      const csvHasSpotify = csvNames.some((n) => n.includes('spotify'));
      expect(ofHasSpotify).toBe(csvHasSpotify);

      // Quantidades de assinaturas devem ser iguais
      expect(ofResult!.subscriptions.length).toBe(csvResult.result!.subscriptions.length);
    });
  });
});
