'use client';

import { useReducer, useCallback, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Header } from './Header';
import { FileUpload } from './FileUpload';
import { Results } from './Results';
import { Features } from './Features';
import { Footer } from './Footer';
import { AnalysisProgress } from './AnalysisProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { SubscriptionTags } from './SubscriptionTags';
import { PrivacyBadge } from './PrivacyBadge';
import { MethodSelector } from './MethodSelector';
import { BankConnect } from './BankConnect';
import { HeroBackground } from './HeroBackground';
import { SuccessConfetti } from './SuccessConfetti';
import { analyzeStatements, startStreamAnalysis } from '@/lib/api';
import { useSSEStream } from '@/lib/use-sse-stream';
import { ConnectionStatus } from './ConnectionStatus';
import type { AppState, AppAction, AnalysisResult, DetectedSubscription } from '@/types';
import { cn } from '@/lib/utils';

// ─── Reducer ───────────────────────────────────────────────────────
const INITIAL_STATE: AppState = { status: 'idle' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_UPLOAD':
      if (state.status !== 'idle' && state.status !== 'error') return state;
      return { status: 'uploading', files: action.files };

    case 'UPLOAD_COMPLETE':
      if (state.status !== 'uploading') return state;
      return {
        status: 'processing',
        files: state.files,
        jobId: action.jobId,
        streamUrl: action.streamUrl,
      };

    case 'START_BANK_CONNECTION':
      if (state.status !== 'idle' && state.status !== 'error') return state;
      return { status: 'connecting-bank' };

    case 'BANK_CONNECTED':
      if (state.status !== 'connecting-bank') return state;
      return { status: 'fetching-transactions', connectionId: action.connectionId, accountId: action.accountId };

    case 'OPEN_FINANCE_READY':
      if (state.status !== 'fetching-transactions' && state.status !== 'connecting-bank' && state.status !== 'idle' && state.status !== 'error') return state;
      return {
        status: 'processing',
        files: [],
        jobId: action.jobId,
        streamUrl: action.streamUrl,
      };

    case 'SSE_CONNECTED':
      if (state.status !== 'processing') return state;
      return {
        status: 'streaming',
        files: state.files,
        jobId: state.jobId,
        streamUrl: state.streamUrl,
        subscriptions: [],
        progressMessage: 'Conectado ao servidor...',
        currentStage: '',
        filesProcessed: [],
        startTime: Date.now(),
      };

    case 'SUBSCRIPTION_DETECTED':
      if (state.status !== 'streaming') return state;
      return {
        ...state,
        subscriptions: [...state.subscriptions, action.subscription],
      };

    case 'PROGRESS':
      if (state.status !== 'streaming') return state;
      return {
        ...state,
        currentStage: action.stage,
        progressMessage: action.message,
      };

    case 'FILE_PROCESSED':
      if (state.status !== 'streaming') return state;
      return {
        ...state,
        filesProcessed: [...state.filesProcessed, `${action.filename} (${action.bank})`],
      };

    case 'COMPLETE':
      if (state.status !== 'streaming' && state.status !== 'processing') return state;
      return {
        status: 'complete',
        result: action.result,
        durationMs: action.durationMs,
      };

    case 'ERROR':
      return {
        status: 'error',
        message: action.message,
        canRetry: action.canRetry,
      };

    case 'RESET':
      return INITIAL_STATE;

    case 'FALLBACK_COMPLETE':
      if (state.status !== 'uploading' && state.status !== 'processing') return state;
      return {
        status: 'complete',
        result: action.result,
        durationMs: 0,
      };

    default:
      return state;
  }
}

// ─── Stage messages ────────────────────────────────────────────────
function getStageMessage(stage: string): string {
  const messages: Record<string, string> = {
    'connecting-bank': 'Conectando ao banco...',
    'fetching-transactions': 'Obtendo transacoes bancarias...',
    validation: 'Validando arquivos...',
    parsing: 'Lendo transacoes dos extratos...',
    normalization: 'Normalizando dados...',
    grouping: 'Agrupando transacoes recorrentes...',
    scoring: 'Calculando scores de confianca...',
    sanity: 'Verificando consistencia...',
    'ai-classification': 'Classificando com IA...',
    cleanup: 'Finalizando analise...',
  };
  return messages[stage] || 'Processando...';
}

