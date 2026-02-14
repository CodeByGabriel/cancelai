'use client';

import { Lock } from 'lucide-react';
import { m } from 'motion/react';

interface PrivacyBadgeProps {
  variant?: 'inline' | 'floating';
}

export function PrivacyBadge({ variant = 'inline' }: PrivacyBadgeProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.7 }}
      transition={{ duration: 0.3 }}
      className={`
        flex items-center justify-center gap-1.5
        text-sm text-foreground-muted
        hover:opacity-100 transition-opacity
        ${variant === 'floating' ? 'py-3' : 'mt-6'}
      `}
    >
      <Lock className="w-3.5 h-3.5 text-brand" />
      <span>Nenhum dado armazenado</span>
    </m.div>
  );
}
