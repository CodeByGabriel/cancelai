/**
 * Validation Stage
 *
 * Valida arquivos de entrada: existencia, MIME type, tamanho.
 * canSkip retorna true se o controller ja validou (flag filesValidated).
 */

import type { PipelineContext, PipelineEvent, PipelineStage } from '../pipeline-events.js';
import { config } from '../../config/index.js';

export class ValidationStage implements PipelineStage {
  readonly name = 'validation';

  canSkip(context: PipelineContext): boolean {
    return context.filesValidated;
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async required for AsyncGenerator return type
  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    if (context.files.length === 0) {
      yield {
        type: 'error',
        code: 'NO_FILES',
        message: 'Nenhum arquivo enviado para análise',
        recoverable: false,
      };
      return;
    }

    let validCount = 0;

    for (const file of context.files) {
      // Valida tamanho
      if (file.content.length > config.server.maxFileSize) {
        yield {
          type: 'file-error',
          filename: file.filename,
          error: `Tamanho ${(file.content.length / (1024 * 1024)).toFixed(1)}MB excede limite de ${config.server.maxFileSize / (1024 * 1024)}MB`,
        };
        continue;
      }

      // Valida arquivo vazio
      if (file.content.length === 0) {
        yield {
          type: 'file-error',
          filename: file.filename,
          error: 'Arquivo vazio',
        };
        continue;
      }

      // Valida MIME type ou extensao
      const ext = file.filename.toLowerCase().split('.').pop();
      const extWithDot = ext ? `.${ext}` : '';
      const validExtension = (config.upload.allowedExtensions as readonly string[]).includes(extWithDot);
      const validMime = (config.upload.allowedMimeTypes as readonly string[]).includes(file.mimetype);

      if (!validExtension && !validMime) {
        yield {
          type: 'file-error',
          filename: file.filename,
          error: `Tipo "${file.mimetype}" nao permitido. Aceitos: ${config.upload.allowedExtensions.join(', ')}`,
        };
        continue;
      }

      validCount++;
    }

    if (validCount === 0) {
      yield {
        type: 'error',
        code: 'NO_VALID_FILES',
        message: 'Nenhum arquivo valido para processar',
        recoverable: false,
      };
      return;
    }

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: { totalFiles: context.files.length, validFiles: validCount },
    };
  }
}
