'use client';

import {
  CreditCard,
  Calendar,
  TrendingUp,
  FileCheck,
  Clock,
  Building,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import type { AnalysisSummary, AnalysisMetadata } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface ResultsSummaryProps {
  summary: AnalysisSummary;
  metadata: AnalysisMetadata;
}

export function ResultsSummary({ summary, metadata }: ResultsSummaryProps) {
  // Calcular impacto em 5 anos
  const fiveYearImpact = summary.totalAnnualSpending * 5;

  return (
    <div className="space-y-6">
      {/* Hero Card - Impacto Financeiro Principal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-500/25">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wide opacity-90">
              Impacto Financeiro Anual
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-5xl sm:text-6xl font-bold tracking-tight">
                {formatCurrency(summary.totalAnnualSpending)}
              </p>
              <p className="text-lg mt-2 opacity-90">
                em assinaturas detectadas por ano
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>
                  Em 5 anos: <strong className="text-white">{formatCurrency(fiveYearImpact)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>
                  Média mensal: <strong className="text-white">{formatCurrency(summary.totalMonthlySpending)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Assinaturas Detectadas */}
        <div className="bg-card rounded-2xl p-4 border border-border-strong shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-foreground-muted">
            <FileCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Assinaturas</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {summary.subscriptionCount}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <span className={cn(
              "text-xs font-medium flex items-center gap-1",
              summary.highConfidenceCount > 0 ? "text-green-600 dark:text-green-400" : "text-foreground-faint"
            )}>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {summary.highConfidenceCount} certas
            </span>
            <span className={cn(
              "text-xs font-medium flex items-center gap-1",
              summary.mediumConfidenceCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-foreground-faint"
            )}>
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {summary.mediumConfidenceCount} prováveis
            </span>
            {summary.lowConfidenceCount > 0 && (
              <span className="text-xs font-medium flex items-center gap-1 text-foreground-muted">
                <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />
                {summary.lowConfidenceCount} incertas
              </span>
            )}
          </div>
        </div>

        {/* Transações Analisadas */}
        <div className="bg-card rounded-2xl p-4 border border-border-strong shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-foreground-muted">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Transações</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {summary.transactionsAnalyzed.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-foreground-muted mt-2">
            analisadas em {metadata.processingTimeMs}ms
          </p>
        </div>

        {/* Período Analisado */}
        <div className="bg-card rounded-2xl p-4 border border-border-strong shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-foreground-muted">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Período</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(summary.periodStart)}
          </p>
          <p className="text-sm text-foreground-muted flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            até {formatDate(summary.periodEnd)}
          </p>
        </div>

        {/* Bancos Detectados */}
        <div className="bg-card rounded-2xl p-4 border border-border-strong shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-foreground-muted">
            <Building className="w-4 h-4" />
            <span className="text-sm font-medium">Fontes</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {metadata.bankFormatsDetected.length > 0 ? (
              metadata.bankFormatsDetected.map((bank, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-brand-soft text-brand-text rounded-lg font-medium"
                >
                  {bank}
                </span>
              ))
            ) : (
              <span className="text-xs text-foreground-faint">
                {metadata.filesProcessed} arquivo(s)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
