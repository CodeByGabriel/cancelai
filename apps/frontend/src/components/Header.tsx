'use client';

import { Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Cancel<span className="text-primary-600">aí</span>
            </span>
          </div>

          {/* GitHub Star Button – ativar após lançamento público */}

          {/* Badge de segurança */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-primary-500" />
            <span className="hidden sm:inline">Seus dados não são armazenados</span>
          </div>
        </div>
      </div>
    </header>
  );
}
