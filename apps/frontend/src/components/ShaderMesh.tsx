'use client';

import { useEffect, useRef, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';

interface Props {
  palette: readonly string[];
  className?: string;
}

// Cap DPR para limitar custo de pixel shading.
// 1.0 cobre celular típico (Galaxy A15 já economiza muito), 1.5 dá melhor antialias em desktop.
function getCappedDpr(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 1.5);
}

export default function ShaderMesh({ palette, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [dpr, setDpr] = useState<number>(1);

  useEffect(() => {
    setDpr(getCappedDpr());
  }, []);

  // Pausa o shader quando o container sai do viewport. visibilitychange (tab) já é tratado
  // internamente pelo ShaderMount do paper-shaders.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Cap de pixels = ~2x a area de tela. Em DPR 1 (mobile) isso vira ~2M pixels.
  const maxPixelCount = 1920 * 1080 * 2;

  // Mascara dissolve o retangulo do shader nas bordas — sem isso a transicao
  // pro proximo bloco fica dura.
  const maskStyle: React.CSSProperties = {
    maskImage:
      'radial-gradient(ellipse 120% 100% at 50% 40%, black 40%, transparent 100%)',
    WebkitMaskImage:
      'radial-gradient(ellipse 120% 100% at 50% 40%, black 40%, transparent 100%)',
  };

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0, ...maskStyle }}
    >
      <MeshGradient
        colors={[...palette]}
        distortion={0.4}
        swirl={0.3}
        grainMixer={0.15}
        grainOverlay={0.08}
        speed={isVisible ? 0.03 : 0}
        minPixelRatio={dpr}
        maxPixelCount={maxPixelCount}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
