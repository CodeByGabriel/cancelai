/**
 * Utilitários de manipulação de datas para o Cancelaí
 *
 * Funções especializadas para parsing de datas em formatos brasileiros.
 */

/**
 * Formatos de data comuns em extratos bancários brasileiros
 */
const DATE_FORMATS = [
  // DD/MM/YYYY
  /^(\d{2})\/(\d{2})\/(\d{4})$/,
  // DD/MM/YY
  /^(\d{2})\/(\d{2})\/(\d{2})$/,
  // DD-MM-YYYY
  /^(\d{2})-(\d{2})-(\d{4})$/,
  // DD-MM-YY
  /^(\d{2})-(\d{2})-(\d{2})$/,
  // YYYY-MM-DD (ISO)
  /^(\d{4})-(\d{2})-(\d{2})$/,
  // DD.MM.YYYY
  /^(\d{2})\.(\d{2})\.(\d{4})$/,
];

/**
 * Faz parsing de uma string de data em formatos brasileiros
 *
 * @returns Date válida ou null se não conseguir parsear
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Tenta cada formato conhecido
  for (const format of DATE_FORMATS) {
    const match = trimmed.match(format);
    if (match) {
      const parsed = parseDateMatch(match, format);
      if (parsed && isValidDate(parsed)) {
        return parsed;
      }
    }
  }

  // Tenta parsing nativo como fallback
  const nativeDate = new Date(trimmed);
  if (isValidDate(nativeDate)) {
    return nativeDate;
  }

  return null;
}

/**
 * Processa o match de regex para extrair a data
 */
function parseDateMatch(match: RegExpMatchArray, format: RegExp): Date | null {
  const formatStr = format.toString();

  // Verifica se é formato ISO (YYYY-MM-DD)
  if (formatStr.includes('^(\\d{4})')) {
    const year = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10) - 1;
    const day = parseInt(match[3]!, 10);
    return new Date(year, month, day);
  }

  // Formatos brasileiros (DD/MM/YYYY ou variações)
  const day = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1;
  let year = parseInt(match[3]!, 10);

  // Converte ano de 2 dígitos para 4 dígitos
  if (year < 100) {
    year = year > 50 ? 1900 + year : 2000 + year;
  }

  return new Date(year, month, day);
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.round(diff / msPerDay);
}

/**
 * Verifica se duas datas estão aproximadamente no mesmo dia do mês
 *
 * @param tolerance - Dias de tolerância
 */
export function isSameDayOfMonth(
  date1: Date,
  date2: Date,
  tolerance: number
): boolean {
  const day1 = date1.getDate();
  const day2 = date2.getDate();

  // Diferença direta
  if (Math.abs(day1 - day2) <= tolerance) {
    return true;
  }

  // Considera virada de mês (ex: dia 31 → dia 1)
  const daysInMonth1 = daysInMonth(date1);
  const daysInMonth2 = daysInMonth(date2);

  // Se um dia é perto do fim do mês e outro do início
  if (day1 > daysInMonth1 - tolerance && day2 <= tolerance) {
    return true;
  }
  if (day2 > daysInMonth2 - tolerance && day1 <= tolerance) {
    return true;
  }

  return false;
}

/**
 * Retorna o número de dias em um mês
 */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Verifica se o intervalo entre datas é aproximadamente mensal
 *
 * @param dates - Array de datas ordenadas
 * @param toleranceDays - Tolerância em dias (padrão: 5)
 */
export function isMonthlyPattern(dates: Date[], toleranceDays = 5): boolean {
  if (dates.length < 2) return false;

  // Ordena as datas
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Verifica intervalos entre datas consecutivas
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const interval = daysBetween(sorted[i - 1]!, sorted[i]!);
    intervals.push(interval);
  }

  // Verifica se todos os intervalos estão próximos de 30 dias
  const expectedInterval = 30;
  const allMonthly = intervals.every(
    (interval) =>
      interval >= expectedInterval - toleranceDays &&
      interval <= expectedInterval + toleranceDays + 5 // +5 para meses com 31 dias
  );

  return allMonthly;
}

/**
 * Encontra a data mais antiga e mais recente de um array
 */
export function getDateRange(dates: Date[]): { start: Date; end: Date } | null {
  if (dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    start: sorted[0]!,
    end: sorted[sorted.length - 1]!,
  };
}

/**
 * Formata uma data para exibição no formato brasileiro
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
