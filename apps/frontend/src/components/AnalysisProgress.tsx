'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ProcessingShader } from './ProcessingShader';

interface AnalysisProgressProps {
  currentStage: string;
  progressMessage: string;
  filesProcessed: string[];
  subscriptionsFound: number;
  startTime: number;
  isComplete?: boolean;
  totalDurationMs?: number;
}

const STAGE_PROGRESS: Record<string, number> = {
  '': 2,
  validation: 5,
  parsing: 25,
  normalization: 35,
  grouping: 50,
  scoring: 70,
  sanity: 85,
  'ai-classification': 95,
  cleanup: 100,
};

export function AnalysisProgress({
  currentStage,
  progressMessage,
  filesProcessed,
  subscriptionsFound,
  startTime,
  isComplete = false,
  totalDurationMs,
}: AnalysisProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isComplete || !startTime) return;

    const update = () => setElapsed((Date.now() - startTime) / 1000);
    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  const progressPercent = isComplete ? 100 : (STAGE_PROGRESS[currentStage] ?? 10);
  const displayDuration = isComplete && totalDurationMs
    ? (totalDurationMs / 1000).toFixed(1)
    : elapsed.toFixed(1);

  return (
    <div
      className="w-full max-w-xl mx-auto py-8"
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-busy={!isComplete}
      aria-label="Progresso da analise"
    >
      {/* Header — durante processamento mostra Metaballs shader; ao completar, ícone */}
      {isComplete ? (
        <div className="text-center mb-6">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </m.div>

          <h3 className="text-xl font-semibold text-foreground mb-1">
            Analisado em {displayDuration}s
          </h3>
          <p className="text-foreground-muted text-sm tabular-nums">
            {subscriptionsFound} assinaturas encontradas
          </p>
        </div>
      ) : (
        <m.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6"
        >
          <ProcessingShader size={160} className="sm:!w-[200px] sm:!h-[200px]" />
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-foreground mb-1">
              Analisando seus extratos
            </h3>
            <p className="text-foreground-muted text-sm tabular-nums">{displayDuration}s</p>
          </div>
        </m.div>
      )}

      {/* Progress bar */}
      <div className="h-2 bg-elevated rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-green-500' : 'bg-brand animate-pulse'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Dynamic message */}
      <AnimatePresence mode="wait">
        <m.p
          key={progressMessage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-center text-sm text-foreground-secondary mb-4 min-h-[1.25rem]"
        >
          {progressMessage}
        </m.p>
      </AnimatePresence>

      {/* Files processed chips */}
      {filesProcessed.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <AnimatePresence>
            {filesProcessed.map((file) => (
              <m.span
                key={file}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs px-2 py-1 bg-brand-soft text-brand-text rounded-lg font-medium"
              >
                {file}
              </m.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Subscriptions found counter */}
      {subscriptionsFound > 0 && !isComplete && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm font-medium text-brand-text"
        >
          {subscriptionsFound} {subscriptionsFound === 1 ? 'assinatura encontrada' : 'assinaturas encontradas'}
        </m.p>
      )}
    </div>
  );
}
