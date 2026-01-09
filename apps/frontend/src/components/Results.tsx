'use client';

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

  // Separa assinaturas confirmadas (alta confiança) das que precisam revisão
  const confirmedSubscriptions = subscriptions.filter(
    (s) => s.confidence === 'high'
  );
  const needsReviewSubscriptions = subscriptions.filter(
    (s) => s.confidence === 'medium' || s.confidence === 'low'
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {hasSubscriptions
            ? 'Encontramos suas assinaturas!'
            : 'Nenhuma assinatura encontrada'}
        </h2>
        <p className="text-gray-500">
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
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Assinaturas confirmadas
                </h3>
                <span className="text-sm text-gray-500">
                  ({confirmedSubscriptions.length})
                </span>
              </div>
              <p className="text-sm text-gray-500 -mt-2">
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
                <HelpCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Pode precisar de revisao
                </h3>
                <span className="text-sm text-gray-500">
                  ({needsReviewSubscriptions.length})
                </span>
              </div>

              {/* Aviso explicativo */}
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Nem tudo aqui e 100% certeza
                  </p>
                  <p className="text-yellow-700 mt-1">
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
        <div className="text-center py-12 bg-gradient-to-b from-green-50 to-white rounded-3xl border border-green-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Boa noticia!
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Nao encontramos assinaturas recorrentes nesse periodo.
          </p>

          {/* Mensagens informativas do backend */}
          {info && info.length > 0 && (
            <div className="max-w-md mx-auto space-y-2 text-left bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Dicas para melhores resultados
              </p>
              <ul className="space-y-2">
                {info.map((message, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!info && (
            <p className="text-sm text-gray-500 max-w-md mx-auto">
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Analisar outros extratos
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100 space-y-1">
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
