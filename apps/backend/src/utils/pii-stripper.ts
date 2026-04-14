/**
 * PII Stripper — Remove dados pessoais de transações
 *
 * LGPD Art. 6 — Princípio da necessidade:
 * Coletar apenas dados estritamente necessários para a finalidade.
 *
 * Após parsing, mantemos APENAS:
 * - Descrição do merchant (normalizada, sem dados pessoais)
 * - Valor da transação
 * - Data da transação
 * - Tipo (débito/crédito)
 *
 * Remove: números de conta, CPF/CNPJ, saldos, nomes, endereços.
 */

// Patterns de PII brasileiros
const CPF_PATTERN = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g;
const CNPJ_PATTERN = /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[/.\s]?\d{4}[-.\s]?\d{2}\b/g;
const ACCOUNT_PATTERN = /\b(?:conta|ag|agencia|cc|c\/c)\s*[:.]?\s*\d{3,}/gi;
const CARD_PATTERN = /\b\d{4}[\s*-]?\d{4}[\s*-]?\d{4}[\s*-]?\d{4}\b/g;
const CARD_PARTIAL = /\bfinal\s*\d{4}\b/gi;
const SALDO_PATTERN = /\b(?:saldo|sdo)\s*[:.]?\s*-?R?\$?\s*[\d.,]+/gi;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_PATTERN = /\b(?:\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}\b/g;

/**
 * Remove PII de uma string de descrição de transação.
 * Função pura — não modifica o input.
 */
export function stripPII(text: string): string {
  return text
    .replace(CPF_PATTERN, '[CPF]')
    .replace(CNPJ_PATTERN, '[CNPJ]')
    .replace(CARD_PATTERN, '[CARTAO]')
    .replace(CARD_PARTIAL, '[FINAL]')
    .replace(ACCOUNT_PATTERN, '[CONTA]')
    .replace(SALDO_PATTERN, '[SALDO]')
    .replace(EMAIL_PATTERN, '[EMAIL]')
    .replace(PHONE_PATTERN, '[TELEFONE]');
}

/**
 * Verifica se uma string contém potenciais PII
 */
export function containsPII(text: string): boolean {
  return (
    CPF_PATTERN.test(text) ||
    CNPJ_PATTERN.test(text) ||
    CARD_PATTERN.test(text) ||
    ACCOUNT_PATTERN.test(text) ||
    SALDO_PATTERN.test(text) ||
    EMAIL_PATTERN.test(text)
  );
}
