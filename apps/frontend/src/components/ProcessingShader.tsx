'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';

const Metaballs = dynamic(
  () => import('@paper-design/shaders-react').then((m) => ({ default: m.Metaballs })),
  { ssr: false, loading: () => null },
);

const PALETTE = {
  light: ['#22c55e', '#6ee7b7', '#d1d5db'],
  dark: ['#4ade80', '#34d399', '#374151'],
} as const;

interface Props {
  size?: number;
  className?: string;
}

// Renderiza um shader Metaballs circular durante o processamento.
// Quando reduced-motion estiver ativo, exibe um spinner SVG simples.
export function ProcessingShader({ size = 200, className }: Props) {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [tabVisible, setTabVisible] = useState(true);

  // Pausa o shader quando a tab fica inativa para economizar GPU/bateria.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (reduceMotion) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Processando"
      >
        <Loader2 className="w-full h-full text-brand animate-spin" />
      </div>
    );
  }

  const palette = resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
      }}
    >
      <Metaballs
        colors={[...palette]}
        colorBack="rgba(0,0,0,0)"
        speed={tabVisible ? 0.3 : 0}
        scale={1.2}
        count={6}
        size={0.55}
        minPixelRatio={1}
        maxPixelCount={400 * 400}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
