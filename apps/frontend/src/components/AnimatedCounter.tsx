'use client';

import CountUp from 'react-countup';
import { m } from 'motion/react';
import { formatCurrency } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  return (
    <m.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      className={className}
    >
      <CountUp
        end={value}
        separator="."
        decimal=","
        prefix="R$ "
        suffix="/ano"
        duration={2.5}
        useEasing
        preserveValue
        className="text-4xl md:text-6xl font-bold"
      />
      <span className="sr-only">
        {formatCurrency(value)} por ano
      </span>
    </m.div>
  );
}
