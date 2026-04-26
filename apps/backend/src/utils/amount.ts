/**
 * Utilitários de manipulação de valores monetários para o Cancelaí
 *
 * Funções especializadas para parsing de valores em formato brasileiro.
 */

/**
 * Faz parsing de um valor monetário em formato brasileiro
 *
 * Suporta formatos:
 * - 1.234,56 (brasileiro)
 * - 1234.56 (americano)
 * - R$ 1.234,56
 * - -1.234,56 (negativo)
 * - (1.234,56) (negativo entre parênteses)
 *
 * @returns Valor absoluto como número positivo, ou null se inválido
 */
export function parseAmount(amountStr: string): number | null {
  if (!amountStr || typeof amountStr !== 'string') return null;

  let cleaned = amountStr.trim();

  // Remove símbolos de moeda, parênteses e o sinal negativo de prefixo
  // (apenas o do início; manter `-` no meio impediria detectar valores
  // malformados com hífens internos que devem virar NaN).
  cleaned = cleaned
    .replace(/R\$\s*/gi, '')
    .replace(/[()]/g, '')
    .replace(/^-/, '')
    .trim();

  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Tem ambos: a posição relativa decide o formato.
    // - Brasileiro (1.234,56): último separador é a vírgula
    // - Americano  (1,234.56): último separador é o ponto
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // BR: pontos são milhares, vírgula é decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US: vírgulas são milhares, ponto é decimal
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Só vírgula: ambíguo. Se há ≤ 2 dígitos depois da última vírgula,
    // tratamos como decimal brasileiro; caso contrário (ex.: "1,234"),
    // tratamos como milhar americano.
    const lastComma = cleaned.lastIndexOf(',');
    const decimals = cleaned.length - lastComma - 1;
    if (decimals <= 2 && cleaned.indexOf(',') === lastComma) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // Só ponto: pode ser decimal americano (1234.56) ou milhar BR (1.234).
    // Se houver múltiplos pontos OU mais de 2 dígitos após o último ponto,
    // tratamos como milhares e removemos.
    const lastDot = cleaned.lastIndexOf('.');
    const decimals = cleaned.length - lastDot - 1;
    const hasMultipleDots = cleaned.indexOf('.') !== lastDot;
    if (hasMultipleDots || decimals > 2) {
      cleaned = cleaned.replace(/\./g, '');
    }
    // caso contrário, manter como está (decimal americano)
  }

  const value = parseFloat(cleaned);

  if (isNaN(value)) return null;

  return Math.abs(value);
}

/**
 * Determina se um valor representa um débito baseado no contexto
 *
 * @param rawAmount - String original do valor
 * @param typeColumn - Valor da coluna de tipo, se existir
 */
export function isDebit(rawAmount: string, typeColumn?: string): boolean {
  // Se tem coluna de tipo explícita
  if (typeColumn) {
    const typeLower = typeColumn.toLowerCase();
    return (
      typeLower === 'd' ||
      typeLower.includes('deb') ||
      typeLower.includes('saida') ||
      typeLower.includes('saída')
    );
  }

  // Verifica sinais no valor
  const trimmed = rawAmount.trim();
  return trimmed.startsWith('-') || (trimmed.startsWith('(') && trimmed.endsWith(')'));
}

/**
 * Verifica se dois valores estão dentro de uma tolerância percentual
 *
 * @param value1 - Primeiro valor
 * @param value2 - Segundo valor
 * @param tolerancePercent - Tolerância em porcentagem (0.15 = 15%)
 */
export function isWithinTolerance(
  value1: number,
  value2: number,
  tolerancePercent: number
): boolean {
  if (value1 === 0 && value2 === 0) return true;
  if (value1 === 0 || value2 === 0) return false;

  const diff = Math.abs(value1 - value2);
  const avg = (value1 + value2) / 2;
  const percentDiff = diff / avg;

  return percentDiff <= tolerancePercent;
}

/**
 * Calcula a média de um array de valores
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Formata um valor para exibição em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Arredonda um valor para 2 casas decimais
 */
export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
