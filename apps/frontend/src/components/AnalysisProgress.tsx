'use client';

/**
 * AnalysisProgress - Feedback visual de progresso da análise
 *
 * Exibe as etapas do processamento de forma clara e transparente,
 * sem delays artificiais ou promessas exageradas.
 */

import { CheckCircle, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnalysisStep =
  | 'uploading'
  | 'reading'
  | 'analyzing'
  | 'validating'
  | 'complete';

interface AnalysisProgressProps {
  currentStep: AnalysisStep;
  filesCount: number;
}

interface StepConfig {
  id: AnalysisStep;
  label: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'uploading',
    label: 'Enviando arquivos',
    description: 'Preparando seus extratos para análise',
  },
  {
    id: 'reading',
    label: 'Lendo transações',
    description: 'Extraindo dados dos seus extratos',
  },
  {
    id: 'analyzing',
    label: 'Analisando padrões',
    description: 'Identificando cobranças recorrentes',
  },
  {
    id: 'validating',
    label: 'Validando resultados',
    description: 'Verificando confiança das detecções',
  },
];

function getStepIndex(step: AnalysisStep): number {
  if (step === 'complete') return STEPS.length;
  return STEPS.findIndex(s => s.id === step);
}

export function AnalysisProgress({ currentStep, filesCount }: AnalysisProgressProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Analisando {filesCount} {filesCount === 1 ? 'extrato' : 'extratos'}
        </h3>
        <p className="text-gray-500 text-sm">
          Isso geralmente leva de 10 a 30 segundos
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                isComplete && 'bg-green-50 border border-green-100',
                isCurrent && 'bg-primary-50 border border-primary-200',
                isPending && 'bg-gray-50 border border-gray-100 opacity-50'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium',
                  isComplete && 'text-green-700',
                  isCurrent && 'text-primary-700',
                  isPending && 'text-gray-400'
                )}>
                  {step.label}
                </p>
                <p className={cn(
                  'text-sm',
                  isComplete && 'text-green-600',
                  isCurrent && 'text-primary-600',
                  isPending && 'text-gray-400'
                )}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy reminder */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Seus arquivos são processados em memória e descartados imediatamente.
        Nenhum dado é armazenado.
      </p>
    </div>
  );
}
