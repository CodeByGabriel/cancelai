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
  light: ['#FBF6F0', '#F4D6C5', '#FBEACB', '#C4623F'],
  dark: ['#1A130E', '#3A2A1F', '#5A2918', '#C4623F'],
} as const;

export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  if (reduceMotion) return <CssMeshFallback />;

  const palette = resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;
  return <ShaderMesh palette={palette} />;
}
