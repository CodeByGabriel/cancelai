'use client';

import type { ReactNode } from 'react';
import { m } from 'motion/react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

// Wrapper que faz fade + slide-up apenas uma vez quando entra no viewport.
// Usado nas seções da home pra evitar carga visual de tudo aparecer junto.
export function RevealSection({ children, className, delay = 0 }: Props) {
  return (
    <m.section
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: REVEAL_EASE, delay }}
    >
      {children}
    </m.section>
  );
}
