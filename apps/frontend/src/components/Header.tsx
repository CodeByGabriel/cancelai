'use client';

import { Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="border-b border-border-default bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Cancel<span className="text-brand-text">aí</span>
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
