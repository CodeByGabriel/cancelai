/**
 * Testes dos utilitários de string
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDescription,
  extractServiceName,
  calculateSimilarity,
  capitalizeServiceName,
} from './string.js';

describe('normalizeDescription', () => {
  it('deve converter para minúsculas', () => {
    expect(normalizeDescription('NETFLIX')).toBe('netflix');
  });

  it('deve remover códigos de autorização', () => {
    expect(normalizeDescription('NETFLIX 12345678')).toBe('netflix');
  });

  it('deve remover datas', () => {
    expect(normalizeDescription('NETFLIX 15/03/2024')).toBe('netflix');
  });

  it('deve remover prefixos comuns', () => {
    expect(normalizeDescription('PAG*NETFLIX')).toBe('netflix');
    expect(normalizeDescription('COMPRA NETFLIX')).toBe('netflix');
  });

  it('deve normalizar espaços', () => {
    expect(normalizeDescription('NETFLIX   COM')).toBe('netflix com');
  });
});

describe('extractServiceName', () => {
  it('deve extrair nome do serviço', () => {
    expect(extractServiceName('NETFLIX.COM')).toBe('netflix com');
  });

  it('deve pegar primeiras palavras significativas', () => {
    expect(extractServiceName('SMART FIT MENSALIDADE JANEIRO')).toContain('smart');
  });
});

describe('calculateSimilarity', () => {
  it('deve retornar 1 para strings idênticas', () => {
    expect(calculateSimilarity('netflix', 'netflix')).toBe(1);
  });

  it('deve retornar 1 para strings idênticas após normalização', () => {
    expect(calculateSimilarity('NETFLIX', 'netflix')).toBe(1);
  });

  it('deve retornar valor alto para strings similares', () => {
    const similarity = calculateSimilarity('NETFLIX.COM', 'NETFLIX COM');
    expect(similarity).toBeGreaterThan(0.8);
  });

  it('deve retornar valor baixo para strings diferentes', () => {
    const similarity = calculateSimilarity('NETFLIX', 'SPOTIFY');
    expect(similarity).toBeLessThan(0.5);
  });
});

describe('capitalizeServiceName', () => {
  it('deve capitalizar serviços conhecidos corretamente', () => {
    expect(capitalizeServiceName('netflix')).toBe('Netflix');
    expect(capitalizeServiceName('spotify')).toBe('Spotify');
    expect(capitalizeServiceName('youtube music')).toBe('YouTube Music');
    expect(capitalizeServiceName('ifood')).toBe('iFood');
  });

  it('deve capitalizar serviços desconhecidos', () => {
    expect(capitalizeServiceName('servico qualquer')).toBe('Servico Qualquer');
  });
});
