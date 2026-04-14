'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-card py-8 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>para ajudar brasileiros a economizar</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-foreground-muted">
            <span>Cancelai 2024</span>
            <a
              href="/privacidade"
              className="hover:text-brand-text transition-colors"
            >
              Privacidade
            </a>
            <a
              href="https://github.com/CodeByGabriel/cancelai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-text transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-foreground-faint">
          <p>
            Este serviço é apenas informativo. Não nos responsabilizamos por
            decisões tomadas com base nas análises.
          </p>
          <p className="mt-1">
            Nenhum dado financeiro é armazenado ou compartilhado.
          </p>
        </div>
      </div>
    </footer>
  );
}
