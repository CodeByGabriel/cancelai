'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { CssMeshFallback } from './CssMeshFallback';

// ssr: false e obrigatorio — WebGL nao existe no server.
// Loading fallback evita flash branco durante o lazy-load do shader.
const ShaderMesh = dynamic(() => import('./ShaderMesh'), {
  ssr: false,
  loading: () => <CssMeshFallback />,
});

// Paleta warm-analoga (60deg do circulo cromatico). Cream/amber/mint produz
// interpolacao suave; complementares produzem marrom feio na zona de mistura.
const PALETTE = {
  light: ['#FAF7F2', '#FEF3C7', '#FDE68A', '#22c55e'],
  dark: ['#13110F', '#1C1815', '#2D1F0E', '#065F46'],
} as const;

export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  if (reduceMotion) return <CssMeshFallback />;

  const palette = resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;
  return <ShaderMesh palette={palette} />;
}
