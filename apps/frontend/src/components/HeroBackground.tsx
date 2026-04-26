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

const PALETTE = {
  light: ['#f8fafc', '#dcfce7', '#bbf7d0', '#22c55e'],
  dark: ['#020617', '#052e16', '#14532d', '#22c55e'],
} as const;

export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  if (reduceMotion) return <CssMeshFallback />;

  const palette = resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;
  return <ShaderMesh palette={palette} />;
}
