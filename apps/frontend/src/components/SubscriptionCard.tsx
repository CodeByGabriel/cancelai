'use client';

import { useState, memo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  TrendingUp,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  X,
} from 'lucide-react';
import type { DetectedSubscription } from '@/types';

// Aceita apenas http:/https: para evitar javascript:/data:/vbscript:/etc.
function parseSafeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}
import {
  formatCurrency,
  formatDate,
  getConfidenceColor,
  getConfidenceLabel,
  getCategoryIcon,
  getCategoryLabel,
  formatConfidenceScore,
  getScoreBarColor,
  cn,
} from '@/lib/utils';

// Status de confirmação do usuário (apenas local, não persistido)
type UserConfirmation = 'confirmed' | 'rejected' | 'unsure' | null;

interface SubscriptionCardProps {
  subscription: DetectedSubscription;
  index: number;
  onConfirmationChange?: (id: string, status: UserConfirmation) => void;
}

/**
 * Retorna ícone de confiança apropriado
 */
function getConfidenceIcon(confidence: 'high' | 'medium' | 'low') {
  switch (confidence) {
    case 'high':
      return <ShieldCheck className="w-4 h-4" />;
    case 'medium':
      return <Shield className="w-4 h-4" />;
    case 'low':
      return <ShieldAlert className="w-4 h-4" />;
  }
}

export const SubscriptionCard = memo(function SubscriptionCard({ subscription, index, onConfirmationChange }: SubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userConfirmation, setUserConfirmation] = useState<UserConfirmation>(null);
  const confidenceScore = subscription.confidenceScore ?? 0;

  // Mostra botões de confirmação apenas para itens de média/baixa confiança
  const showConfirmationButtons = subscription.confidence !== 'high';

  const handleConfirmation = (status: UserConfirmation) => {
    setUserConfirmation(status);
    onConfirmationChange?.(subscription.id, status);
  };

  return (
    <div
      className={cn(
        'bg-card rounded-2xl border overflow-hidden',
        'shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200',
        'animate-slide-up content-auto will-change-auto',
        subscription.confidence === 'high'
          ? 'border-green-200 dark:border-green-700'
          : subscription.confidence === 'medium'
          ? 'border-yellow-200 dark:border-yellow-700'
          : 'border-border-strong'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onAnimationStart={(e) => { e.currentTarget.style.willChange = 'transform'; }}
      onAnimationEnd={(e) => { e.currentTarget.style.willChange = 'auto'; }}
    >
      {/* Barra de confiança no topo */}
      {subscription.confidenceScore !== undefined && (
        <div className="h-1 bg-elevated">
          <div
            className={cn('h-full transition-all duration-500', getScoreBarColor(confidenceScore))}
            style={{ width: `${confidenceScore * 100}%` }}
          />
        </div>
      )}

      {/* Header do card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Info principal */}
          <div className="flex items-start gap-4">
            {/* Ícone da categoria */}
            <div className="w-12 h-12 bg-elevated rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {getCategoryIcon(subscription.category)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {subscription.name}
              </h3>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Categoria */}
                <span className="text-xs px-2 py-0.5 bg-elevated text-foreground-secondary rounded-full">
                  {getCategoryLabel(subscription.category)}
                </span>

                {/* Badge de confiança melhorado */}
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1',
                    getConfidenceColor(subscription.confidence)
                  )}
                >
                  {getConfidenceIcon(subscription.confidence)}
                  {getConfidenceLabel(subscription.confidence)}
                  {subscription.confidenceScore !== undefined && (
                    <span className="font-semibold ml-0.5">
                      {formatConfidenceScore(subscription.confidenceScore)}
                    </span>
                  )}
                </span>

                {/* Ocorrências */}
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {subscription.occurrences}x detectado
                </span>
              </div>
            </div>
          </div>

          {/* Valores - Destacando impacto anual */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm text-foreground-muted mb-1">
              {formatCurrency(subscription.monthlyAmount)}/mês
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5 border border-red-100 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                Impacto anual
              </p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(subscription.annualAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Razões de confiança */}
        {subscription.confidenceReasons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {subscription.confidenceReasons.map((reason, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-brand-soft text-brand-text rounded-lg"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Botões de confirmação para itens ambíguos */}
        {showConfirmationButtons && userConfirmation === null && (
          <div className="mt-4 p-3 bg-surface rounded-xl border border-border-default">
            <p className="text-xs text-foreground-muted mb-2">
              Isso parece uma assinatura?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleConfirmation('confirmed')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Sim, e assinatura
              </button>
              <button
                onClick={() => handleConfirmation('rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Nao e assinatura
              </button>
              <button
                onClick={() => handleConfirmation('unsure')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-elevated text-foreground-secondary border border-border-strong rounded-lg hover:bg-border-strong transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Nao sei
              </button>
            </div>
          </div>
        )}

        {/* Feedback após confirmação */}
        {showConfirmationButtons && userConfirmation !== null && (
          <div className={cn(
            'mt-4 p-3 rounded-xl border flex items-center justify-between',
            userConfirmation === 'confirmed' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            userConfirmation === 'rejected' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            userConfirmation === 'unsure' && 'bg-surface border-border-strong'
          )}>
            <span className={cn(
              'text-sm font-medium',
              userConfirmation === 'confirmed' && 'text-green-700 dark:text-green-300',
              userConfirmation === 'rejected' && 'text-red-700 dark:text-red-300',
              userConfirmation === 'unsure' && 'text-foreground-secondary'
            )}>
              {userConfirmation === 'confirmed' && 'Marcado como assinatura'}
              {userConfirmation === 'rejected' && 'Marcado como NAO assinatura'}
              {userConfirmation === 'unsure' && 'Marcado para revisar depois'}
            </span>
            <button
              onClick={() => handleConfirmation(null)}
              className="p-1 text-foreground-faint hover:text-foreground-secondary rounded"
              aria-label="Desfazer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Botão de expandir */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-foreground-muted hover:text-foreground-secondary hover:bg-surface rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Ocultar detalhes
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Ver detalhes e como cancelar
            </>
          )}
        </button>
      </div>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="border-t border-border-default bg-surface p-5 space-y-4">
          {/* Transações */}
          <div>
            <h4 className="text-sm font-medium text-foreground-secondary mb-2">
              Cobranças detectadas
            </h4>
            <div className="space-y-2">
              {subscription.transactions.map((transaction, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 bg-card rounded-lg text-sm border border-border-default"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-foreground-muted font-mono text-xs">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="text-foreground-secondary truncate max-w-[200px]">
                      {transaction.description}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nomes originais */}
          {subscription.originalNames.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-foreground-secondary mb-2">
                Variações encontradas no extrato
              </h4>
              <div className="flex flex-wrap gap-2">
                {subscription.originalNames.map((name, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-card border border-border-strong rounded font-mono text-foreground-secondary"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instruções de cancelamento */}
          {subscription.cancelInstructions && (() => {
            const safeUrl = parseSafeHttpUrl(subscription.cancelInstructions);
            return (
              <div className="pt-2 border-t border-border-strong">
                <h4 className="text-sm font-medium text-foreground-secondary mb-2">
                  Como cancelar
                </h4>
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ir para página de cancelamento
                  </a>
                ) : (
                  <p className="text-sm text-foreground-secondary bg-card px-3 py-2 rounded-lg border border-border-strong">
                    {subscription.cancelInstructions}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
});
