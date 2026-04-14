/**
 * SSEManager — Gerenciamento centralizado de conexões SSE
 *
 * Responsabilidades:
 * - Event IDs sequenciais por conexão
 * - Heartbeats a cada 15s (comentário SSE)
 * - Buffer circular de 100 eventos por análise (replay)
 * - Timeout preventivo aos 4.5min (evita timeout de proxy)
 * - Tracking de conexões ativas com cleanup periódico
 * - Limite de conexões simultâneas
 */

import type { ServerResponse } from 'node:http';
import type { FastifyBaseLogger } from 'fastify';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Constraint mínimo para eventos SSE.
 * PipelineEvent e qualquer outro tipo com `type: string` satisfazem isso.
 */
export interface SSEEvent {
  readonly type: string;
}

interface BufferedEvent {
  readonly id: number;
  readonly data: string; // JSON serializado do evento original
  readonly type: string; // tipo do evento para replay
}

interface ConnectionInfo {
  readonly response: ServerResponse;
  readonly createdAt: number;
  readonly analysisId: string;
  lastActivity: number;
  nextEventId: number;
  readonly heartbeatTimer: ReturnType<typeof setInterval>;
  readonly timeoutTimer: ReturnType<typeof setTimeout>;
}

export interface SSEManagerConfig {
  readonly heartbeatIntervalMs: number;
  readonly timeoutPreventionMs: number;
  readonly maxConnections: number;
  readonly maxBufferSize: number;
  readonly staleConnectionMs: number;
  readonly cleanupIntervalMs: number;
  readonly retryMs: number;
}

export interface SSEMetrics {
  readonly activeConnections: number;
  readonly peakConnections: number;
  readonly totalConnectionsServed: number;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIG
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SSEManagerConfig = {
  heartbeatIntervalMs: 15_000,
  timeoutPreventionMs: 4 * 60 * 1000 + 30 * 1000, // 4min 30s
  maxConnections: 50,
  maxBufferSize: 100,
  staleConnectionMs: 5 * 60 * 1000, // 5 min
  cleanupIntervalMs: 60_000,
  retryMs: 3_000,
};

// ═══════════════════════════════════════════════════════════════
// SSE MANAGER
// ═══════════════════════════════════════════════════════════════

export class SSEManager {
  private readonly connections = new Map<string, ConnectionInfo>();
  private readonly eventBuffers = new Map<string, BufferedEvent[]>();
  private readonly config: SSEManagerConfig;
  private readonly logger: FastifyBaseLogger;
  private readonly cleanupTimer: ReturnType<typeof setInterval>;
  private peakConnections = 0;
  private totalConnectionsServed = 0;

