/**
 * Parser base abstrato para extratos bancários
 *
 * Define a interface comum para todos os parsers de banco.
 */

import type { ParseResult, Transaction } from '../types/index.js';

/**
 * Interface base para parsers de extrato
 */
export interface BankParser {
  readonly name: string;
  readonly supportedFormats: readonly ('pdf' | 'csv')[];

  /**
   * Verifica se este parser pode processar o conteúdo
   */
  canParse(content: string | Buffer, filename: string): boolean;

  /**
   * Faz o parsing do conteúdo e retorna transações
   */
  parse(content: string | Buffer, filename: string): Promise<ParseResult>;
}

/**
 * Classe base abstrata com funcionalidades comuns
 */
export abstract class BaseBankParser implements BankParser {
  abstract readonly name: string;
  abstract readonly supportedFormats: readonly ('pdf' | 'csv')[];

  abstract canParse(content: string | Buffer, filename: string): boolean;
  abstract parse(content: string | Buffer, filename: string): Promise<ParseResult>;

  /**
   * Cria um resultado de sucesso
   */
  protected createSuccessResult(
    transactions: Transaction[],
    warnings: string[] = []
  ): ParseResult {
    return {
      success: true,
      transactions,
      bankDetected: this.name,
      errors: [],
      warnings,
    };
  }

  /**
   * Cria um resultado de erro
   */
  protected createErrorResult(errors: string[]): ParseResult {
    return {
      success: false,
      transactions: [],
      bankDetected: this.name,
      errors,
      warnings: [],
    };
  }

  /**
   * Cria uma transação normalizada
   */
  protected createTransaction(
    date: Date,
    description: string,
    amount: number,
    type: 'debit' | 'credit'
  ): Transaction {
    return {
      date,
      description: description.trim(),
      originalDescription: description,
      amount: Math.abs(amount),
      type,
      source: this.name,
    };
  }
}
