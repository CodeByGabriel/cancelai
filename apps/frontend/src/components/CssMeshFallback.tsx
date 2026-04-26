'use client';

interface Props {
  className?: string;
}

// Fallback CSS puro. Renderizado durante o lazy-load do shader e permanentemente
// para usuários com prefers-reduced-motion. A animação @keyframes drift está em
// globals.css e é desativada por motion-reduce:animate-none.
export function CssMeshFallback({ className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`shader-css-fallback motion-reduce:animate-none ${className ?? ''}`}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
}
