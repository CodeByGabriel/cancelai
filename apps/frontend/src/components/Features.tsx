'use client';

import { useRef, type MouseEvent } from 'react';
import { Shield, Zap, Eye, Trash2 } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Seguro',
    description: 'Seus dados nunca são armazenados. Processamos e descartamos imediatamente.',
  },
  {
    icon: Zap,
    title: 'Rápido',
    description: 'Análise em segundos. Resultados instantâneos na sua tela.',
  },
  {
    icon: Eye,
    title: 'Transparente',
    description: 'Mostramos exatamente o que encontramos e porquê identificamos como assinatura.',
  },
  {
    icon: Trash2,
    title: 'Sem rastros',
    description: 'Não criamos conta, não pedimos email. Zero dados pessoais coletados.',
  },
];

export function Features() {
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Cursor spotlight (Linear pattern). Atualiza CSS vars em cada card baseado
  // na posicao do mouse. Apenas em dispositivos com hover real.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = grid.querySelectorAll<HTMLElement>('[data-spotlight]');
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  };

  return (
    <div
      ref={gridRef}
      onMouseMove={handleMouseMove}
      className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto"
    >
      {features.map((feature, index) => (
        <div
          key={index}
          data-spotlight
          className="group spotlight-card relative overflow-hidden text-center p-6 rounded-2xl backdrop-blur-sm bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:-translate-y-1 hover:bg-white/70 dark:hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,240,220,0.06),0_8px_24px_-8px_rgba(0,0,0,0.25)] active:translate-y-0 transition-all duration-300 ease-out"
        >
          <div className="relative z-10 w-12 h-12 bg-brand-muted rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)] group-hover:text-green-400">
            <feature.icon className="w-6 h-6 text-brand-text" />
          </div>
          <h3 className="relative z-10 font-semibold text-foreground mb-1">{feature.title}</h3>
          <p className="relative z-10 text-sm text-foreground-muted">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
