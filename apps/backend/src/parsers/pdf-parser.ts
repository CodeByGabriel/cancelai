/**
 * Parser para extratos PDF
 *
 * Extrai texto de PDFs e identifica transações usando padrões de regex.
 * SEGURANÇA: PDFs são processados em memória e descartados imediatamente.
 */

import pdfParse from 'pdf-parse';
import type { ParseResult, Transaction } from '../types/index.js';
import { BaseBankParser } from './base.js';
import { parseDate } from '../utils/date.js';
import { parseAmount, isDebit } from '../utils/amount.js';

/**
 * Padrões de regex para diferentes bancos
 * Cada padrão captura: data, descrição, valor
 */
const BANK_PATTERNS: BankPattern[] = [
  {
    name: 'Nubank',
    // Padrão: DD MMM YYYY Descrição R$ 0,00
    detectPattern: /nubank|nu pagamentos/i,
    transactionPattern:
      /(\d{2}\s+(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+\d{4})\s+(.+?)\s+R?\$?\s*([\d.,]+)/gi,
    dateParser: parseNubankDate,
  },
  {
    name: 'Itaú',
    detectPattern: /itau|itaú/i,
    // Padrão: DD/MM/YYYY Descrição Valor (pode ter D ou C no final)
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*([DC])?$/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Bradesco',
    detectPattern: /bradesco/i,
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*([DC])?$/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Banco do Brasil',
    detectPattern: /banco do brasil|bb|brasil/i,
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*$/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Caixa',
    detectPattern: /caixa economica|caixa federal|cef/i,
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*$/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Inter',
    detectPattern: /banco inter/i,
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+R?\$?\s*(-?[\d.,]+)/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Santander',
    detectPattern: /santander/i,
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.+?)\s+(-?[\d.,]+)\s*([DC])?$/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'PicPay',
    detectPattern: /picpay|pic\s*pay/i,
    // Padrão PicPay Card: DD/MM Descrição R$ XX,XX
    transactionPattern:
      /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,60}?)\s+R?\$?\s*(-?[\d.,]+)/gim,
    dateParser: parseStandardDate,
  },
  {
    name: 'Mercado Pago',
    detectPattern: /mercado\s*pago|mercadolibre|meli/i,
    // Padrão Mercado Pago: DD/MM/YYYY Descrição Valor
    transactionPattern:
      /(\d{2}\/\d{2}\/?\d{0,4})\s+(.{5,60}?)\s+R?\$?\s*(-?[\d.,]+)/gim,
    dateParser: parseStandardDate,
  },
  // Parser genérico como fallback
  {
    name: 'PDF Genérico',
    detectPattern: /.*/,
    // Tenta capturar qualquer padrão com data DD/MM, descrição e valor
    transactionPattern:
      /(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.{5,50}?)\s+R?\$?\s*(-?[\d.,]+(?:,\d{2})?)/gim,
    dateParser: parseStandardDate,
  },
];

interface BankPattern {
  name: string;
  detectPattern: RegExp;
  transactionPattern: RegExp;
  dateParser: (dateStr: string) => Date | null;
}

/**
 * Parser de data do Nubank (ex: "02 DEZ 2024")
 */
function parseNubankDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
    JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  };

  const match = dateStr.match(/(\d{2})\s+(\w{3})\s+(\d{4})/i);
  if (!match) return null;

  const day = parseInt(match[1]!, 10);
  const monthStr = match[2]!.toUpperCase();
  const year = parseInt(match[3]!, 10);

  const month = months[monthStr];
  if (month === undefined) return null;

  return new Date(year, month, day);
}

/**
 * Parser de data padrão (DD/MM/YYYY ou DD/MM/YY)
 */
function parseStandardDate(dateStr: string): Date | null {
  return parseDate(dateStr);
}

export class PDFParser extends BaseBankParser {
  readonly name = 'PDF Parser';
  readonly supportedFormats = ['pdf'] as const;