// ─── FAQ Item ──────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={open}
      >
        <h3 className="font-semibold text-foreground">{question}</h3>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground-faint transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-foreground-secondary">{answer}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────
export function HomeContent() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upload' | 'open-finance'>('upload');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── SSE stream URL (only set during processing) ──
  const streamUrl =
    state.status === 'processing' ? state.streamUrl :
    state.status === 'streaming' ? state.streamUrl :
    null;

  // ── SSE hook ──
  const { connectionStatus, reconnectAttempt, retry: retryConnection } = useSSEStream(streamUrl, {
    onStageStart(stage) {
      if (state.status === 'processing') {
        dispatch({ type: 'SSE_CONNECTED' });
      }
      dispatch({ type: 'PROGRESS', stage, message: getStageMessage(stage) });
    },
    onStageComplete(_stage, _durationMs, _summary) {},
    onSubscriptionDetected(subscription) {
      dispatch({ type: 'SUBSCRIPTION_DETECTED', subscription });
    },
    onProgress(stage, _current, _total, message) {
      dispatch({ type: 'PROGRESS', stage, message });
    },
    onFilePartial(filename, _transactionCount, bankDetected) {
      dispatch({ type: 'FILE_PROCESSED', filename, bank: bankDetected });
    },
    onFileError(filename, error) {
      console.warn(`File error: ${filename} - ${error}`);
    },
    onComplete(result, durationMs) {
      dispatch({ type: 'COMPLETE', result, durationMs });
    },
    onError(_code, message, _recoverable) {
      dispatch({ type: 'ERROR', message, canRetry: true });
    },
  });

  // ── Fallback to sync POST /api/analyze ──
  const fallbackToSync = useCallback(async (files: File[]) => {
    try {
      const response = await analyzeStatements(files);
      if (response.success && response.data) {
        dispatch({ type: 'FALLBACK_COMPLETE', result: response.data });
      } else {
        dispatch({
          type: 'ERROR',
          message: response.error?.message || 'Erro ao analisar os extratos',
          canRetry: true,
        });
      }
    } catch {
      dispatch({
        type: 'ERROR',
        message: 'Erro de conexao. Verifique sua internet e tente novamente.',
        canRetry: true,
      });
    }
  }, []);

  // ── Open Finance handlers ──
  const handleBankConnecting = useCallback(() => {
    dispatch({ type: 'START_BANK_CONNECTION' });
  }, []);

  const handleOpenFinanceAnalysisStarted = useCallback((jobId: string, streamUrl: string) => {
    dispatch({ type: 'OPEN_FINANCE_READY', jobId, streamUrl });
  }, []);

  const handleOpenFinanceError = useCallback((message: string) => {
    dispatch({ type: 'ERROR', message, canRetry: true });
  }, []);

  // ── File selection handler ──
  const handleFilesSelected = useCallback(async (files: File[]) => {
    dispatch({ type: 'START_UPLOAD', files });

    try {
      const response = await startStreamAnalysis(files);
      if (response.success && response.data) {
        dispatch({ type: 'UPLOAD_COMPLETE', jobId: response.data.jobId, streamUrl: response.data.streamUrl });
      } else {
        console.warn('SSE stream returned error, falling back to sync analysis');
        fallbackToSync(files);
      }
    } catch {
      console.warn('SSE stream unavailable, falling back to sync analysis');
      fallbackToSync(files);
    }
  }, [fallbackToSync]);

  // ── Logo click → reset analysis state (back to idle) ──
  const handleLogoReset = useCallback(() => {
    if (state.status === 'idle') return;
    dispatch({ type: 'RESET' });
  }, [state.status]);

  // ── Computed values for streaming view ──
  // Usa annualAmount (já considera o periodo detectado) e ignora low-confidence
  // para alinhar com o totalAnnualSpending exibido no resultado final.
  const totalAnnualSpending =
    state.status === 'streaming'
      ? state.subscriptions
          .filter((s) => s.confidence !== 'low')
          .reduce((sum, s) => sum + s.annualAmount, 0)
      : 0;

  // SSR placeholder
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-border-default bg-card/80 h-16" />
        <main className="flex-1">
          <section className="py-12 sm:py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="h-14 bg-elevated rounded-lg mb-6 animate-pulse" />
              <div className="h-6 bg-elevated rounded-lg max-w-2xl mx-auto mb-8 animate-pulse" />
            </div>
          </section>
        </main>
        <div className="border-t border-border-default bg-card h-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onReset={handleLogoReset} />

      <main
        className="flex-1"
        aria-live="polite"
        aria-busy={state.status === 'uploading' || state.status === 'processing' || state.status === 'streaming' || state.status === 'connecting-bank' || state.status === 'fetching-transactions'}
      >
        <AnimatePresence mode="wait">
          {/* ── IDLE ── */}
          {(state.status === 'idle' || state.status === 'error') && (
            <m.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero com shader de fundo */}
              <section className="relative overflow-hidden py-20 md:py-32 px-4 min-h-[60vh]">
                <HeroBackground />
                {/* Overlay para legibilidade do texto sobre o shader */}
                <div className="absolute inset-0 bg-white/55 dark:bg-black/55 z-[1]" aria-hidden="true" />
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted mb-4">Privacidade-first · LGPD-ready</p>
                  <h1 className="font-display text-5xl md:text-7xl font-semibold text-foreground mb-6 tracking-tight leading-tight">
                    Descubra assinaturas
                    <em className="text-brand-text not-italic font-display italic block sm:inline"> esquecidas</em>
                  </h1>
                  <p className="text-lg md:text-xl text-foreground-secondary max-w-2xl mx-auto mb-12">
                    Envie seus extratos bancarios e descubra quanto voce gasta com
                    assinaturas que talvez nem lembre mais.
                  </p>

                  <div className="flex justify-center gap-8 md:gap-12">
                    {[
                      { value: '15+', label: 'Bancos suportados' },
                      { value: '500+', label: 'Servicos conhecidos' },
                      { value: '0', label: 'Dados armazenados' },
                    ].map(({ value, label }) => (
                      <div
                        key={label}
                        className="text-center cursor-default transition-all duration-300 hover:text-brand dark:hover:text-brand hover:drop-shadow-[0_0_8px_rgba(196,98,63,0.4)]"
                      >
                        <p className="text-3xl md:text-4xl font-bold text-foreground">{value}</p>
                        <p className="text-xs uppercase tracking-widest text-foreground-muted mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Method selector + Upload/Connect */}
              <section className="py-8 px-4">
                <MethodSelector onMethodChange={setSelectedMethod} />

                {selectedMethod === 'upload' ? (
                  <>
                    <FileUpload
                      onFilesSelected={handleFilesSelected}
                      status={state.status === 'error' ? 'error' : 'idle'}
                      error={state.status === 'error' ? state.message : undefined}
                    />
                    <PrivacyBadge variant="inline" />
                  </>
                ) : (
                  <BankConnect
                    onAnalysisStarted={handleOpenFinanceAnalysisStarted}
                    onConnecting={handleBankConnecting}
                    onError={handleOpenFinanceError}
                    status={state.status === 'error' ? 'error' : 'idle'}
                    error={state.status === 'error' ? state.message : undefined}
                  />
                )}
              </section>

              {/* Features */}
              <section className="py-16 px-4 bg-surface transition-colors">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground text-center mb-8">
                    Por que usar o Cancel<span className="text-brand-text">aí</span>?
                  </h2>
                  <Features />
                </div>
              </section>

              {/* Como funciona */}
              <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground text-center mb-12">
                    Como funciona?
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-8">
                    {[
                      { step: 1, title: 'Envie seus extratos', desc: 'Faca upload dos extratos bancarios dos ultimos 2-3 meses em PDF ou CSV.' },
                      { step: 2, title: 'Analise automatica', desc: 'Algoritmos identificam padroes de cobranca recorrente. Isso leva de 10 a 30 segundos.' },
                      { step: 3, title: 'Revise e economize', desc: 'Veja as assinaturas detectadas, revise os resultados e descubra como cancelar.' },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="text-center">
                        <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                          {step}
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                        <p className="text-sm text-foreground-muted">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section className="py-16 px-4 bg-surface transition-colors">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-foreground text-center mb-12">
                    Perguntas frequentes
                  </h2>
                  <div className="space-y-4">
                    <FaqItem
                      question="Meus dados estao seguros?"
                      answer="Sim! Seus arquivos sao processados em memoria e descartados imediatamente apos a analise. Nao armazenamos nenhum dado, nao criamos conta e nao pedimos informacoes pessoais."
                    />
                    <FaqItem
                      question="Quais bancos sao suportados?"
                      answer="Suportamos 15+ bancos brasileiros: Nubank, Itau, Bradesco, Banco do Brasil, Caixa, Inter, Santander, C6 Bank, PicPay, Neon, Original, Next, Sofisa, Agibank, Sicoob, Sicredi, BTG Pactual e XP. Tambem processamos CSVs de outros bancos em formato generico."
                    />
                    <FaqItem
                      question="O Cancelai cancela minhas assinaturas?"
                      answer="Nao. O Cancelai apenas identifica e lista suas assinaturas. O cancelamento deve ser feito por voce, diretamente com cada servico. Fornecemos links e instrucoes quando disponiveis."
                    />
                    <FaqItem
                      question="E gratuito?"
                      answer="Sim, o Cancelai e 100% gratuito. Nosso objetivo e ajudar brasileiros a terem mais controle sobre seus gastos recorrentes."
                    />
                  </div>
                </div>
              </section>
            </m.div>
          )}

          {/* ── UPLOADING / PROCESSING / CONNECTING (pre-SSE) ── */}
          {(state.status === 'uploading' || state.status === 'processing' || state.status === 'connecting-bank' || state.status === 'fetching-transactions') && (
            <m.div
              key="uploading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="py-16 px-4"
            >
              <AnalysisProgress
                currentStage=""
                progressMessage={
                  state.status === 'connecting-bank' ? 'Conectando ao banco...' :
                  state.status === 'fetching-transactions' ? 'Obtendo transacoes bancarias...' :
                  'Enviando arquivos para analise...'
                }
                filesProcessed={[]}
                subscriptionsFound={0}
                startTime={Date.now()}
              />
              <div className="flex justify-center mt-3">
                <ConnectionStatus
                  status={connectionStatus}
                  reconnectAttempt={reconnectAttempt}
                  onRetry={retryConnection}
                />
              </div>
              <PrivacyBadge variant="inline" />
            </m.div>
          )}

          {/* ── STREAMING (live discovery) ── */}
          {state.status === 'streaming' && (
            <m.div
              key="streaming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="py-8 px-4"
            >
              <AnalysisProgress
                currentStage={state.currentStage}
                progressMessage={state.progressMessage}
                filesProcessed={state.filesProcessed}
                subscriptionsFound={state.subscriptions.length}
                startTime={state.startTime}
              />
              <div className="flex justify-center mt-3">
                <ConnectionStatus
                  status={connectionStatus}
                  reconnectAttempt={reconnectAttempt}
                  onRetry={retryConnection}
                />
              </div>

              {/* Live counter */}
              {state.subscriptions.length > 0 && (
                <div className="text-center my-8">
                  <p className="text-sm text-foreground-muted mb-2">Gasto anual estimado</p>
                  <AnimatedCounter
                    value={totalAnnualSpending}
                    className="text-brand-text"
                  />
                </div>
              )}

              {/* Live subscription tags */}
              {state.subscriptions.length > 0 && (
                <div className="max-w-2xl mx-auto my-6">
                  <SubscriptionTags subscriptions={state.subscriptions} />
                </div>
              )}

              <PrivacyBadge variant="floating" />
            </m.div>
          )}

          {/* ── COMPLETE ── */}
          {state.status === 'complete' && (
            <m.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="py-8 px-4"
            >
              <SuccessConfetti
                trigger
                annualSavings={state.result.summary.totalAnnualSpending ?? 0}
              />
              <Results
                result={state.result}
                onReset={() => dispatch({ type: 'RESET' })}
              />
            </m.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
