'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiUrl } from './api';
import type { DetectedSubscription, AnalysisResult } from '@/types';

// ─── Types ──────────────────────────────────────────────────────

export type SSEConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'complete'
  | 'error';

interface UseSSEStreamOptions {
  onStageStart?: (stage: string) => void;
  onStageComplete?: (stage: string, durationMs: number, summary: Record<string, number | string>) => void;
  onSubscriptionDetected?: (subscription: DetectedSubscription, index: number, total: number) => void;
  onProgress?: (stage: string, current: number, total: number, message: string) => void;
  onFilePartial?: (filename: string, transactionCount: number, bankDetected: string) => void;
  onFileError?: (filename: string, error: string) => void;
  onComplete?: (result: AnalysisResult, durationMs: number) => void;
  onError?: (code: string, message: string, recoverable: boolean) => void;
}

interface UseSSEStreamReturn {
  isConnected: boolean;
  connectionStatus: SSEConnectionStatus;
  reconnectAttempt: number;
  disconnect: () => void;
  retry: () => void;
}

// ─── Constants ──────────────────────────────────────────────────

const MAX_RECONNECT_ATTEMPTS = 20;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

function getBackoffDelay(attempt: number): number {
  const delay = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
  return Math.min(delay, MAX_BACKOFF_MS);
}

// ─── Hook ───────────────────────────────────────────────────────

/**
 * Hook para consumir SSE events do pipeline de analise.
 * Conecta ao GET /api/analyze/:jobId/stream usando EventSource.
 *
 * Features:
 * - IDs sequenciais com Last-Event-ID automático (nativo do EventSource)
 * - Reconnection com backoff exponencial (1s → 2s → 4s → ... → 30s)
 * - Máximo de 20 tentativas antes de desistir
 * - Suporte a evento 'reconnect' do servidor (timeout prevention)
 * - Cleanup automático em unmount
 */
export function useSSEStream(
  streamUrl: string | null,
  options: UseSSEStreamOptions
): UseSSEStreamReturn {
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('idle');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamUrlRef = useRef(streamUrl);
  const isCompleteRef = useRef(false);

  optionsRef.current = options;
  streamUrlRef.current = streamUrl;

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback((url: string) => {
    // Limpa conexão anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const apiUrl = getApiUrl();
    const fullUrl = `${apiUrl}${url}`;
    const es = new EventSource(fullUrl);
    eventSourceRef.current = es;

    setConnectionStatus('connecting');

    es.onopen = () => {
      setConnectionStatus('connected');
      setReconnectAttempt(0); // Reset backoff on successful connection
    };

    es.onerror = () => {
      // EventSource fires error on normal stream close too.
      // Se já completou, é fechamento normal — não reconecta.
      if (isCompleteRef.current) {
        disconnect();
        return;
      }

      // Se o EventSource fechou (readyState === CLOSED), tenta reconectar
      if (es.readyState === EventSource.CLOSED) {
        disconnect();

        setReconnectAttempt(prev => {
          const nextAttempt = prev + 1;
          if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
            setConnectionStatus('error');
            optionsRef.current.onError?.(
              'SSE_MAX_RETRIES',
              'Conexão perdida após múltiplas tentativas. Tente novamente.',
              false,
            );
            return nextAttempt;
          }

          setConnectionStatus('reconnecting');
          const delay = getBackoffDelay(prev);

          reconnectTimerRef.current = setTimeout(() => {
            const currentUrl = streamUrlRef.current;
            if (currentUrl) {
              connect(currentUrl);
            }
          }, delay);

          return nextAttempt;
        });
      }
    };

    // ── Named event listeners ──

    es.addEventListener('stage-start', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onStageStart?.(data.stage);
    });

    es.addEventListener('stage-complete', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onStageComplete?.(data.stage, data.durationMs, data.summary);
    });

    es.addEventListener('subscription-detected', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onSubscriptionDetected?.(data.subscription, data.index, data.total);
    });

    es.addEventListener('progress', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onProgress?.(data.stage, data.current, data.total, data.message);
    });

    es.addEventListener('file-partial', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onFilePartial?.(data.filename, data.transactionCount, data.bankDetected);
    });

    es.addEventListener('file-error', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      optionsRef.current.onFileError?.(data.filename, data.error);
    });

    es.addEventListener('complete', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      isCompleteRef.current = true;
      setConnectionStatus('complete');
      optionsRef.current.onComplete?.(data.result, data.durationMs);
      disconnect();
    });

    es.addEventListener('error', (e: MessageEvent) => {
      // Named 'error' event from the backend (not the EventSource onerror)
      if (e.data) {
        const data = JSON.parse(e.data);
        optionsRef.current.onError?.(data.code, data.message, data.recoverable);
      }
      disconnect();
      setConnectionStatus('error');
    });

    // Evento reconnect do servidor (timeout prevention)
    es.addEventListener('reconnect', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const reconnectUrl: string = data.reconnectUrl;

      // Servidor pede para reconectar — fecha esta conexão e abre nova
      disconnect();
      setConnectionStatus('reconnecting');

      // Reconecta imediatamente (não backoff — o servidor pediu)
      reconnectTimerRef.current = setTimeout(() => {
        connect(reconnectUrl);
      }, 100);
    });

    // Evento shutdown do servidor (graceful shutdown)
    es.addEventListener('shutdown', () => {
      disconnect();
      setConnectionStatus('reconnecting');

      // Tenta reconectar após 2s (servidor pode estar reiniciando)
      reconnectTimerRef.current = setTimeout(() => {
        const currentUrl = streamUrlRef.current;
        if (currentUrl) {
          connect(currentUrl);
        }
      }, 2000);
    });
  }, [disconnect]);

  const retry = useCallback(() => {
    isCompleteRef.current = false;
    setReconnectAttempt(0);
    setConnectionStatus('idle');

    const url = streamUrlRef.current;
    if (url) {
      connect(url);
    }
  }, [connect]);

  useEffect(() => {
    if (!streamUrl) {
      setConnectionStatus('idle');
      isCompleteRef.current = false;
      return;
    }

    isCompleteRef.current = false;
    connect(streamUrl);

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    reconnectAttempt,
    disconnect,
    retry,
  };
}
