/**
 * Parser genérico para extratos CSV
 *
 * Suporta múltiplos formatos de bancos brasileiros com detecção automática.
 * SEGURANÇA: Não armazena dados, processa em streaming quando possível.
 */

import { parse as parseCSV } from 'csv-parse/sync';
import type { ParseResult, Transaction } from '../types/index.js';
import { BaseBankParser } from './base.js';
import { parseDate } from '../utils/date.js';
import { parseAmount, isDebit } from '../utils/amount.js';
import { normalizeDescription } from '../utils/string.js';

/**
 * Mapeamento de colunas para diferentes bancos
 * Cada banco pode ter nomes diferentes para as mesmas informações
 *
 * BANCOS SUPORTADOS (15+):
 * - Nubank, Itaú, Bradesco, Banco do Brasil, Caixa, Inter, Santander
 * - C6 Bank, PicPay, Neon, Original, Next, Sofisa, Agibank, Sicoob
 */
const COLUMN_MAPPINGS: Record<string, ColumnMapping> = {
  // ══════════════════════════════════════════════════════════════
  // BANCOS DIGITAIS
  // ══════════════════════════════════════════════════════════════
  nubank: {
    date: ['Data', 'date', 'data'],
    description: ['Descrição', 'Título', 'description', 'titulo', 'descricao'],
    amount: ['Valor', 'value', 'valor', 'amount'],
    detectPattern: /nubank|nu pagamentos|nu bank/i,
  },
  inter: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'DESCRICAO'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /banco inter|inter\s|inter$/i,
  },
  c6: {
    date: ['Data', 'data', 'DATA', 'Data da Transação'],
    description: ['Descrição', 'descricao', 'DESCRICAO', 'Estabelecimento'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /c6\s*bank|c6bank/i,
  },
  picpay: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Título', 'titulo'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /picpay|pic\s*pay/i,
  },
  neon: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'DESCRICAO'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /neon|banco neon/i,
  },
  original: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Lançamento'],
    amount: ['Valor', 'valor', 'VALOR'],
    type: ['Tipo', 'D/C'],
    detectPattern: /banco original|original/i,
  },
  next: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'DESCRICAO'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /next\s*bank|banco next|next$/i,
  },
  sofisa: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Histórico'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /sofisa|sofisa direto/i,
  },
  agibank: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Lançamento'],
    amount: ['Valor', 'valor', 'VALOR'],
    detectPattern: /agibank|agi bank/i,
  },

  // ══════════════════════════════════════════════════════════════
  // BANCOS TRADICIONAIS
  // ══════════════════════════════════════════════════════════════
  itau: {
    date: ['data', 'Data', 'DATA', 'dt_lancamento'],
    description: ['historico', 'Historico', 'HISTORICO', 'descricao', 'lancamento'],
    amount: ['valor', 'Valor', 'VALOR'],
    type: ['tipo', 'Tipo', 'TIPO', 'dc', 'DC'],
    detectPattern: /itau|itaú/i,
  },
  bradesco: {
    date: ['Data', 'DATA', 'Dt. Movimento'],
    description: ['Histórico', 'HISTORICO', 'Descrição', 'Lancamento'],
    amount: ['Valor', 'VALOR', 'Vlr. Movimento'],
    type: ['D/C', 'Tipo'],
    detectPattern: /bradesco/i,
  },
  bb: {
    date: ['Data', 'DATA', 'data'],
    description: ['Histórico', 'HISTORICO', 'Descrição'],
    amount: ['Valor', 'VALOR'],
    type: ['Tipo'],
    detectPattern: /banco do brasil|bb\s|^bb$/i,
  },
  caixa: {
    date: ['Data Mov.', 'Data', 'DATA'],
    description: ['Histórico', 'Descrição', 'DESCRICAO'],
    amount: ['Valor', 'VALOR'],
    type: ['Débito/Crédito', 'D/C'],
    detectPattern: /caixa economica|caixa federal|cef/i,
  },
  santander: {
    date: ['Data', 'DATA', 'Dt Mvto'],
    description: ['Descrição', 'DESCRICAO', 'Historico'],
    amount: ['Valor', 'VALOR'],
    type: ['Tipo', 'D/C'],
    detectPattern: /santander/i,
  },

  // ══════════════════════════════════════════════════════════════
  // COOPERATIVAS E OUTROS
  // ══════════════════════════════════════════════════════════════
  sicoob: {
    date: ['Data', 'data', 'DATA', 'Data Movimento'],
    description: ['Histórico', 'Descrição', 'DESCRICAO'],
    amount: ['Valor', 'VALOR'],
    type: ['D/C', 'Tipo'],
    detectPattern: /sicoob|sicredi|cooperativa/i,
  },
  sicredi: {
    date: ['Data', 'data', 'DATA'],
    description: ['Histórico', 'Descrição', 'Lançamento'],
    amount: ['Valor', 'VALOR'],
    type: ['D/C', 'Tipo'],
    detectPattern: /sicredi/i,
  },
  btg: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Histórico'],
    amount: ['Valor', 'VALOR'],
    detectPattern: /btg\s*pactual|btg/i,
  },
  xp: {
    date: ['Data', 'data', 'DATA'],
    description: ['Descrição', 'descricao', 'Lançamento'],
    amount: ['Valor', 'VALOR'],
    detectPattern: /xp\s*investimentos|banco xp|xp$/i,
  },

  // ══════════════════════════════════════════════════════════════
  // PARSER GENÉRICO (FALLBACK)
  // ══════════════════════════════════════════════════════════════
  generic: {
    date: [
      'data', 'Data', 'DATA', 'date', 'Date', 'DATE',
      'dt', 'Dt', 'DT', 'data_lancamento', 'dt_lancamento',
    ],
    description: [
      'descricao', 'Descricao', 'DESCRICAO', 'descrição', 'Descrição',
      'description', 'Description', 'DESCRIPTION', 'historico', 'Historico',
      'HISTORICO', 'lancamento', 'Lancamento', 'titulo', 'Titulo',
    ],
    amount: [
      'valor', 'Valor', 'VALOR', 'value', 'Value', 'VALUE',
      'amount', 'Amount', 'AMOUNT', 'vlr', 'Vlr',
    ],
    type: [
      'tipo', 'Tipo', 'TIPO', 'type', 'Type', 'TYPE',
      'd/c', 'D/C', 'dc', 'DC',
    ],
    detectPattern: /.*/,
  },
};

