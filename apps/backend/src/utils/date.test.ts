/**
 * Testes dos utilitários de data
 */

import { describe, it, expect } from 'vitest';
import {
  parseDate,
  daysBetween,
  isSameDayOfMonth,
  isMonthlyPattern,
} from './date.js';

describe('parseDate', () => {
  it('deve parsear formato brasileiro DD/MM/YYYY', () => {
    const date = parseDate('15/03/2024');
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(15);
    expect(date!.getMonth()).toBe(2); // Março = 2
    expect(date!.getFullYear()).toBe(2024);
  });

  it('deve parsear formato brasileiro DD/MM/YY', () => {
    const date = parseDate('15/03/24');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
  });

  it('deve parsear formato ISO YYYY-MM-DD', () => {
    const date = parseDate('2024-03-15');
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(15);
  });

  it('deve retornar null para data inválida', () => {
    expect(parseDate('invalid')).toBeNull();
    expect(parseDate('')).toBeNull();
  });
});

describe('daysBetween', () => {
  it('deve calcular diferença de dias corretamente', () => {
    const date1 = new Date(2024, 2, 1); // 1 de março
    const date2 = new Date(2024, 2, 15); // 15 de março
    expect(daysBetween(date1, date2)).toBe(14);
  });

  it('deve funcionar independente da ordem', () => {
    const date1 = new Date(2024, 2, 15);
    const date2 = new Date(2024, 2, 1);
    expect(daysBetween(date1, date2)).toBe(14);
  });
});

describe('isSameDayOfMonth', () => {
  it('deve retornar true para mesmo dia', () => {
    const date1 = new Date(2024, 2, 15);
    const date2 = new Date(2024, 3, 15);
    expect(isSameDayOfMonth(date1, date2, 3)).toBe(true);
  });

  it('deve aceitar tolerância', () => {
    const date1 = new Date(2024, 2, 15);
    const date2 = new Date(2024, 3, 17);
    expect(isSameDayOfMonth(date1, date2, 3)).toBe(true);
  });

  it('deve retornar false fora da tolerância', () => {
    const date1 = new Date(2024, 2, 15);
    const date2 = new Date(2024, 3, 25);
    expect(isSameDayOfMonth(date1, date2, 3)).toBe(false);
  });
});

describe('isMonthlyPattern', () => {
  it('deve detectar padrão mensal', () => {
    const dates = [
      new Date(2024, 0, 15), // 15 jan
      new Date(2024, 1, 15), // 15 fev
      new Date(2024, 2, 15), // 15 mar
    ];
    expect(isMonthlyPattern(dates)).toBe(true);
  });

  it('deve aceitar variação de alguns dias', () => {
    const dates = [
      new Date(2024, 0, 15),
      new Date(2024, 1, 17), // 2 dias de diferença
      new Date(2024, 2, 14), // 1 dia de diferença
    ];
    expect(isMonthlyPattern(dates, 5)).toBe(true);
  });

  it('deve rejeitar padrão não mensal', () => {
    const dates = [
      new Date(2024, 0, 1),
      new Date(2024, 0, 15), // 14 dias
      new Date(2024, 1, 1), // 17 dias
    ];
    expect(isMonthlyPattern(dates)).toBe(false);
  });

  it('deve retornar false para menos de 2 datas', () => {
    expect(isMonthlyPattern([new Date()])).toBe(false);
  });
});
