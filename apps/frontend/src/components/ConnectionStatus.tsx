'use client';

import { m, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import type { SSEConnectionStatus } from '@/lib/use-sse-stream';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: SSEConnectionStatus;
  reconnectAttempt: number;
  onRetry?: () => void;
}

export function ConnectionStatus({ status, reconnectAttempt, onRetry }: ConnectionStatusProps) {
  // Não mostra nada nos estados idle e complete
  if (status === 'idle' || status === 'complete') return null;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
          status === 'connecting' && 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
          status === 'connected' && 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
          status === 'reconnecting' && 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
          status === 'error' && 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
        )}
      >
        {status === 'connecting' && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Conectando...</span>
          </>
        )}

        {status === 'connected' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span>Conectado</span>
          </>
        )}

        {status === 'reconnecting' && (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Reconectando... ({reconnectAttempt}/20)</span>
          </>
        )}

        {status === 'error' && (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Conexão perdida</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Tentar novamente
              </button>
            )}
          </>
        )}
      </m.div>
    </AnimatePresence>
  );
}
