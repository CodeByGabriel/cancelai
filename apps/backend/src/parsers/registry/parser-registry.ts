/**
 * Parser Registry
 *
 * Registry central que gerencia bank parsers registrados.
 * Responsavel por:
 * - Descoberta: qual parser pode processar um arquivo
 * - Pre-processamento: converte Buffer em texto (CSV, PDF text extraction, OFX)
 * - Despacho: delega parse para o bank parser correto
 * - Wrapping: converte Transaction[] em ParseResult
 */

import type { ParseResult } from '../../types/index.js';
import type { FileToProcess } from '../index.js';
import type { BankParserPlugin, FileMetadata, ParseOptions } from './bank-parser.interface.js';
import { isOFXContent } from '../formats/ofx-format.js';
import { extractPDFText } from '../formats/pdf-extractor.js';

/**
 * Determina o formato do arquivo pela extensao e mimetype
 */
function detectFormat(filename: string, mimetype: string): 'csv' | 'pdf' | 'ofx' | null {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'pdf' || mimetype === 'application/pdf') return 'pdf';
  if (ext === 'ofx' || ext === 'qfx' || mimetype === 'application/x-ofx' || mimetype === 'application/vnd.intu.qfx') return 'ofx';
  if (ext === 'csv' || ext === 'txt' || mimetype === 'text/csv' || mimetype === 'text/plain' || mimetype === 'application/vnd.ms-excel') return 'csv';

  return null;
}

class ParserRegistry {
  private readonly parsers: BankParserPlugin[] = [];
  private readonly byId = new Map<string, BankParserPlugin>();

  /**
   * Registra um bank parser. Ordem de registro importa para prioridade de deteccao.
   */
  register(parser: BankParserPlugin): void {
    if (this.byId.has(parser.bankId)) {
      throw new Error(`Parser ja registrado: ${parser.bankId}`);
    }
    this.parsers.push(parser);
    this.byId.set(parser.bankId, parser);
  }

  /**
   * Detecta qual parser pode processar o conteudo
   */
  detectParser(content: string, metadata: FileMetadata): BankParserPlugin | null {
    for (const parser of this.parsers) {
      // Skip generic — e o ultimo recurso
      if (parser.bankId === 'generic') continue;

      if (parser.canParse(content, metadata)) {
        return parser;
      }
    }

    // Fallback para generic
    const generic = this.byId.get('generic');
    if (generic?.canParse(content, metadata)) {
      return generic;
    }

    return null;
  }

  /**
   * Retorna parser por bankId
   */
  getParser(bankId: string): BankParserPlugin | null {
    return this.byId.get(bankId) ?? null;
  }

  /**
   * Lista todos os parsers registrados
   */
  listParsers(): readonly BankParserPlugin[] {
    return this.parsers;
  }

  /**
   * Entry point principal: recebe FileToProcess, retorna ParseResult
   *
   * 1. Detecta formato pela extensao/mimetype
   * 2. Pre-processa conteudo (CSV→string, PDF→text, OFX→string)
   * 3. Detecta banco via canParse()
   * 4. Executa parse()
   * 5. Wrapa em ParseResult
   */
  async parseFile(file: FileToProcess): Promise<ParseResult> {
    const format = detectFormat(file.filename, file.mimetype);

    if (!format) {
      return {
        success: false,
        transactions: [],
        bankDetected: 'Desconhecido',
        errors: [
          `Formato de arquivo nao suportado: ${file.mimetype}`,
          'Formatos aceitos: PDF, CSV, OFX',
        ],
        warnings: [],
      };
    }

    try {
      // Pre-processa conteudo
      let contentStr: string;
      if (format === 'pdf') {
        const buffer = file.content instanceof Buffer ? file.content : Buffer.from(file.content);
        if (buffer.length > 10 * 1024 * 1024) {
          return {
            success: false,
            transactions: [],
            bankDetected: 'Desconhecido',
            errors: ['Arquivo PDF muito grande (maximo 10MB)'],
            warnings: [],
          };
        }
        contentStr = await extractPDFText(buffer);
        if (!contentStr || contentStr.trim().length === 0) {
          return {
            success: false,
            transactions: [],
            bankDetected: 'Desconhecido',
            errors: [
              'Nao foi possivel extrair texto do PDF',
              'O PDF pode estar escaneado ou protegido',
            ],
            warnings: [],
          };
        }
      } else {
        contentStr = typeof file.content === 'string'
          ? file.content
          : file.content.toString('utf-8');
      }

      // Para OFX, verifica se o conteudo e realmente OFX
      if (format === 'ofx' && !isOFXContent(contentStr)) {
        return {
          success: false,
          transactions: [],
          bankDetected: 'Desconhecido',
          errors: ['Arquivo nao parece ser um OFX/QFX valido'],
          warnings: [],
        };
      }

      const metadata: FileMetadata = {
        filename: file.filename,
        mimetype: file.mimetype,
        format,
        size: file.content.length,
      };

      const options: ParseOptions = {
        format,
        filename: file.filename,
      };

      // Detecta banco
      const parser = this.detectParser(contentStr, metadata);

      if (!parser) {
        return {
          success: false,
          transactions: [],
          bankDetected: 'Desconhecido',
          errors: ['Nenhum parser compativel encontrado para este arquivo'],
          warnings: [],
        };
      }

      // Executa parse
      const transactions = await parser.parse(contentStr, options);

      if (transactions.length === 0) {
        return {
          success: false,
          transactions: [],
          bankDetected: parser.displayName,
          errors: [
            'Nenhuma transacao encontrada no arquivo.',
          ],
          warnings: [],
        };
      }

      return {
        success: true,
        transactions: [...transactions],
        bankDetected: parser.displayName,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        success: false,
        transactions: [],
        bankDetected: 'Desconhecido',
        errors: [`Erro ao processar ${file.filename}: ${message}`],
        warnings: [],
      };
    }
  }
}

export const registry = new ParserRegistry();
