/**
 * Interface do plugin de parser bancario
 *
 * Cada banco implementa esta interface como modulo auto-contido.
 * O registry gerencia descoberta e despacho.
 */

import type { Transaction } from '../../types/index.js';

/**
 * Metadados do arquivo para deteccao de parser
 */
export interface FileMetadata {
  readonly filename: string;
  readonly mimetype: string;
  readonly format: 'csv' | 'pdf' | 'ofx';
  readonly size: number;
}

/**
 * Opcoes passadas ao parser durante o parse
 */
export interface ParseOptions {
  readonly format: 'csv' | 'pdf' | 'ofx';
  readonly filename: string;
}

/**
 * Interface que todo parser de banco implementa
 *
 * O `content` recebido em `canParse` e `parse` ja e texto pre-processado:
 * - CSV: string UTF-8 do buffer original
 * - PDF: texto extraido via pdf-parse (registry faz a extracao uma unica vez)
 * - OFX: string UTF-8 do buffer original
 */
export interface BankParserPlugin {
  readonly bankId: string;
  readonly displayName: string;
  readonly bankCode: string;
  readonly supportedFormats: readonly ('pdf' | 'csv' | 'ofx')[];

  /**
   * Verifica se este parser pode processar o conteudo.
   * Recebe texto pre-processado (nao buffer raw).
   */
  canParse(content: string, metadata: FileMetadata): boolean;

  /**
   * Faz o parsing e retorna transacoes.
   * Recebe texto pre-processado (nao buffer raw).
   * Erros devem ser thrown (o registry wrapa em ParseResult).
   */
  parse(content: string, options: ParseOptions): Promise<readonly Transaction[]>;
}

/**
 * Mapeamento de colunas para CSV
 */
export interface CSVColumnMapping {
  readonly date: readonly string[];
  readonly description: readonly string[];
  readonly amount: readonly string[];
  readonly type?: readonly string[];
}
