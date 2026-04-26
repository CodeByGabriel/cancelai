/**
 * Sanitização contra CSV injection.
 *
 * Strings que começam com `=`, `+`, `-`, `@`, `\t` ou `\r` podem ser
 * interpretadas como fórmulas pelo Excel/LibreOffice/Sheets quando o
 * usuário exporta os resultados. Prefixar com aspa simples neutraliza
 * a interpretação sem alterar a leitura humana.
 */

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function sanitizeForCSV(value: string): string {
  if (value.length === 0) return value;
  const first = value.charAt(0);
  if (DANGEROUS_PREFIXES.includes(first)) {
    return `'${value}`;
  }
  return value;
}

export function sanitizeForCSVList(values: readonly string[]): string[] {
  return values.map(sanitizeForCSV);
}
