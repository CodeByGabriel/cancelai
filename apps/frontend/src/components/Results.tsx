'use client';

import { useMemo } from 'react';
import { RefreshCw, AlertTriangle, PartyPopper, CheckCircle2, HelpCircle } from 'lucide-react';
import type { AnalysisResult, DetectedSubscription } from '@/types';
import { ResultsSummary } from './ResultsSummary';
import { SubscriptionCard } from './SubscriptionCard';

interface ResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function Results({ result, onReset }: ResultsProps) {
  const { subscriptions, summary, metadata, info } = result;
  const hasSubscriptions = subscriptions.length > 0;

  const { confirmedSubscriptions, needsReviewSubscriptions } = useMemo(() => {
    const confirmed: DetectedSubscription[] = [];
    const review: DetectedSubscription[] = [];
    for (const s of subscriptions) {
      if (s.confidence === 'high') confirmed.push(s);
      else review.push(s);
    }
    return { confirmedSubscriptions: confirmed, needsReviewSubscriptions: review };
  }, [subscriptions]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {hasSubscriptions
            ? 'Encontramos suas assinaturas!'
            : 'Nenhuma assinatura encontrada'}
        </h2>
        <p className="text-foreground-muted">
          {hasSubscriptions
            ? `Analisamos ${summary.transactionsAnalyzed} transações e encontramos ${subscriptions.length} assinaturas recorrentes.`
            : 'Não identificamos padrões de cobrança recorrente nos seus extratos.'}
        </p>
      </div>

      {/* Resumo */}
      {hasSubscriptions && <ResultsSummary summary={summary} metadata={metadata} />}

      {/* Lista de assinaturas ou estado vazio */}
      {hasSubscriptions ? (
        <div className="space-y-8">
          {/* Seção: Assinaturas Confirmadas */}
          {confirmedSubscriptions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Assinaturas confirmadas
                </h3>
                <span className="text-sm text-foreground-muted">
                  ({confirmedSubscriptions.length})
                </span>
              </div>
              <p className="text-sm text-foreground-muted -mt-2">
                Alta confianca na deteccao. Padrao mensal claro e valores consistentes.
              </p>

              <div className="space-y-4">
                {confirmedSubscriptions.map((subscription, index) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Seção: Precisa Revisão */}
          {needsReviewSubscriptions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Pode precisar de revisao
                </h3>
                <span className="text-sm text-foreground-muted">
                  ({needsReviewSubscriptions.length})
                </span>
              </div>

              {/* Aviso explicativo */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Nem tudo aqui e 100% certeza
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Estes itens podem ser compras parceladas, cobranças pontuais ou
                    transacoes similares. Verifique cada item antes de tomar uma decisao.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {needsReviewSubscriptions.map((subscription, index) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    index={confirmedSubscriptions.length + index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-b from-green-50 dark:from-green-900/20 to-background rounded-3xl border border-green-100 dark:border-green-800">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Boa noticia!
          </h3>
          <p className="text-foreground-secondary max-w-md mx-auto mb-6">
            Nao encontramos assinaturas recorrentes nesse periodo.
          </p>

          {/* Mensagens informativas do backend */}
          {info && info.length > 0 && (
            <div className="max-w-md mx-auto space-y-2 text-left bg-card rounded-xl p-4 border border-border-default shadow-sm">
              <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
                Dicas para melhores resultados
              </p>
              <ul className="space-y-2">
                {info.map((message, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground-secondary">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!info && (
            <p className="text-sm text-foreground-muted max-w-md mx-auto">
              Isso pode significar que voce nao tem assinaturas ativas ou
              que os extratos enviados nao cobrem um periodo suficiente.
              Para melhores resultados, envie extratos do cartao de credito.
            </p>
          )}
        </div>
      )}

      {/* Botão de nova análise */}
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-elevated hover:bg-border-strong text-foreground-secondary font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Analisar outros extratos
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-foreground-faint pt-4 border-t border-border-default space-y-1">
        <p>
          Analise realizada em {new Date(metadata.processedAt).toLocaleString('pt-BR')}
          {' '}em {metadata.processingTimeMs}ms
        </p>
        <p>
          Seus arquivos foram processados e descartados. Nenhum dado foi armazenado.
        </p>
        <p className="font-medium">
          Esta analise e apenas informativa. Nem tudo aqui e 100% certeza.
          Verifique cada item antes de tomar qualquer decisao.
        </p>
      </div>
    </div>
  );
}
