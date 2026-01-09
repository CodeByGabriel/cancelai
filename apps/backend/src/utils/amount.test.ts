/**
 * Testes dos utilitários de valores monetários
 */

import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  isDebit,
  isWithinTolerance,
  calculateAverage,
  roundToTwo,
} from './amount.js';

describe('parseAmount', () => {
  it('deve parsear formato brasileiro com vírgula', () => {
    expect(parseAmount('29,90')).toBe(29.9);
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });

  it('deve parsear formato americano', () => {
    expect(parseAmount('29.90')).toBe(29.9);
    expect(parseAmount('1234.56')).toBe(1234.56);
  });

  it('deve remover símbolo de moeda', () => {
    expect(parseAmount('R$ 29,90')).toBe(29.9);
    expect(parseAmount('R$29,90')).toBe(29.9);
  });

  it('deve retornar valor positivo para negativos', () => {
    expect(parseAmount('-29,90')).toBe(29.9);
    expect(parseAmount('(29,90)')).toBe(29.9);
  });

  it('deve retornar null para valor inválido', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('isDebit', () => {
  it('deve identificar débito por sinal negativo', () => {
    expect(isDebit('-29,90')).toBe(true);
    expect(isDebit('(29,90)')).toBe(true);
  });

  it('deve identificar por coluna de tipo', () => {
    expect(isDebit('29,90', 'D')).toBe(true);
    expect(isDebit('29,90', 'DEBITO')).toBe(true);
    expect(isDebit('29,90', 'Saída')).toBe(true);
  });

  it('deve identificar crédito', () => {
    expect(isDebit('29,90', 'C')).toBe(false);
    expect(isDebit('29,90', 'CREDITO')).toBe(false);
  });
});

describe('isWithinTolerance', () => {
  it('deve retornar true dentro da tolerância', () => {
    expect(isWithinTolerance(29.9, 30.9, 0.15)).toBe(true); // ~3% diferença
    expect(isWithinTolerance(100, 110, 0.15)).toBe(true); // 10% diferença
  });

  it('deve retornar false fora da tolerância', () => {
    expect(isWithinTolerance(29.9, 50, 0.15)).toBe(false);
  });

  it('deve tratar valores iguais', () => {
    expect(isWithinTolerance(29.9, 29.9, 0.15)).toBe(true);
  });

  it('deve tratar zeros', () => {
    expect(isWithinTolerance(0, 0, 0.15)).toBe(true);
    expect(isWithinTolerance(0, 10, 0.15)).toBe(false);
  });
});

describe('calculateAverage', () => {
  it('deve calcular média corretamente', () => {
    expect(calculateAverage([10, 20, 30])).toBe(20);
    expect(calculateAverage([29.9, 30.1])).toBeCloseTo(30, 1);
  });

  it('deve retornar 0 para array vazio', () => {
    expect(calculateAverage([])).toBe(0);
  });
});

describe('roundToTwo', () => {
  it('deve arredondar para 2 casas decimais', () => {
    expect(roundToTwo(29.999)).toBe(30);
    expect(roundToTwo(29.994)).toBe(29.99);
    expect(roundToTwo(29.995)).toBe(30);
  });
});
