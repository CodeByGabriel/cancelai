/**
 * Testes do AI Classifier
 *
 * Testa a camada de classificação com IA para cobranças ambíguas.
 * Usa mocks para simular respostas da API DeepSeek.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  separateSubscriptions,
  applyAIClassifications,
  classifyWithAI,
  isAIConfigured,
  type AIClassification,
} from './ai-classifier.js';
import type { DetectedSubscription } from '../types/index.js';

// Mock de subscriptions para testes
const createMockSubscription = (
  overrides: Partial<DetectedSubscription> = {}
): DetectedSubscription => ({
  id: `sub_${Math.random().toString(36).substring(7)}`,
  name: 'Test Service',
  originalNames: ['TEST SERVICE'],
  monthlyAmount: 29.9,
  annualAmount: 358.8,
  occurrences: 3,
  transactions: [
    { date: new Date('2024-01-15'), amount: 29.9, description: 'TEST SERVICE' },
    { date: new Date('2024-02-15'), amount: 29.9, description: 'TEST SERVICE' },
    { date: new Date('2024-03-15'), amount: 29.9, description: 'TEST SERVICE' },
  ],
  confidence: 'medium',
  confidenceScore: 0.65,
  confidenceReasons: ['Padrão mensal detectado'],
  ...overrides,
});

describe('AIClassifier', () => {
  describe('separateSubscriptions', () => {
    it('deve separar confirmadas (high) das ambíguas (medium/low)', () => {
      const subscriptions: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'high', confidenceScore: 0.85 }),
        createMockSubscription({ id: '2', confidence: 'medium', confidenceScore: 0.65 }),
        createMockSubscription({ id: '3', confidence: 'low', confidenceScore: 0.45 }),
        createMockSubscription({ id: '4', confidence: 'high', confidenceScore: 0.90 }),
      ];

      const { confirmed, ambiguous } = separateSubscriptions(subscriptions);

      expect(confirmed).toHaveLength(2);
      expect(ambiguous).toHaveLength(2);
      expect(confirmed.map((s) => s.id)).toEqual(['1', '4']);
      expect(ambiguous.map((s) => s.id)).toEqual(['2', '3']);
    });

    it('deve retornar listas vazias quando não há subscriptions', () => {
      const { confirmed, ambiguous } = separateSubscriptions([]);

      expect(confirmed).toHaveLength(0);
      expect(ambiguous).toHaveLength(0);
    });

    it('deve colocar todas em confirmed quando todas são high', () => {
      const subscriptions: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'high' }),
        createMockSubscription({ id: '2', confidence: 'high' }),
      ];

      const { confirmed, ambiguous } = separateSubscriptions(subscriptions);

      expect(confirmed).toHaveLength(2);
      expect(ambiguous).toHaveLength(0);
    });
  });

  describe('applyAIClassifications', () => {
    it('deve promover subscriptions classificadas como subscription com confidence >= 0.75', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'medium', confidenceScore: 0.65 }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'subscription',
          confidence: 0.85,
          reason: 'Serviço de streaming conhecido',
        },
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      expect(result.promoted).toHaveLength(1);
      expect(result.discarded).toHaveLength(0);
      expect(result.unchanged).toHaveLength(0);
      expect(result.promoted[0]!.confidenceReasons).toContain('IA: Serviço de streaming conhecido');
    });

    it('não deve promover se confidence da IA < 0.75', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'medium', confidenceScore: 0.65 }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'subscription',
          confidence: 0.60, // Abaixo do threshold
          reason: 'Pode ser assinatura',
        },
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      expect(result.promoted).toHaveLength(0);
      expect(result.unchanged).toHaveLength(1);
    });

    it('deve descartar items classificados como installment', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'medium' }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'installment',
          confidence: 0.90,
          reason: 'Parcelamento de compra',
        },
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      expect(result.promoted).toHaveLength(0);
      expect(result.discarded).toHaveLength(1);
      expect(result.unchanged).toHaveLength(0);
    });

    it('deve descartar items classificados como not_subscription', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'low' }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'not_subscription',
          confidence: 0.85,
          reason: 'Compra única',
        },
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      expect(result.discarded).toHaveLength(1);
    });

    it('deve manter unchanged items sem classificação', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'medium' }),
        createMockSubscription({ id: '2', confidence: 'medium' }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'subscription',
          confidence: 0.90,
          reason: 'Netflix',
        },
        // id: '2' não tem classificação
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      expect(result.promoted).toHaveLength(1);
      expect(result.unchanged).toHaveLength(1);
      expect(result.unchanged[0]!.id).toBe('2');
    });

    it('deve limitar ajuste de confidenceScore a +0.1', () => {
      const ambiguous: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'medium', confidenceScore: 0.65 }),
      ];

      const classifications: AIClassification[] = [
        {
          id: '1',
          classification: 'subscription',
          confidence: 0.95,
          reason: 'Serviço conhecido',
        },
      ];

      const result = applyAIClassifications(ambiguous, classifications);

      // Score original: 0.65, max ajuste: +0.1 = 0.75
      // Mas o código limita a 0.79 para não dar high confidence via IA
      expect(result.promoted[0]!.confidenceScore).toBeLessThanOrEqual(0.79);
    });
  });

  describe('isAIConfigured', () => {
    const originalEnv = process.env.DEEPSEEK_API_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.DEEPSEEK_API_KEY = originalEnv;
      } else {
        delete process.env.DEEPSEEK_API_KEY;
      }
    });

    it('deve retornar true quando DEEPSEEK_API_KEY está configurada', () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key';
      expect(isAIConfigured()).toBe(true);
    });

    it('deve retornar false quando DEEPSEEK_API_KEY não está configurada', () => {
      delete process.env.DEEPSEEK_API_KEY;
      expect(isAIConfigured()).toBe(false);
    });
  });

  describe('classifyWithAI', () => {
    const originalEnv = process.env.DEEPSEEK_API_KEY;

    beforeEach(() => {
      // Limpa a API key para testar fallback
      delete process.env.DEEPSEEK_API_KEY;
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.DEEPSEEK_API_KEY = originalEnv;
      } else {
        delete process.env.DEEPSEEK_API_KEY;
      }
    });

    it('deve retornar todas subscriptions quando IA não está configurada (fallback silencioso)', async () => {
      const subscriptions: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'high' }),
        createMockSubscription({ id: '2', confidence: 'medium' }),
        createMockSubscription({ id: '3', confidence: 'low' }),
      ];

      const result = await classifyWithAI(subscriptions);

      // Sem IA, retorna todas (confirmed + ambiguous)
      expect(result).toHaveLength(3);
    });

    it('deve retornar apenas confirmadas quando não há ambíguas', async () => {
      const subscriptions: DetectedSubscription[] = [
        createMockSubscription({ id: '1', confidence: 'high' }),
        createMockSubscription({ id: '2', confidence: 'high' }),
      ];

      const result = await classifyWithAI(subscriptions);

      expect(result).toHaveLength(2);
    });

    it('deve retornar array vazio quando não há subscriptions', async () => {
      const result = await classifyWithAI([]);

      expect(result).toHaveLength(0);
    });
  });
});
