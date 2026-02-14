'use client';

import { useEffect, useRef, useState } from 'react';
import { getApiUrl } from './api';
import type { DetectedSubscription, AnalysisResult } from '@/types';

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
  disconnect: () => void;
}

/**
 * Hook para consumir SSE events do pipeline de analise.
 * Conecta ao GET /api/analyze/:jobId/stream usando EventSource.
 *
 * Backend emite named events (event: type\ndata: json\n\n),
 * entao usamos addEventListener para cada tipo de evento.
 *
 * NAO faz retry — cada job so pode ser consumido uma vez
 * (backend deleta o job apos primeira conexao).
 */
export function useSSEStream(
  streamUrl: string | null,
  options: UseSSEStreamOptions
): UseSSEStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!streamUrl) return;

    const apiUrl = getApiUrl();
    const fullUrl = `${apiUrl}${streamUrl}`;
    const es = new EventSource(fullUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      // EventSource fires error on connection close too (normal end of stream)
      // Only treat as error if we never connected
      if (!isConnected && eventSourceRef.current) {
        optionsRef.current.onError?.('SSE_CONNECTION_FAILED', 'Falha na conexão SSE', true);
      }
      disconnect();
    };

    // Named event listeners (backend sends: event: <type>\ndata: <json>\n\n)
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
      optionsRef.current.onComplete?.(data.result, data.durationMs);
      // Stream is done — close cleanly
      disconnect();
    });

    es.addEventListener('error', (e: MessageEvent) => {
      // This is a named 'error' event from the backend (not the EventSource onerror)
      if (e.data) {
        const data = JSON.parse(e.data);
        optionsRef.current.onError?.(data.code, data.message, data.recoverable);
      }
      disconnect();
    });

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  return { isConnected, disconnect };
}