  canParse(_content: string | Buffer, filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  async parse(content: string | Buffer, filename: string): Promise<ParseResult> {
    try {
      // SEGURANÇA: Garante que é um Buffer
      const buffer = content instanceof Buffer ? content : Buffer.from(content);

      // SEGURANÇA: Limita tamanho do PDF
      if (buffer.length > 10 * 1024 * 1024) {
        return this.createErrorResult(['Arquivo PDF muito grande (máximo 10MB)']);
      }

      // Extrai texto do PDF
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        return this.createErrorResult([
          'Não foi possível extrair texto do PDF',
          'O PDF pode estar escaneado ou protegido',
        ]);
      }

      // Detecta o banco
      const bankPattern = this.detectBank(text);

      // Extrai transações
      const { transactions, warnings } = this.extractTransactions(
        text,
        bankPattern,
        filename
      );

      // NOTA: 0 transações NÃO é necessariamente um erro
      // O extrato pode ser válido mas conter apenas Pix ou transferências
      // que não seguem padrões de transação bancária tradicional
      if (transactions.length === 0) {
        return {
          success: true, // Parse foi bem-sucedido, apenas não encontrou transações reconhecíveis
          transactions: [],
          bankDetected: bankPattern.name,
          errors: [],
          warnings: [
            ...warnings,
            'Nenhuma transação com padrão reconhecível encontrada no PDF.',
            'Pagamentos via Pix e transferências avulsas podem não ser detectados.',
          ],
        };
      }

      return {
        success: true,
        transactions,
        bankDetected: bankPattern.name,
        errors: [],
        warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return this.createErrorResult([`Erro ao processar PDF: ${message}`]);
    }
  }

  /**
   * Detecta qual banco gerou o PDF
   */
  private detectBank(text: string): BankPattern {
    for (const pattern of BANK_PATTERNS) {
      if (pattern.name === 'PDF Genérico') continue;
      if (pattern.detectPattern.test(text)) {
        return pattern;
      }
    }

    return BANK_PATTERNS[BANK_PATTERNS.length - 1]!; // Genérico
  }

  /**
   * Extrai transações do texto usando o padrão do banco
   */
  private extractTransactions(
    text: string,
    bankPattern: BankPattern,
    _filename: string
  ): { transactions: Transaction[]; warnings: string[] } {
    const transactions: Transaction[] = [];
    const warnings: string[] = [];
    const seen = new Set<string>();

    // Normaliza o texto (remove múltiplos espaços, normaliza quebras de linha)
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ');

    // Aplica o padrão de regex
    const regex = new RegExp(bankPattern.transactionPattern);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalizedText)) !== null) {
      try {
        const [, dateStr, description, amountStr, typeIndicator] = match;

        if (!dateStr || !description || !amountStr) continue;

        // Parse da data
        const date = bankPattern.dateParser(dateStr);
        if (!date) {
          warnings.push(`Data inválida encontrada: ${dateStr}`);
          continue;
        }

        // Parse do valor
        const amount = parseAmount(amountStr);
        if (amount === null || amount === 0) continue;

        // Determina tipo (débito/crédito)
        const type = this.determineType(amountStr, typeIndicator, description);

        // Limpa a descrição
        const cleanDescription = this.cleanDescription(description);
        if (cleanDescription.length < 3) continue;

        // Deduplicação simples
        const key = `${date.toISOString().split('T')[0]}-${amount}-${cleanDescription.substring(0, 20)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        transactions.push(
          this.createTransaction(date, cleanDescription, amount, type)
        );
      } catch {
        // Ignora linhas que não conseguiu processar
        continue;
      }
    }

    // Se não encontrou com o padrão específico, tenta o genérico
    if (transactions.length === 0 && bankPattern.name !== 'PDF Genérico') {
      const genericPattern = BANK_PATTERNS[BANK_PATTERNS.length - 1]!;
      return this.extractTransactions(text, genericPattern, _filename);
    }

    return { transactions, warnings };
  }

  /**
   * Determina se é débito ou crédito
   */
  private determineType(
    amountStr: string,
    typeIndicator: string | undefined,
    description: string
  ): 'debit' | 'credit' {
    // Se tem indicador explícito (D/C)
    if (typeIndicator) {
      return typeIndicator.toUpperCase() === 'D' ? 'debit' : 'credit';
    }

    // Se o valor é negativo
    if (isDebit(amountStr)) {
      return 'debit';
    }

    // Palavras que indicam crédito
    const creditKeywords = [
      'deposito', 'depósito', 'recebido', 'recebimento',
      'transferencia recebida', 'pix recebido', 'ted recebida',
      'estorno', 'reembolso', 'devolucao', 'devolução',
    ];

    const descLower = description.toLowerCase();
    if (creditKeywords.some((keyword) => descLower.includes(keyword))) {
      return 'credit';
    }

    // Por padrão, assume débito (é um gasto)
    return 'debit';
  }

  /**
   * Limpa a descrição removendo ruídos comuns
   */
  private cleanDescription(description: string): string {
    return (
      description
        // Remove múltiplos espaços
        .replace(/\s+/g, ' ')
        // Remove caracteres de controle
        // eslint-disable-next-line no-control-regex -- intentional: stripping control chars from raw PDF text
        .replace(/[\x00-\x1F\x7F]/g, '')
        // Remove códigos numéricos longos (códigos de autorização)
        .replace(/\b\d{8,}\b/g, '')
        // Remove padrões de hora
        .replace(/\d{2}:\d{2}(:\d{2})?/g, '')
        .trim()
    );
  }
}