  constructor(logger: FastifyBaseLogger, config?: Partial<SSEManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;

    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleConnections();
    }, this.config.cleanupIntervalMs);
    this.cleanupTimer.unref();
  }

  /**
   * Registra nova conexão SSE. Retorna false se limite excedido.
   */
  registerConnection(
    connectionId: string,
    analysisId: string,
    response: ServerResponse,
  ): boolean {
    if (this.connections.size >= this.config.maxConnections) {
      this.logger.warn(
        { activeConnections: this.connections.size, maxConnections: this.config.maxConnections },
        'SSE connection limit reached, rejecting',
      );
      return false;
    }

    const now = Date.now();

    // Heartbeat: comentário SSE a cada 15s
    const heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(connectionId);
    }, this.config.heartbeatIntervalMs);

    // Timeout preventivo: envia reconnect aos 4.5min
    const timeoutTimer = setTimeout(() => {
      this.sendTimeoutReconnect(connectionId, analysisId);
    }, this.config.timeoutPreventionMs);

    const conn: ConnectionInfo = {
      response,
      createdAt: now,
      analysisId,
      lastActivity: now,
      nextEventId: 1,
      heartbeatTimer,
      timeoutTimer,
    };

    this.connections.set(connectionId, conn);
    this.totalConnectionsServed++;

    if (this.connections.size > this.peakConnections) {
      this.peakConnections = this.connections.size;
    }

    // Warning at 80% capacity
    const warningThreshold = Math.floor(this.config.maxConnections * 0.8);
    if (this.connections.size >= warningThreshold) {
      this.logger.warn(
        { activeConnections: this.connections.size, maxConnections: this.config.maxConnections },
        'SSE connections approaching limit (>80%%)',
      );
    }

    // Init event buffer for this analysis if not exists
    if (!this.eventBuffers.has(analysisId)) {
      this.eventBuffers.set(analysisId, []);
    }

    this.logger.info(
      { connectionId, analysisId, activeConnections: this.connections.size },
      'SSE connection registered',
    );

    return true;
  }

  /**
   * Envia evento SSE formatado com id sequencial e retry.
   */
  sendEvent<T extends SSEEvent>(connectionId: string, event: T): boolean {
    const conn = this.connections.get(connectionId);
    if (!conn || conn.response.destroyed) {
      return false;
    }

    const eventId = conn.nextEventId;
    conn.nextEventId = eventId + 1;
    conn.lastActivity = Date.now();

    const jsonData = JSON.stringify(event);

    // Buffer o evento serializado para replay
    this.bufferEvent(conn.analysisId, eventId, event.type, jsonData);

    // Formata SSE: id + event + data + retry
    const ssePayload =
      `id: ${eventId}\n` +
      `event: ${event.type}\n` +
      `data: ${jsonData}\n` +
      `retry: ${this.config.retryMs}\n\n`;

    return conn.response.write(ssePayload);
  }

  /**
   * Replay de eventos após lastEventId (para reconnection).
   * Retorna eventos do buffer que têm id > lastEventId.
   */
  replayEvents(connectionId: string, analysisId: string, lastEventId: number): number {
    const buffer = this.eventBuffers.get(analysisId);
    if (!buffer) return 0;

    let replayed = 0;
    for (const buffered of buffer) {
      if (buffered.id > lastEventId) {
        const conn = this.connections.get(connectionId);
        if (!conn || conn.response.destroyed) break;

        conn.nextEventId = buffered.id + 1;
        conn.lastActivity = Date.now();

        const ssePayload =
          `id: ${buffered.id}\n` +
          `event: ${buffered.type}\n` +
          `data: ${buffered.data}\n` +
          `retry: ${this.config.retryMs}\n\n`;

        conn.response.write(ssePayload);
        replayed++;
      }
    }

    if (replayed > 0) {
      this.logger.info(
        { connectionId, analysisId, lastEventId, replayed },
        'SSE events replayed',
      );
    }

    return replayed;
  }

  /**
   * Remove conexão e limpa timers.
   */
  removeConnection(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    clearInterval(conn.heartbeatTimer);
    clearTimeout(conn.timeoutTimer);

    if (!conn.response.destroyed) {
      conn.response.end();
    }

    this.connections.delete(connectionId);

    this.logger.info(
      { connectionId, activeConnections: this.connections.size },
      'SSE connection removed',
    );
  }

  /**
   * Verifica se a conexão ainda está ativa.
   */
  isAlive(connectionId: string): boolean {
    const conn = this.connections.get(connectionId);
    return conn !== undefined && !conn.response.destroyed;
  }

  /**
   * Limpa buffer de eventos de uma análise (após conclusão).
   */
  clearBuffer(analysisId: string): void {
    this.eventBuffers.delete(analysisId);
  }

  /**
   * Retorna métricas para o health check.
   */
  getMetrics(): SSEMetrics {
    return {
      activeConnections: this.connections.size,
      peakConnections: this.peakConnections,
      totalConnectionsServed: this.totalConnectionsServed,
    };
  }

  /**
   * Envia evento de shutdown a todas as conexões ativas e limpa tudo.
   */
  shutdownAll(): void {
    this.logger.info(
      { activeConnections: this.connections.size },
      'Shutting down all SSE connections',
    );

    for (const [connId, conn] of this.connections) {
      if (!conn.response.destroyed) {
        const shutdownPayload =
          `id: ${conn.nextEventId}\n` +
          `event: shutdown\n` +
          `data: ${JSON.stringify({ type: 'shutdown', reason: 'server_shutdown' })}\n\n`;
        conn.response.write(shutdownPayload);
      }
      this.removeConnection(connId);
    }

    clearInterval(this.cleanupTimer);
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE
  // ─────────────────────────────────────────────────────────────

  private sendHeartbeat(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn || conn.response.destroyed) {
      this.removeConnection(connectionId);
      return;
    }

    // Comentário SSE (linhas começando com :) — mantém conexão viva
    conn.response.write(`: heartbeat ${Date.now()}\n\n`);
    conn.lastActivity = Date.now();
  }

  private sendTimeoutReconnect(connectionId: string, analysisId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn || conn.response.destroyed) return;

    const reconnectEvent = {
      type: 'reconnect' as const,
      reason: 'timeout_prevention',
      reconnectUrl: `/api/analyze/${analysisId}/stream`,
    };

    this.sendEvent(connectionId, reconnectEvent);

    this.logger.info(
      { connectionId, analysisId },
      'SSE timeout prevention reconnect sent',
    );

    // Close this connection — client should reconnect
    this.removeConnection(connectionId);
  }

  private bufferEvent(analysisId: string, eventId: number, type: string, data: string): void {
    let buffer = this.eventBuffers.get(analysisId);
    if (!buffer) {
      buffer = [];
      this.eventBuffers.set(analysisId, buffer);
    }

    buffer.push({ id: eventId, type, data });

    // Circular buffer: remove oldest if exceeds max
    while (buffer.length > this.config.maxBufferSize) {
      buffer.shift();
    }
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [connId, conn] of this.connections) {
      if (conn.response.destroyed || now - conn.lastActivity > this.config.staleConnectionMs) {
        this.removeConnection(connId);
        cleaned++;
      }
    }

    // Also clean old event buffers (no active connection referencing them)
    const activeAnalysisIds = new Set<string>();
    for (const conn of this.connections.values()) {
      activeAnalysisIds.add(conn.analysisId);
    }
    for (const analysisId of this.eventBuffers.keys()) {
      if (!activeAnalysisIds.has(analysisId)) {
        this.eventBuffers.delete(analysisId);
      }
    }

    if (cleaned > 0) {
      this.logger.info({ cleaned, remaining: this.connections.size }, 'Stale SSE connections cleaned');
    }
  }
}
