'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

interface Props {
  trigger: boolean;
  annualSavings: number;
}

// Dispara confetti UMA vez quando trigger vira true e a economia for relevante
// (>= R$100/ano). canvas-confetti tem disableForReducedMotion built-in, mas
// também filtramos via useReducedMotion como dupla defesa.
export function SuccessConfetti({ trigger, annualSavings }: Props) {
  const reduceMotion = useReducedMotion();
  const fired = useRef(false);

  useEffect(() => {
    if (!trigger) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    if (reduceMotion) return;
    if (annualSavings < 100) return;

    fired.current = true;

    // Import dinâmico para o canvas-confetti não entrar no chunk inicial.
    void import('canvas-confetti').then(({ default: confetti }) => {
      const particleCount = annualSavings > 500 ? 150 : 80;
      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
        disableForReducedMotion: true,
      });
    });
  }, [trigger, annualSavings, reduceMotion]);

  return null;
}