interface ColumnMapping {
  date: string[];
  description: string[];
  amount: string[];
  type?: string[];
  detectPattern: RegExp;
}

export class CSVParser extends BaseBankParser {
  readonly name = 'CSV Parser';
  readonly supportedFormats = ['csv'] as const;

  canParse(content: string | Buffer, filename: string): boolean {
    const ext = filename.toLowerCase();
    return ext.endsWith('.csv') || ext.endsWith('.txt');
  }

  async parse(content: string | Buffer, filename: string): Promise<ParseResult> {
    try {
      const contentStr = typeof content === 'string' ? content : content.toString('utf-8');

      // SEGURANÇA: Limita tamanho do conteúdo para prevenir DoS
      if (contentStr.length > 10 * 1024 * 1024) {
        return this.createErrorResult(['Arquivo muito grande (máximo 10MB)']);
      }

      // Detecta o delimitador
      const delimiter = this.detectDelimiter(contentStr);

      // Parse do CSV
      const records = parseCSV(contentStr, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter,
        relax_column_count: true,
        relax_quotes: true,
      }) as Record<string, string>[];

      if (records.length === 0) {
        return this.createErrorResult(['Arquivo CSV vazio ou sem dados válidos']);
      }

      // Detecta o banco baseado no conteúdo
      const bankMapping = this.detectBank(contentStr, records);

      // Identifica as colunas
      const headers = Object.keys(records[0] ?? {});
      const columnIndexes = this.findColumnIndexes(headers, bankMapping);

      if (!columnIndexes.date || !columnIndexes.description || !columnIndexes.amount) {
        return this.createErrorResult([
          'Não foi possível identificar as colunas necessárias (data, descrição, valor)',
          `Colunas encontradas: ${headers.join(', ')}`,
        ]);
      }

      // Processa as transações
      const transactions: Transaction[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i]!;

        try {
          const transaction = this.parseRecord(record, columnIndexes);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch {
          warnings.push(`Linha ${i + 2}: Não foi possível processar`);
        }
      }

      // NOTA: 0 transações NÃO é necessariamente um erro
      // O extrato pode ser válido mas conter apenas Pix ou transferências
      if (transactions.length === 0) {
        return {
          success: true, // Parse foi bem-sucedido, apenas não encontrou transações reconhecíveis
          transactions: [],
          bankDetected: this.detectBankName(contentStr, records),
          errors: [],
          warnings: [
            ...warnings,
            'Nenhuma transação reconhecível encontrada no arquivo.',
            'Pagamentos via Pix e transferências avulsas podem não ser detectados.',
          ],
        };
      }

      // Atualiza o nome do parser com o banco detectado
      const result = this.createSuccessResult(transactions, warnings);
      return {
        ...result,
        bankDetected: this.detectBankName(contentStr, records),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return this.createErrorResult([`Erro ao processar CSV: ${message}`]);
    }
  }

