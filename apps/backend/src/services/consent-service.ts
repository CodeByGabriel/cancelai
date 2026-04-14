/**
 * Consent Management Service — LGPD Compliance
 *
 * Gerencia consentimento do usuário para processamento de dados.
 * Armazena em memória (Map) com TTL — sem banco de dados.
 *
 * LGPD Art. 7: Base legal para tratamento de dados
 * - 'contract_performance': Execução de contrato (parsing de extrato)
 * - 'consent': Consentimento do titular (analytics, AI classification)
 *
 * LGPD Art. 8: Consentimento deve ser livre, informado e inequívoco
 */

export type ConsentScope = 'parsing' | 'analytics' | 'ai_classification' | 'open_finance';
export type LegalBasis = 'contract_performance' | 'consent';

interface ConsentRecord {
  readonly sessionId: string;
  readonly scopes: ReadonlySet<ConsentScope>;
  readonly legalBasis: ReadonlyMap<ConsentScope, LegalBasis>;
  readonly grantedAt: number;
  readonly ipHash: string;
  revokedAt?: number;
}

interface ConsentMetrics {
  readonly activeConsents: number;
  readonly totalGranted: number;
  readonly totalRevoked: number;
}

const CONSENT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h

const consentStore = new Map<string, ConsentRecord>();
let totalGranted = 0;
let totalRevoked = 0;

// Cleanup de consents expirados
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, record] of consentStore) {
    if (now - record.grantedAt > CONSENT_TTL_MS || record.revokedAt) {
      consentStore.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

/**
 * Registra consentimento do usuário para escopos específicos
 */
export function registerConsent(
  sessionId: string,
  scopes: readonly ConsentScope[],
  ipHash: string,
): ConsentRecord {
  const legalBasis = new Map<ConsentScope, LegalBasis>();
  for (const scope of scopes) {
    // Parsing é execução de contrato; analytics, AI e Open Finance são consentimento
    legalBasis.set(scope, scope === 'parsing' ? 'contract_performance' : 'consent');
  }

  const record: ConsentRecord = {
    sessionId,
    scopes: new Set(scopes),
    legalBasis,
    grantedAt: Date.now(),
    ipHash,
  };

  consentStore.set(sessionId, record);
  totalGranted++;

  return record;
}

/**
 * Revoga consentimento — LGPD Art. 8 §5
 */
export function revokeConsent(sessionId: string): boolean {
  const record = consentStore.get(sessionId);
  if (!record) return false;

  record.revokedAt = Date.now();
  totalRevoked++;
  return true;
}

/**
 * Verifica se consentimento está ativo para um escopo
 */
export function hasConsent(sessionId: string, scope: ConsentScope): boolean {
  const record = consentStore.get(sessionId);
  if (!record || record.revokedAt) return false;
  if (Date.now() - record.grantedAt > CONSENT_TTL_MS) return false;
  return record.scopes.has(scope);
}

/**
 * Retorna registro de consentimento — LGPD Art. 18 (acesso pelo titular)
 */
export function getConsent(sessionId: string): ConsentRecord | undefined {
  const record = consentStore.get(sessionId);
  if (!record) return undefined;
  if (Date.now() - record.grantedAt > CONSENT_TTL_MS) {
    consentStore.delete(sessionId);
    return undefined;
  }
  return record;
}

/**
 * Serializa consentimento para resposta HTTP (Sets e Maps não serializam)
 */
export function serializeConsent(record: ConsentRecord): Record<string, unknown> {
  return {
    sessionId: record.sessionId,
    scopes: [...record.scopes],
    legalBasis: Object.fromEntries(record.legalBasis),
    grantedAt: new Date(record.grantedAt).toISOString(),
    ...(record.revokedAt && { revokedAt: new Date(record.revokedAt).toISOString() }),
    active: !record.revokedAt,
  };
}

/**
 * Métricas para /health
 */
export function getConsentMetrics(): ConsentMetrics {
  return {
    activeConsents: [...consentStore.values()].filter(r => !r.revokedAt).length,
    totalGranted,
    totalRevoked,
  };
}
