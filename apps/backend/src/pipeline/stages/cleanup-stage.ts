/**
 * Cleanup Stage
 *
 * Zera buffers de arquivos na memoria e remove referencias.
 * Rodado no finally do orchestrator — sempre executa.
 *
 * SEGURANCA: Defense in depth — sobrescreve com zeros antes de descartar.
 */

import type { PipelineContext, PipelineEvent, PipelineStage } from '../pipeline-events.js';

export class CleanupStage implements PipelineStage {
  readonly name = 'cleanup';

  // eslint-disable-next-line @typescript-eslint/require-await -- async required for AsyncGenerator return type
  async *execute(context: PipelineContext): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();

    yield {
      type: 'stage-start',
      stage: this.name,
      timestamp: startTime,
    };

    let cleaned = 0;

    for (const file of context.files) {
      if (file.content && file.content.length > 0) {
        file.content.fill(0);
        cleaned++;
      }
      (file as { content: Buffer | null }).content = null;
    }

    yield {
      type: 'stage-complete',
      stage: this.name,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
      summary: { filesCleaned: cleaned },
    };
  }
}
