'use client';

import { Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="border-b border-border-default bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md" style={{ boxShadow: '0 4px 12px rgba(196,98,63,0.3)' }}>
              <span className="text-white text-xl font-bold font-display">C</span>
            </div>
            <span className="text-xl font-display font-bold text-foreground tracking-tight">
              Cancel<span className="text-brand-text italic">aí</span>
            </span>
          </div>

          {/* Right side: theme toggle + security badge */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Shield className="w-4 h-4 text-brand" />
              <span className="hidden sm:inline">Seus dados não são armazenados</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
