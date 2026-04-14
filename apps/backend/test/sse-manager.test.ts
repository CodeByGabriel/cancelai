/**
 * SSEManager Tests
 *
 * Cenários testados:
 * 1. Conexão normal: registra, envia eventos com IDs sequenciais, remove
 * 2. Heartbeat: verifica envio de comentário SSE
 * 3. Replay: buffer circular + replay com lastEventId
 * 4. Timeout preventivo: evento reconnect enviado
 * 5. Conexão stale: cleanup periódico remove conexões inativas
 * 6. Shutdown: evento shutdown enviado a todas as conexões
 * 7. Limite de conexões: 51ª conexão rejeitada
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SSEManager } from '../src/services/sse-manager.js';
import type { SSEManagerConfig } from '../src/services/sse-manager.js';
import type { ServerResponse } from 'node:http';

// ─── Mock Logger ─────────────────────────────────────────────────

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnThis(),
    silent: vi.fn(),
    level: 'info',
  } as unknown as Parameters<typeof SSEManager extends new (l: infer L, ...args: unknown[]) => unknown ? L : never>;
}

// ─── Mock ServerResponse ─────────────────────────────────────────

function createMockResponse(): ServerResponse & { _written: string[] } {
  const written: string[] = [];
  const mock = {
    destroyed: false,
    write: vi.fn((data: string) => {
      written.push(data);
      return true;
    }),
    end: vi.fn(() => {
      (mock as { destroyed: boolean }).destroyed = true;
    }),
    _written: written,
  };
  return mock as unknown as ServerResponse & { _written: string[] };
}

// ─── Test Config (fast timers for testing) ───────────────────────

const testConfig: Partial<SSEManagerConfig> = {
  heartbeatIntervalMs: 100,
  timeoutPreventionMs: 300,
  maxConnections: 3,
  maxBufferSize: 5,
  staleConnectionMs: 200,
  cleanupIntervalMs: 100,
  retryMs: 1000,
};

// ─── Tests ───────────────────────────────────────────────────────

describe('SSEManager', () => {
  let manager: SSEManager;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    vi.useFakeTimers();
    logger = createMockLogger();
    manager = new SSEManager(logger as never, testConfig);
  });

  afterEach(() => {
    manager.shutdownAll();
    vi.useRealTimers();
  });

  // ── T1: Conexão normal com event IDs sequenciais ──

  describe('connection lifecycle', () => {
    it('should register connection and send events with sequential IDs', () => {
      const res = createMockResponse();
      const registered = manager.registerConnection('conn1', 'analysis1', res);
      expect(registered).toBe(true);

      const event1 = { type: 'stage-start', stage: 'parsing', timestamp: Date.now() };
      const event2 = { type: 'stage-complete', stage: 'parsing', timestamp: Date.now(), durationMs: 100, summary: {} };

      manager.sendEvent('conn1', event1);
      manager.sendEvent('conn1', event2);

      // Verifica IDs sequenciais e formato SSE
      expect(res._written[0]).toContain('id: 1\n');
      expect(res._written[0]).toContain('event: stage-start\n');
      expect(res._written[0]).toContain('retry: 1000\n');
      expect(res._written[1]).toContain('id: 2\n');
      expect(res._written[1]).toContain('event: stage-complete\n');
    });

    it('should return false for sendEvent on non-existent connection', () => {
      const result = manager.sendEvent('nonexistent', { type: 'test' });
      expect(result).toBe(false);
    });

    it('should remove connection and clean up timers', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);
      manager.removeConnection('conn1');

      expect(res.end).toHaveBeenCalled();
      expect(manager.isAlive('conn1')).toBe(false);
    });
  });

  // ── T2: Heartbeat ──

  describe('heartbeat', () => {
    it('should send heartbeat comment at configured interval', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);

      // Nenhum heartbeat ainda
      const initialWriteCount = res._written.length;

      // Avança o tempo para trigger do heartbeat
      vi.advanceTimersByTime(testConfig.heartbeatIntervalMs!);

      // Deve ter escrito um comentário SSE de heartbeat
      const heartbeatWrites = res._written.slice(initialWriteCount);
      expect(heartbeatWrites.length).toBeGreaterThanOrEqual(1);
      expect(heartbeatWrites[0]).toMatch(/^: heartbeat \d+\n\n$/);
    });
  });

  // ── T3: Replay com buffer circular ──

  describe('event buffer and replay', () => {
    it('should buffer events and replay after lastEventId', () => {
      const res1 = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res1);

      // Envia 5 eventos
      for (let i = 0; i < 5; i++) {
        manager.sendEvent('conn1', { type: 'progress', index: i });
      }

      // Simula reconexão: nova conexão quer replay a partir do evento 3
      manager.removeConnection('conn1');
      const res2 = createMockResponse();
      manager.registerConnection('conn2', 'analysis1', res2);

      const replayed = manager.replayEvents('conn2', 'analysis1', 3);

      // Deve replay eventos 4 e 5 (IDs > 3)
      expect(replayed).toBe(2);
      expect(res2._written.some(w => w.includes('id: 4\n'))).toBe(true);
      expect(res2._written.some(w => w.includes('id: 5\n'))).toBe(true);
    });

    it('should enforce circular buffer max size', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);

      // Envia mais eventos que o buffer suporta (maxBufferSize = 5)
      for (let i = 0; i < 10; i++) {
        manager.sendEvent('conn1', { type: 'progress', index: i });
      }

      // Tenta replay do início — só deve ter os últimos 5
      manager.removeConnection('conn1');
      const res2 = createMockResponse();
      manager.registerConnection('conn2', 'analysis1', res2);

      const replayed = manager.replayEvents('conn2', 'analysis1', 0);
      expect(replayed).toBe(5); // Apenas os últimos 5 do buffer circular
    });
  });

  // ── T4: Timeout preventivo ──

  describe('timeout prevention', () => {
    it('should send reconnect event at timeout threshold', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);

      // Avança até o timeout preventivo (300ms no test config)
      vi.advanceTimersByTime(testConfig.timeoutPreventionMs!);

      // Deve ter enviado um evento reconnect
      const reconnectWrite = res._written.find(w => w.includes('event: reconnect\n'));
      expect(reconnectWrite).toBeDefined();
      expect(reconnectWrite).toContain('"reason":"timeout_prevention"');
      expect(reconnectWrite).toContain('"reconnectUrl":"/api/analyze/analysis1/stream"');

      // Conexão deve ter sido fechada
      expect(res.end).toHaveBeenCalled();
    });
  });

  // ── T5: Conexão stale ──

  describe('stale connection cleanup', () => {
    it('should remove stale connections during cleanup', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);

      // Avança além do staleConnectionMs (200ms)
      vi.advanceTimersByTime(testConfig.staleConnectionMs! + testConfig.cleanupIntervalMs!);

      expect(manager.isAlive('conn1')).toBe(false);
      expect(res.end).toHaveBeenCalled();
    });

    it('should remove destroyed connections during cleanup', () => {
      const res = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res);

      // Simula conexão destruída pelo cliente
      (res as { destroyed: boolean }).destroyed = true;

      vi.advanceTimersByTime(testConfig.cleanupIntervalMs!);

      expect(manager.isAlive('conn1')).toBe(false);
    });
  });

  // ── T6: Graceful shutdown ──

  describe('shutdown', () => {
    it('should send shutdown event to all connections and clean up', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      manager.registerConnection('conn1', 'analysis1', res1);
      manager.registerConnection('conn2', 'analysis2', res2);

      manager.shutdownAll();

      // Ambas devem receber evento shutdown
      expect(res1._written.some(w => w.includes('event: shutdown\n'))).toBe(true);
      expect(res2._written.some(w => w.includes('event: shutdown\n'))).toBe(true);

      // Ambas fechadas
      expect(res1.end).toHaveBeenCalled();
      expect(res2.end).toHaveBeenCalled();

      // Nenhuma conexão ativa
      expect(manager.getMetrics().activeConnections).toBe(0);
    });
  });

  // ── T7: Limite de conexões ──

  describe('connection limits', () => {
    it('should reject connections when limit is reached', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const res3 = createMockResponse();
      const res4 = createMockResponse();

      expect(manager.registerConnection('conn1', 'a1', res1)).toBe(true);
      expect(manager.registerConnection('conn2', 'a2', res2)).toBe(true);
      expect(manager.registerConnection('conn3', 'a3', res3)).toBe(true);
      expect(manager.registerConnection('conn4', 'a4', res4)).toBe(false); // Limit = 3

      expect(manager.getMetrics().activeConnections).toBe(3);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ activeConnections: 3, maxConnections: 3 }),
        expect.any(String),
      );
    });

    it('should track peak connections', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      const res3 = createMockResponse();

      manager.registerConnection('conn1', 'a1', res1);
      manager.registerConnection('conn2', 'a2', res2);
      manager.registerConnection('conn3', 'a3', res3);
      manager.removeConnection('conn1');
      manager.removeConnection('conn2');

      const metrics = manager.getMetrics();
      expect(metrics.activeConnections).toBe(1);
      expect(metrics.peakConnections).toBe(3);
      expect(metrics.totalConnectionsServed).toBe(3);
    });
  });

  // ── Metrics ──

  describe('metrics', () => {
    it('should report accurate metrics', () => {
      const metrics = manager.getMetrics();
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.peakConnections).toBe(0);
      expect(metrics.totalConnectionsServed).toBe(0);
    });
  });
});