  /**
   * Detecta o delimitador usado no CSV
   */
  private detectDelimiter(content: string): string {
    const firstLines = content.split('\n').slice(0, 5).join('\n');

    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (firstLines.match(new RegExp(delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }

  /**
   * Detecta qual banco gerou o extrato
   */
  private detectBank(
    content: string,
    records: Record<string, string>[]
  ): ColumnMapping {
    const contentLower = content.toLowerCase();
    const firstRecord = records[0];
    const headerStr = firstRecord ? Object.keys(firstRecord).join(' ').toLowerCase() : '';

    for (const [bankName, mapping] of Object.entries(COLUMN_MAPPINGS)) {
      if (bankName === 'generic') continue;

      if (
        mapping.detectPattern.test(contentLower) ||
        mapping.detectPattern.test(headerStr)
      ) {
        return mapping;
      }
    }

    return COLUMN_MAPPINGS['generic']!;
  }

  /**
   * Mapeamento de nomes de exibição para bancos
   */
  private static readonly BANK_DISPLAY_NAMES: Record<string, string> = {
    nubank: 'Nubank',
    inter: 'Banco Inter',
    c6: 'C6 Bank',
    picpay: 'PicPay',
    neon: 'Neon',
    original: 'Banco Original',
    next: 'Next',
    sofisa: 'Sofisa Direto',
    agibank: 'Agibank',
    itau: 'Itaú',
    bradesco: 'Bradesco',
    bb: 'Banco do Brasil',
    caixa: 'Caixa Econômica',
    santander: 'Santander',
    sicoob: 'Sicoob',
    sicredi: 'Sicredi',
    btg: 'BTG Pactual',
    xp: 'XP Investimentos',
  };

  /**
   * Retorna o nome do banco detectado
   */
  private detectBankName(
    content: string,
    records: Record<string, string>[]
  ): string {
    const contentLower = content.toLowerCase();
    const firstRecord = records[0];
    const headerStr = firstRecord ? Object.keys(firstRecord).join(' ').toLowerCase() : '';

    for (const [bankName, mapping] of Object.entries(COLUMN_MAPPINGS)) {
      if (bankName === 'generic') continue;

      if (
        mapping.detectPattern.test(contentLower) ||
        mapping.detectPattern.test(headerStr)
      ) {
        return CSVParser.BANK_DISPLAY_NAMES[bankName] ?? bankName.charAt(0).toUpperCase() + bankName.slice(1);
      }
    }

    return 'CSV Genérico';
  }

  /**
   * Encontra os índices das colunas baseado no mapeamento
   */
  private findColumnIndexes(
    headers: string[],
    mapping: ColumnMapping
  ): ColumnIndexes {
    const findColumn = (possibleNames: string[]): string | null => {
      for (const header of headers) {
        const headerNorm = normalizeDescription(header);
        for (const name of possibleNames) {
          const nameNorm = normalizeDescription(name);
          if (headerNorm === nameNorm || header.toLowerCase() === name.toLowerCase()) {
            return header;
          }
        }
      }
      return null;
    };

    return {
      date: findColumn(mapping.date),
      description: findColumn(mapping.description),
      amount: findColumn(mapping.amount),
      type: mapping.type ? findColumn(mapping.type) : null,
    };
  }

  /**
   * Processa uma linha do CSV em uma transação
   */
  private parseRecord(
    record: Record<string, string>,
    columns: ColumnIndexes
  ): Transaction | null {
    if (!columns.date || !columns.description || !columns.amount) {
      return null;
    }

    const dateStr = record[columns.date];
    const descriptionStr = record[columns.description];
    const amountStr = record[columns.amount];
    const typeStr = columns.type ? record[columns.type] : undefined;

    if (!dateStr || !descriptionStr || !amountStr) {
      return null;
    }

    const date = parseDate(dateStr);
    if (!date) return null;

    const amount = parseAmount(amountStr);
    if (amount === null || amount === 0) return null;

    // Determina se é débito ou crédito
    const type = isDebit(amountStr, typeStr) ? 'debit' : 'credit';

    return this.createTransaction(date, descriptionStr, amount, type);
  }
}

interface ColumnIndexes {
  date: string | null;
  description: string | null;
  amount: string | null;
  type: string | null;
}
