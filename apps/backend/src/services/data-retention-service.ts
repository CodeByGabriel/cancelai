/**
 * Data Retention Service — LGPD Compliance
 *
 * Gerencia retenção e expiração de dados de análise.
 * Política: dados expiram em 7 dias (ou imediatamente se consent revogado).
 *
 * LGPD Art. 15: Término do tratamento de dados
 * LGPD Art. 16: Eliminação dos dados
 *
 * NOTA: Na implementação atual (zero persistence), dados já são descartados
 * imediatamente após processamento. Este serviço é preparatório para quando
 * houver cache ou persistência de resultados.
 */

interface RetainedAnalysis {
  readonly analysisId: string;
  readonly sessionId: string;
  readonly createdAt: number;
  readonly dataSize: number;
  deleted: boolean;
}

interface RetentionMetrics {
  readonly retainedAnalyses: number;
  readonly deletedLast24h: number;
  readonly totalDeleted: number;
}

const RETENTION_DAYS = 7;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h
const DAY_MS = 24 * 60 * 60 * 1000;

const retentionStore = new Map<string, RetainedAnalysis>();
const deletionLog: Array<{ readonly analysisId: string; readonly deletedAt: number; readonly reason: string }> = [];

// Cleanup automático a cada hora
const cleanupTimer = setInterval(() => {
  cleanupExpired();
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

/**
 * Registra uma análise para tracking de retenção
 */
export function trackAnalysis(analysisId: string, sessionId: string, dataSize: number): void {
  retentionStore.set(analysisId, {
    analysisId,
    sessionId,
    createdAt: Date.now(),
    dataSize,
    deleted: false,
  });
}

/**
 * Remove dados de uma análise (por expiração ou revogação de consent)
 */
export function deleteAnalysis(analysisId: string, reason: string): boolean {
  const record = retentionStore.get(analysisId);
  if (!record || record.deleted) return false;

  record.deleted = true;
  deletionLog.push({ analysisId, deletedAt: Date.now(), reason });

  return true;
}

/**
 * Remove TODOS os dados de um sessionId (LGPD Art. 18 — direito de eliminação)
 */
export function deleteBySession(sessionId: string): number {
  let deleted = 0;
  for (const [id, record] of retentionStore) {
    if (record.sessionId === sessionId && !record.deleted) {
      deleteAnalysis(id, 'consent_revoked');
      deleted++;
    }
  }
  return deleted;
}

/**
 * Limpa análises expiradas (> 7 dias)
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, record] of retentionStore) {
    if (!record.deleted && now - record.createdAt > RETENTION_MS) {
      deleteAnalysis(id, 'retention_expired');
    }
    // Remove completamente registros deletados há mais de 30 dias (audit trail)
    if (record.deleted && now - record.createdAt > 30 * DAY_MS) {
      retentionStore.delete(id);
    }
  }
}

/**
 * Métricas para /health
 */
export function getRetentionMetrics(): RetentionMetrics {
  const now = Date.now();
  const last24h = deletionLog.filter(d => now - d.deletedAt < DAY_MS).length;

  return {
    retainedAnalyses: [...retentionStore.values()].filter(r => !r.deleted).length,
    deletedLast24h: last24h,
    totalDeleted: deletionLog.length,
  };
}
