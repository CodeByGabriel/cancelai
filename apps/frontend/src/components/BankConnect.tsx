'use client';

import { useState, useCallback, useEffect } from 'react';
import { m } from 'motion/react';
import { Landmark, Shield, Loader2, Unplug, Calendar } from 'lucide-react';
import {
  createOpenFinanceLink,
  getOpenFinanceAccounts,
  startOpenFinanceAnalysis,
  revokeOpenFinanceConnection,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface BankConnectProps {
  onAnalysisStarted: (jobId: string, streamUrl: string) => void;
  onConnecting: () => void;
  onError: (message: string) => void;
  status: 'idle' | 'connecting' | 'connected' | 'analyzing' | 'error';
  error?: string;
}

const SUPPORTED_BANKS = [
  'Nubank', 'Itau', 'Bradesco', 'Banco do Brasil',
  'Caixa', 'Inter', 'Santander', 'C6 Bank',
];

const PERIOD_OPTIONS = [
  { label: '1 mes', months: 1 },
  { label: '2 meses', months: 2 },
  { label: '3 meses', months: 3 },
];

export function BankConnect({ onAnalysisStarted, onConnecting, onError, status, error }: BankConnectProps) {
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: string; subtype: string; number: string }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    onConnecting();
    setIsLoading(true);

    try {
      const linkResponse = await createOpenFinanceLink();
      if (!linkResponse.success || !linkResponse.data) {
        onError(linkResponse.error?.message ?? 'Erro ao criar link de conexao');
        return;
      }

      // TODO: Integrate Pluggy Connect widget here
      // PluggyConnect.init({ connectToken: linkResponse.data.accessToken, onSuccess: (data) => { ... } })
      onError('Pluggy Connect widget nao integrado ainda. Configure AGGREGATOR_CLIENT_ID e AGGREGATOR_CLIENT_SECRET e integre o widget @pluggy/react.');
    } catch {
      onError('Erro ao conectar com o banco. Tente o upload manual de extrato.');
    } finally {
      setIsLoading(false);
    }
  }, [onConnecting, onError]);

  const handleBankConnected = useCallback(async (itemId: string) => {
    setConnectionId(itemId);
    setIsLoading(true);

    try {
      const accountsResponse = await getOpenFinanceAccounts(itemId);
      if (accountsResponse.success && accountsResponse.data) {
        setAccounts(accountsResponse.data.accounts);
        if (accountsResponse.data.accounts.length > 0) {
          setSelectedAccountId(accountsResponse.data.accounts[0]!.id);
        }
      } else {
        onError('Erro ao buscar contas bancarias');
      }
    } catch {
      onError('Erro ao buscar contas do banco');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoading(true);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - selectedPeriod);

    try {
      const response = await startOpenFinanceAnalysis(
        selectedAccountId,
        dateFrom.toISOString().split('T')[0]!,
        dateTo.toISOString().split('T')[0]!,
      );

      if (response.success && response.data) {
        onAnalysisStarted(response.data.jobId, response.data.streamUrl);
      } else {
        onError(response.error?.message ?? 'Erro ao iniciar analise');
      }
    } catch {
      onError('Erro ao analisar transacoes. Tente o upload manual de extrato.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, selectedPeriod, onAnalysisStarted, onError]);

  const handleDisconnect = useCallback(async () => {
    if (!connectionId) return;

    try {
      await revokeOpenFinanceConnection(connectionId);
      setConnectionId(null);
      setAccounts([]);
      setSelectedAccountId(null);
    } catch {
      console.error('Erro ao desconectar banco');
    }
  }, [connectionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__pluggyCallback = handleBankConnected;
    return () => {
      delete window.__pluggyCallback;
    };
  }, [handleBankConnected]);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-xl mx-auto"
    >
      <div className="bg-card rounded-2xl shadow-lg border border-border-default p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8 text-brand" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">
            Conecte seu banco
          </p>
          <p className="text-sm text-foreground-muted">
            Acesse suas transacoes diretamente via Open Finance Brasil
          </p>
        </div>

        {/* Connected state: show accounts and analyze */}
        {connectionId && accounts.length > 0 ? (
          <div className="space-y-4">
            {/* Account selector */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Conta
              </label>
              <select
                value={selectedAccountId ?? ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-elevated border border-border-default rounded-lg px-3 py-2 text-foreground text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.subtype}) - ****{account.number.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Period selector */}
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Periodo
              </label>
              <div className="flex gap-2">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.months}
                    onClick={() => setSelectedPeriod(option.months)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                      selectedPeriod === option.months
                        ? 'bg-brand text-white'
                        : 'bg-elevated text-foreground-muted hover:text-foreground-secondary'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !selectedAccountId}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </span>
              ) : (
                'Analisar transacoes'
              )}
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full py-2 text-sm text-foreground-muted hover:text-red-500 transition-colors flex items-center justify-center gap-1"
            >
              <Unplug className="w-3.5 h-3.5" />
              Desconectar banco
            </button>
          </div>
        ) : (
          <>
            {/* Supported banks */}
            <div className="mb-6">
              <p className="text-xs text-foreground-muted mb-3 text-center">Bancos suportados</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUPPORTED_BANKS.map((bank) => (
                  <span
                    key={bank}
                    className="px-3 py-1 bg-elevated rounded-full text-xs text-foreground-secondary"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={isLoading || status === 'connecting'}
              className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {isLoading || status === 'connecting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </span>
              ) : (
                'Conectar meu banco'
              )}
            </button>

            {/* Error message */}
            {error && (
              <p className="mt-3 text-sm text-red-500 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            {/* Privacy badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground-muted">
              <Shield className="w-3.5 h-3.5" />
              <span>Protegido pelo Open Finance Brasil (BCB). Voce pode revogar o acesso a qualquer momento.</span>
            </div>
          </>
        )}
      </div>
    </m.div>
  );
}
