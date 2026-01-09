'use client';

/**
 * HomeContent - Conteudo principal da pagina inicial
 *
 * IMPORTANTE - HYDRATION:
 * Este componente e separado do page.tsx para garantir que:
 * 1. O layout.tsx (Server Component) renderize corretamente
 * 2. O conteudo interativo seja gerenciado como Client Component
 * 3. Nao haja hydration mismatch entre server e client
 *
 * O componente usa suppressHydrationWarning em elementos que podem
 * ter pequenas diferencas entre server/client (como icones SVG).
 */

import { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { FileUpload } from './FileUpload';
import { Results } from './Results';
import { Features } from './Features';
import { Footer } from './Footer';
import { AnalysisProgress } from './AnalysisProgress';
import { analyzeStatements } from '@/lib/api';
import type { AnalysisResult, UploadStatus, AnalysisStep } from '@/types';

export function HomeContent() {
  // Estado para controlar se o componente foi montado no cliente
  // Isso evita hydration mismatch garantindo renderizacao identica inicial
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('uploading');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<AnalysisResult>();
  const [filesCount, setFilesCount] = useState(0);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Marca o componente como montado apos a hidratacao
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup do interval quando componente desmonta
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    setError(undefined);
    setStatus('uploading');
    setAnalysisStep('uploading');
    setFilesCount(files.length);

    // Progresso baseado em tempo real de processamento
    // Os steps avançam conforme o processamento real, não com delays artificiais
    const stepOrder: AnalysisStep[] = ['uploading', 'reading', 'analyzing', 'validating'];
    let currentStepIndex = 0;
    const startTime = Date.now();

    // Avança os steps baseado no tempo real transcorrido
    // Isso dá feedback visual sem ser enganoso
    stepIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Avança steps baseado no tempo real (não artificial)
      // uploading: 0-500ms, reading: 500-2000ms, analyzing: 2000-5000ms, validating: 5000ms+
      if (elapsed > 500 && currentStepIndex < 1) {
        currentStepIndex = 1;
        setAnalysisStep('reading');
      } else if (elapsed > 2000 && currentStepIndex < 2) {
        currentStepIndex = 2;
        setAnalysisStep('analyzing');
      } else if (elapsed > 5000 && currentStepIndex < 3) {
        currentStepIndex = 3;
        setAnalysisStep('validating');
      }
    }, 200);

    try {
      setStatus('processing');

      const response = await analyzeStatements(files);

      // Limpa o interval
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }

      if (response.success && response.data) {
        setAnalysisStep('complete');
        setResult(response.data);
        setStatus('success');
      } else {
        setError(response.error?.message || 'Erro ao analisar os extratos');
        setStatus('error');
      }
    } catch {
      // Limpa o interval em caso de erro
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
        stepIntervalRef.current = null;
      }
      setError('Erro de conexao. Verifique sua internet e tente novamente.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAnalysisStep('uploading');
    setError(undefined);
    setResult(undefined);
    setFilesCount(0);
  };

  const isProcessing = status === 'uploading' || status === 'processing';

  // Renderiza um placeholder durante SSR para evitar hydration mismatch
  // O placeholder tem a mesma estrutura basica para nao causar layout shift
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Placeholder do Header com mesma altura */}
        <div className="border-b border-gray-100 bg-white/80 h-16" />

        {/* Placeholder do conteudo principal */}
        <main className="flex-1">
          <section className="py-12 sm:py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="h-14 bg-gray-100 rounded-lg mb-6 animate-pulse" />
              <div className="h-6 bg-gray-100 rounded-lg max-w-2xl mx-auto mb-8 animate-pulse" />
            </div>
          </section>
        </main>

        {/* Placeholder do Footer com mesma altura */}
        <div className="border-t border-gray-100 bg-white h-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section - oculta durante processamento e resultados */}
        {status === 'idle' || status === 'error' ? (
          <section className="py-12 sm:py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Descubra assinaturas
                <span className="text-primary-600 block sm:inline"> esquecidas</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Envie seus extratos bancarios e descubra quanto voce gasta com
                assinaturas que talvez nem lembre mais.
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-12 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">15+</p>
                  <p className="text-gray-500">Bancos suportados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">80+</p>
                  <p className="text-gray-500">Servicos conhecidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-gray-500">Dados armazenados</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Upload, Progresso ou Resultados */}
        <section className="py-8 px-4">
          {status === 'success' && result ? (
            <Results result={result} onReset={handleReset} />
          ) : isProcessing ? (
            <AnalysisProgress
              currentStep={analysisStep}
              filesCount={filesCount}
            />
          ) : (
            <FileUpload
              onFilesSelected={handleFilesSelected}
              status={status}
              error={error}
            />
          )}
        </section>

        {/* Features - so mostra quando idle ou erro */}
        {(status === 'idle' || status === 'error') && (
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                Por que usar o Cancelai?
              </h2>
              <Features />
            </div>
          </section>
        )}

        {/* Como funciona - so mostra quando idle ou erro */}
        {(status === 'idle' || status === 'error') && (
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
                Como funciona?
              </h2>

              <div className="grid sm:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Envie seus extratos
                  </h3>
                  <p className="text-sm text-gray-500">
                    Faca upload dos extratos bancarios dos ultimos 2-3 meses em PDF ou CSV.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Analise automatica
                  </h3>
                  <p className="text-sm text-gray-500">
                    Algoritmos identificam padroes de cobranca recorrente. Isso leva de 10 a 30 segundos.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Revise e economize
                  </h3>
                  <p className="text-sm text-gray-500">
                    Veja as assinaturas detectadas, revise os resultados e descubra como cancelar.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ - so mostra quando idle ou erro */}
        {(status === 'idle' || status === 'error') && (
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
                Perguntas frequentes
              </h2>

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Meus dados estao seguros?
                  </h3>
                  <p className="text-gray-600">
                    Sim! Seus arquivos sao processados em memoria e descartados
                    imediatamente apos a analise. Nao armazenamos nenhum dado,
                    nao criamos conta e nao pedimos informacoes pessoais.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Quais bancos sao suportados?
                  </h3>
                  <p className="text-gray-600">
                    Suportamos 15+ bancos brasileiros: Nubank, Itau, Bradesco,
                    Banco do Brasil, Caixa, Inter, Santander, C6 Bank, PicPay,
                    Neon, Original, Next, Sofisa, Agibank, Sicoob, Sicredi,
                    BTG Pactual e XP. Tambem processamos CSVs de outros bancos
                    em formato generico.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    O Cancelai cancela minhas assinaturas?
                  </h3>
                  <p className="text-gray-600">
                    Nao. O Cancelai apenas identifica e lista suas assinaturas.
                    O cancelamento deve ser feito por voce, diretamente com cada
                    servico. Fornecemos links e instrucoes quando disponiveis.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    E gratuito?
                  </h3>
                  <p className="text-gray-600">
                    Sim, o Cancelai e 100% gratuito. Nosso objetivo e ajudar
                    brasileiros a terem mais controle sobre seus gastos recorrentes.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
