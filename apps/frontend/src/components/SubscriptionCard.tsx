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
        'rounded-2xl overflow-hidden border',
        'bg-card dark:bg-card',
        'shadow-md',
        'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99] transition-all duration-200',
        'animate-slide-up content-auto will-change-auto',
        subscription.confidence === 'high'
          ? 'border-olive-300/50 dark:border-olive-600/30'
          : subscription.confidence === 'medium'
          ? 'border-ochre-300/50 dark:border-ochre-600/30'
          : 'border-border-default',
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
            <div className="bg-rust-100 dark:bg-[rgba(162,62,44,0.18)] rounded-xl px-3 py-1.5 border border-rust-300/50 dark:border-rust-600/30">
              <p className="text-xs text-rust-700 dark:text-rust-300 font-semibold uppercase tracking-wide flex items-center justify-end gap-1" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>
                <TrendingUp className="w-3 h-3" />
                Impacto anual
              </p>
              <p className="font-display text-xl font-bold text-rust-700 dark:text-rust-300 tracking-tight">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-olive-100 dark:bg-[rgba(107,122,63,0.18)] text-olive-700 dark:text-olive-300 border border-olive-300/60 dark:border-olive-600/30 rounded-lg hover:bg-olive-100 dark:hover:bg-[rgba(107,122,63,0.28)] transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Sim, é assinatura
              </button>
              <button
                onClick={() => handleConfirmation('rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rust-100 dark:bg-[rgba(162,62,44,0.15)] text-rust-700 dark:text-rust-300 border border-rust-300/60 dark:border-rust-600/30 rounded-lg hover:bg-rust-100 dark:hover:bg-[rgba(162,62,44,0.25)] transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Não é assinatura
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
            userConfirmation === 'confirmed' && 'bg-olive-100 dark:bg-[rgba(107,122,63,0.18)] border-olive-300/50 dark:border-olive-600/30',
            userConfirmation === 'rejected' && 'bg-rust-100 dark:bg-[rgba(162,62,44,0.18)] border-rust-300/50 dark:border-rust-600/30',
            userConfirmation === 'unsure' && 'bg-surface border-border-strong'
          )}>
            <span className={cn(
              'text-sm font-medium',
              userConfirmation === 'confirmed' && 'text-olive-700 dark:text-olive-300',
              userConfirmation === 'rejected' && 'text-rust-700 dark:text-rust-300',
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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rust-600 text-white rounded-xl text-sm font-semibold hover:bg-rust-700 transition-colors shadow-sm"
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
