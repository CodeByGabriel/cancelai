'use client';

import { useState } from 'react';
import { m } from 'motion/react';
import { Share2, Copy, Check } from 'lucide-react';
import type { DetectedSubscription } from '@/types';
import { cn, formatCurrency, getCategoryIcon } from '@/lib/utils';

interface Props {
  subscriptions: readonly DetectedSubscription[];
  totalMonthly: number;
  totalAnnual: number;
}

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

// Recibo viral — Spotify Wrapped pra financas. Bg creme, dashed, font-mono.
// Drama vem do reveal stagger, NAO de counter animado no numero.
export function ReciboResultado({ subscriptions, totalMonthly, totalAnnual }: Props) {
  const [copied, setCopied] = useState(false);

  // Filtra so high+medium confidence pro recibo (nao polui com low)
  const displayed = subscriptions
    .filter((s) => s.confidence !== 'low')
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const handleShare = async () => {
    const shareText = `Descobri que perco ${formatCurrency(totalAnnual)}/ano em assinaturas esquecidas. Veja seu recibo no Cancelaí 👀`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cancelai.com.br';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Recibo do Dinheiro Esquecido — Cancelaí', text: shareText, url: shareUrl });
        return;
      } catch {
        // usuario cancelou — cai no fallback de clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: REVEAL_EASE }}
      className={cn(
        'relative max-w-md mx-auto p-6 md:p-8 rounded-md',
        'bg-[#FDFBF7] dark:bg-[#1C1815]',
        'text-[#2D1F0E] dark:text-[#E8E3DC]',
        'shadow-2xl border-y-2 border-dashed border-[#8B7355]/30 dark:border-[#FED7AA]/15',
        'font-mono',
      )}
    >
      {/* Noise texture sutil */}
      <div className="noise-overlay" style={{ opacity: 0.03 }} aria-hidden="true" />

      <div className="relative z-10">
        {/* Cabecalho do recibo */}
        <div className="text-center mb-4">
          <p className="text-[10px] tracking-[0.3em] text-[#8B7355] dark:text-[#FED7AA]/60 mb-1">
            ✄ — — — — — — — — — — —
          </p>
          <h2 className="text-xs uppercase tracking-[0.3em] font-semibold">
            Recibo do Dinheiro Esquecido
          </h2>
        </div>

        {/* Linha separadora */}
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: REVEAL_EASE }}
          className="border-t-2 border-dashed border-[#8B7355]/30 dark:border-[#FED7AA]/15 my-4 origin-left"
          aria-hidden="true"
        />

        {/* Total ANUAL — heroi do recibo */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: REVEAL_EASE }}
          className="text-center mb-6"
        >
          <p className="font-mono tabular-nums slashed-zero text-3xl md:text-5xl font-semibold text-emerald-700 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.25)]">
            {formatCurrency(totalAnnual)}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8B7355] dark:text-[#FED7AA]/50 mt-1">
            por ano em assinaturas esquecidas
          </p>
        </m.div>

        <div className="border-t border-dashed border-[#8B7355]/30 dark:border-[#FED7AA]/15 my-4" aria-hidden="true" />

        {/* Linhas de assinaturas — stagger reveal */}
        <ul className="space-y-2 text-sm">
          {displayed.map((sub, i) => (
            <m.li
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.4, ease: REVEAL_EASE }}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="flex items-center gap-2 truncate">
                <span aria-hidden="true">{getCategoryIcon(sub.category)}</span>
                <span className="truncate">{sub.name}</span>
              </span>
              <span className="tabular-nums whitespace-nowrap text-[#5A4A3F] dark:text-[#FED7AA]/70">
                {formatCurrency(sub.monthlyAmount)}/mês
              </span>
            </m.li>
          ))}
        </ul>

        <div className="border-t border-dashed border-[#8B7355]/30 dark:border-[#FED7AA]/15 my-4" aria-hidden="true" />

        {/* Totais — destaque no anual */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 + displayed.length * 0.08 + 0.1, duration: 0.4 }}
          className="space-y-1 text-sm"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[#5A4A3F] dark:text-[#FED7AA]/70">Total mensal:</span>
            <span className="tabular-nums">{formatCurrency(totalMonthly)}</span>
          </div>
          <div className="flex items-baseline justify-between font-semibold">
            <span>Total anual:</span>
            <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalAnnual)}
            </span>
          </div>
        </m.div>

        {/* Watermark */}
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 + displayed.length * 0.08 + 0.3, duration: 0.4 }}
          className="text-center text-[9px] tracking-[0.25em] uppercase mt-6 text-[#8B7355]/70 dark:text-[#FED7AA]/40"
        >
          Analisado por Cancelaí · {new Date().toLocaleDateString('pt-BR')}
        </m.p>

        <p className="text-center text-[10px] tracking-[0.3em] text-[#8B7355] dark:text-[#FED7AA]/60 mt-2">
          ✄ — — — — — — — — — — —
        </p>

        {/* Share button */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + displayed.length * 0.08 + 0.4, duration: 0.4, ease: REVEAL_EASE }}
          className="mt-6 flex justify-center"
        >
          <button
            type="button"
            onClick={handleShare}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider',
              'bg-[#2D1F0E] text-[#FDFBF7] dark:bg-[#FED7AA] dark:text-[#1C1815]',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
              'shadow-[0_0_20px_rgba(34,197,94,0.2),0_0_60px_rgba(34,197,94,0.08)]',
            )}
            aria-label="Compartilhar este recibo"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Link copiado!
              </>
            ) : (
              <>
                {typeof navigator !== 'undefined' && 'share' in navigator ? (
                  <Share2 className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Compartilhar este recibo
              </>
            )}
          </button>
        </m.div>
      </div>
    </m.div>
  );
}
