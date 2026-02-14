'use client';

import { ThemeProvider } from 'next-themes';
import { LazyMotion, domAnimation, MotionConfig } from 'motion/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem defaultTheme="system">
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </LazyMotion>
    </ThemeProvider>
  );
}
