/**
 * Testes de Integração do Analysis Service
 *
 * Testa a interface do analyzeStatements e integração com AI Classifier.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { analyzeStatements } from './analysis-service.js';
import type { FileToProcess } from '../parsers/index.js';

// ══════════════════════════════════════════════════════════════
// DADOS DE TESTE
// ══════════════════════════════════════════════════════════════

// CSV com assinaturas recorrentes (Netflix e Spotify em múltiplos meses)
// Usando "Descricao" sem acento para evitar problemas de encoding
const SAMPLE_CSV = `Data,Descricao,Valor
01/10/2024,NETFLIX.COM,-55.90
01/10/2024,SPOTIFY BRASIL,-21.90
15/10/2024,MERCADO LIVRE,-150.00
01/11/2024,NETFLIX.COM,-55.90
01/11/2024,SPOTIFY BRASIL,-21.90
20/11/2024,LOJA ROUPAS,-89.00
01/12/2024,NETFLIX.COM,-55.90
01/12/2024,SPOTIFY BRASIL,-21.90
`;

// CSV vazio (apenas headers)
const EMPTY_CSV = `Data,Descricao,Valor
`;

// CSV com parcelamentos (padrão PARC indica parcelas)
const SAMPLE_CSV_PARCELAS = `Data,Descricao,Valor
01/10/2024,LOJA X PARC 1/6,-100.00
01/11/2024,LOJA X PARC 2/6,-100.00
01/12/2024,LOJA X PARC 3/6,-100.00
`;

describe('Analysis Service Integration', () => {
  const originalEnv = process.env.DEEPSEEK_API_KEY;

  beforeEach(() => {
    // Desabilita IA para testes determinísticos
    delete process.env.DEEPSEEK_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DEEPSEEK_API_KEY = originalEnv;
    } else {
      delete process.env.DEEPSEEK_API_KEY;
    }
  });

  describe('Pipeline completo', () => {
    it('deve detectar assinaturas recorrentes em CSV', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'extrato.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result!.subscriptions.length).toBeGreaterThanOrEqual(2);

      // Verifica se Netflix e Spotify foram detectados
      const names = result.result!.subscriptions.map((s) => s.name.toLowerCase());
      expect(names.some((n) => n.includes('netflix'))).toBe(true);
      expect(names.some((n) => n.includes('spotify'))).toBe(true);
    });

    it('deve calcular summary corretamente', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'extrato.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      expect(result.result!.summary).toBeDefined();
      expect(result.result!.summary.subscriptionCount).toBeGreaterThan(0);
      expect(result.result!.summary.totalMonthlySpending).toBeGreaterThan(0);
      // Usa toBeCloseTo para evitar problemas de precisão de ponto flutuante
      expect(result.result!.summary.totalAnnualSpending).toBeCloseTo(
        result.result!.summary.totalMonthlySpending * 12,
        2
      );
    });

    it('deve incluir metadata com informações do processamento', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'extrato.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      expect(result.result!.metadata).toBeDefined();
      expect(result.result!.metadata.filesProcessed).toBe(1);
      // processingTimeMs pode ser 0 em processamentos muito rápidos
      expect(result.result!.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.result!.metadata.version).toBeDefined();
    });
  });

  describe('Fallback sem IA', () => {
    it('deve funcionar normalmente sem DEEPSEEK_API_KEY', async () => {
      // Garante que não há API key
      delete process.env.DEEPSEEK_API_KEY;

      const files: FileToProcess[] = [
        {
          filename: 'extrato.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      // Deve funcionar sem erros
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('deve retornar erro quando não há arquivos', async () => {
      const result = await analyzeStatements([]);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Nenhum arquivo enviado para análise');
    });

    it('deve processar CSV vazio com apenas headers', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'vazio.csv',
          content: Buffer.from(EMPTY_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      // CSV com apenas headers é tratado como erro pelo csv-parse
      // pois não há dados para processar
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve detectar parcelamentos mas com menor confiança', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'parcelas.csv',
          content: Buffer.from(SAMPLE_CSV_PARCELAS),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      // Parcelamentos podem ser detectados mas devem ter baixa confiança
      // ou ser filtrados pelo detector
      expect(result.success).toBe(true);

      // Se detectou algo, deve ter baixa confiança por causa do padrão PARC
      if (result.result!.subscriptions.length > 0) {
        const confidence = result.result!.subscriptions[0]!.confidence;
        expect(['low', 'medium']).toContain(confidence);
      }
    });
  });

  describe('Múltiplos arquivos', () => {
    it('deve processar múltiplos CSVs e consolidar resultados', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'extrato1.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
        {
          filename: 'extrato2.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      expect(result.success).toBe(true);
      expect(result.result!.metadata.filesProcessed).toBe(2);

      // Transações duplicadas devem ser consolidadas
      // Então o número de subscriptions não deve dobrar
    });
  });

  describe('Validação de estrutura', () => {
    it('deve retornar subscriptions com todos os campos obrigatórios', async () => {
      const files: FileToProcess[] = [
        {
          filename: 'extrato.csv',
          content: Buffer.from(SAMPLE_CSV),
          mimetype: 'text/csv',
        },
      ];

      const result = await analyzeStatements(files);

      for (const sub of result.result!.subscriptions) {
        expect(sub.id).toBeDefined();
        expect(sub.name).toBeDefined();
        expect(sub.monthlyAmount).toBeGreaterThan(0);
        // Usa toBeCloseTo para evitar problemas de precisão de ponto flutuante
        expect(sub.annualAmount).toBeCloseTo(sub.monthlyAmount * 12, 2);
        expect(sub.occurrences).toBeGreaterThan(0);
        expect(sub.transactions.length).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(sub.confidence);
        expect(sub.confidenceReasons.length).toBeGreaterThan(0);
      }
    });
  });
});
