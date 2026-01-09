/**
 * Gerenciador de Parsers
 *
 * Coordena múltiplos parsers e escolhe o mais apropriado para cada arquivo.
 */

import type { ParseResult, Transaction } from '../types/index.js';
import type { BankParser } from './base.js';
import { CSVParser } from './csv-parser.js';
import { PDFParser } from './pdf-parser.js';

/**
 * Registro de todos os parsers disponíveis
 */
const parsers: BankParser[] = [new CSVParser(), new PDFParser()];

/**
 * Interface para arquivo a ser processado
 */
export interface FileToProcess {
  filename: string;
  content: Buffer;
  mimetype: string;
}

/**
 * Processa múltiplos arquivos de extrato
 *
 * SEGURANÇA: Cada arquivo é processado independentemente e descartado após uso.
 */
export async function parseStatements(
  files: FileToProcess[]
): Promise<{
  transactions: Transaction[];
  results: ParseResult[];
}> {
  const allTransactions: Transaction[] = [];
  const results: ParseResult[] = [];

  for (const file of files) {
    const result = await parseFile(file);
    results.push(result);

    if (result.success) {
      allTransactions.push(...result.transactions);
    }
  }

  // Deduplica transações entre arquivos (caso o usuário envie extratos sobrepostos)
  const deduplicatedTransactions = deduplicateTransactions(allTransactions);

  return {
    transactions: deduplicatedTransactions,
    results,
  };
}

/**
 * Processa um único arquivo
 */
async function parseFile(file: FileToProcess): Promise<ParseResult> {
  // Encontra um parser compatível
  const parser = findParser(file);

  if (!parser) {
    return {
      success: false,
      transactions: [],
      bankDetected: 'Desconhecido',
      errors: [
        `Formato de arquivo não suportado: ${file.mimetype}`,
        'Formatos aceitos: PDF, CSV',
      ],
      warnings: [],
    };
  }

  try {
    const result = await parser.parse(file.content, file.filename);

    // SEGURANÇA: Limpa referência ao conteúdo do arquivo após processamento
    // O garbage collector vai limpar, mas isso ajuda a liberar mais rápido
    (file as { content: Buffer | null }).content = null;

    return result;
  } catch (error) {
    return {
      success: false,
      transactions: [],
      bankDetected: 'Desconhecido',
      errors: [
        `Erro ao processar ${file.filename}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
      ],
      warnings: [],
    };
  }
}

/**
 * Encontra o parser mais apropriado para um arquivo
 */
function findParser(file: FileToProcess): BankParser | null {
  // Primeiro, tenta pela extensão do arquivo
  for (const parser of parsers) {
    if (parser.canParse(file.content, file.filename)) {
      return parser;
    }
  }

  // Fallback: tenta pelo MIME type
  if (file.mimetype === 'application/pdf') {
    return parsers.find((p) => p.name === 'PDF Parser') ?? null;
  }

  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    return parsers.find((p) => p.name === 'CSV Parser') ?? null;
  }

  return null;
}

/**
 * Remove transações duplicadas
 *
 * Considera duplicada se: mesma data, mesmo valor, descrição similar
 */
function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>();

  for (const transaction of transactions) {
    const key = generateDeduplicationKey(transaction);

    // Se já existe, mantém apenas se a descrição for mais completa
    const existing = seen.get(key);
    if (existing) {
      if (transaction.description.length > existing.description.length) {
        seen.set(key, transaction);
      }
    } else {
      seen.set(key, transaction);
    }
  }

  return Array.from(seen.values());
}

/**
 * Gera uma chave única para deduplicação
 */
function generateDeduplicationKey(transaction: Transaction): string {
  const dateStr = transaction.date.toISOString().split('T')[0];
  const amountStr = transaction.amount.toFixed(2);

  // Usa apenas os primeiros 20 caracteres da descrição normalizada
  const descNorm = transaction.description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  return `${dateStr}|${amountStr}|${descNorm}`;
}

export { CSVParser } from './csv-parser.js';
export { PDFParser } from './pdf-parser.js';
export type { BankParser } from './base.js';
