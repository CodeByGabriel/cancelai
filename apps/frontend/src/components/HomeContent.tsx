'use client';

import { useReducer, useCallback, useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { Header } from './Header';
import { FileUpload } from './FileUpload';
import { Results } from './Results';
import { Features } from './Features';
import { Footer } from './Footer';
import { AnalysisProgress } from './AnalysisProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { SubscriptionTags } from './SubscriptionTags';
import { PrivacyBadge } from './PrivacyBadge';
import { analyzeStatements, startStreamAnalysis } from '@/lib/api';
import { useSSEStream } from '@/lib/use-sse-stream';
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
    <div className="bg-card rounded-xl shadow-sm overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={open}
      >
        <h3 className="font-semibold text-foreground">{question}</h3>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground-faint transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── SSE stream URL (only set during processing) ──
  const streamUrl =
    state.status === 'processing' ? state.streamUrl :
    state.status === 'streaming' ? state.streamUrl :
    null;

  // ── SSE hook ──
  useSSEStream(streamUrl, {
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

  // ── Computed values for streaming view ──
  const totalAnnualSpending =
    state.status === 'streaming'
      ? state.subscriptions.reduce((sum, s) => sum + s.monthlyAmount * 12, 0)
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
      <Header />

      <main className="flex-1">
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
              {/* Hero */}
              <section className="py-12 sm:py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                    Descubra assinaturas
                    <span className="text-brand-text block sm:inline"> esquecidas</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto mb-8">
                    Envie seus extratos bancarios e descubra quanto voce gasta com
                    assinaturas que talvez nem lembre mais.
                  </p>

                  <div className="flex justify-center gap-8 mb-12 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">15+</p>
                      <p className="text-foreground-muted">Bancos suportados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">350+</p>
                      <p className="text-foreground-muted">Servicos conhecidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-foreground-muted">Dados armazenados</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Upload */}
              <section className="py-8 px-4">
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  status={state.status === 'error' ? 'error' : 'idle'}
                  error={state.status === 'error' ? state.message : undefined}
                />
                <PrivacyBadge variant="inline" />
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

          {/* ── UPLOADING / PROCESSING (pre-SSE) ── */}
          {(state.status === 'uploading' || state.status === 'processing') && (
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
                progressMessage="Enviando arquivos para analise..."
                filesProcessed={[]}
                subscriptionsFound={0}
                startTime={Date.now()}
              />
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
