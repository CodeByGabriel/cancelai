'use client';

import { useRef } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { DetectedSubscription } from '@/types';
import { getCategoryIcon, formatCurrency, cn } from '@/lib/utils';

interface SubscriptionTagsProps {
  subscriptions: DetectedSubscription[];
  maxVisible?: number;
}

const CONFIDENCE_BORDER: Record<string, string> = {
  high: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-gray-400 dark:border-l-gray-600',
};

function SubscriptionTag({ sub, index }: { sub: DetectedSubscription; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.06,
      }}
      onAnimationStart={() => { if (ref.current) ref.current.style.willChange = 'transform'; }}
      onAnimationComplete={() => { if (ref.current) ref.current.style.willChange = 'auto'; }}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5',
        'bg-card border border-border-strong rounded-full shadow-sm',
        'text-sm text-foreground-secondary',
        'border-l-4',
        CONFIDENCE_BORDER[sub.confidence] || 'border-l-gray-400'
      )}
    >
      <span aria-hidden="true">{getCategoryIcon(sub.category)}</span>
      <span className="font-medium">{sub.name}</span>
      <span className="text-foreground-faint">·</span>
      <span className="text-foreground-muted">{formatCurrency(sub.monthlyAmount)}/m</span>
    </m.div>
  );
}

export function SubscriptionTags({ subscriptions, maxVisible = 12 }: SubscriptionTagsProps) {
  const visible = subscriptions.slice(0, maxVisible);
  const overflow = subscriptions.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2 justify-center" aria-live="polite">
      <AnimatePresence>
        {visible.map((sub, index) => (
          <SubscriptionTag key={sub.id} sub={sub} index={index} />
        ))}

        {overflow > 0 && (
          <m.div
            key="overflow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: maxVisible * 0.06 }}
            className="flex items-center px-3 py-1.5 bg-elevated border border-border-strong rounded-full text-sm text-foreground-muted font-medium"
          >
            +{overflow} mais
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
