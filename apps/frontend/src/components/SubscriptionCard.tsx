'use client';

import { useState } from 'react';
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

export function SubscriptionCard({ subscription, index, onConfirmationChange }: SubscriptionCardProps) {
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
        'bg-white rounded-2xl border overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'animate-slide-up',
        subscription.confidence === 'high'
          ? 'border-green-200'
          : subscription.confidence === 'medium'
          ? 'border-yellow-200'
          : 'border-gray-200'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Barra de confiança no topo */}
      {subscription.confidenceScore !== undefined && (
        <div className="h-1 bg-gray-100">
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
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              {getCategoryIcon(subscription.category)}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {subscription.name}
              </h3>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Categoria */}
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
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
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {subscription.occurrences}x detectado
                </span>
              </div>
            </div>
          </div>

          {/* Valores - Destacando impacto anual */}
          <div className="text-right flex-shrink-0">
            <p className="text-sm text-gray-500 mb-1">
              {formatCurrency(subscription.monthlyAmount)}/mês
            </p>
            <div className="bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
              <p className="text-xs text-red-600 font-medium flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                Impacto anual
              </p>
              <p className="text-xl font-bold text-red-700">
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
                className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-lg"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Botões de confirmação para itens ambíguos */}
        {showConfirmationButtons && userConfirmation === null && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Isso parece uma assinatura?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleConfirmation('confirmed')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Sim, e assinatura
              </button>
              <button
                onClick={() => handleConfirmation('rejected')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Nao e assinatura
              </button>
              <button
                onClick={() => handleConfirmation('unsure')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
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
            userConfirmation === 'confirmed' && 'bg-green-50 border-green-200',
            userConfirmation === 'rejected' && 'bg-red-50 border-red-200',
            userConfirmation === 'unsure' && 'bg-gray-50 border-gray-200'
          )}>
            <span className={cn(
              'text-sm font-medium',
              userConfirmation === 'confirmed' && 'text-green-700',
              userConfirmation === 'rejected' && 'text-red-700',
              userConfirmation === 'unsure' && 'text-gray-600'
            )}>
              {userConfirmation === 'confirmed' && 'Marcado como assinatura'}
              {userConfirmation === 'rejected' && 'Marcado como NAO assinatura'}
              {userConfirmation === 'unsure' && 'Marcado para revisar depois'}
            </span>
            <button
              onClick={() => handleConfirmation(null)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Desfazer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Botão de expandir */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
          {/* Transações */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Cobranças detectadas
            </h4>
            <div className="space-y-2">
              {subscription.transactions.map((transaction, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 bg-white rounded-lg text-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-mono text-xs">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="text-gray-700 truncate max-w-[200px]">
                      {transaction.description}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nomes originais */}
          {subscription.originalNames.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Variações encontradas no extrato
              </h4>
              <div className="flex flex-wrap gap-2">
                {subscription.originalNames.map((name, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded font-mono text-gray-600"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instruções de cancelamento */}
          {subscription.cancelInstructions && (
            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Como cancelar
              </h4>
              {subscription.cancelInstructions.startsWith('http') ? (
                <a
                  href={subscription.cancelInstructions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ir para página de cancelamento
                </a>
              ) : (
                <p className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                  {subscription.cancelInstructions}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
