# Cancelai — Security Audit Report

**Date:** 2026-02-14 (atualizado 2026-04-13, Fase 3 audit 2026-04-13)
**Scope:** Full post-refactoring audit (Backend + Frontend) + Phase 3 Security Hardening + LGPD
**Version:** 1.0.0

---

## Executive Summary

Audit performed after 5 phases of development (Pipeline, Parsers, Scoring, Frontend, Dark Mode). The application processes bank statements (PDF/CSV/OFX) entirely in-memory with zero persistence. No database, no user accounts, no authentication required.

**Overall Risk: LOW** — The application has a minimal attack surface (file upload + analysis, no auth, no persistence). All critical findings have been addressed.

| Severity | Found | Fixed | Accepted Risk |
|----------|-------|-------|---------------|
| Critical | 0     | -     | -             |
| High     | 1     | 1     | 0             |
| Medium   | 5     | 5     | 0             |
| Low      | 5     | 2     | 3             |
| Info     | 2     | 1     | 1             |

**Phase 3 Fixes (2026-04-13):**
- MED-5: File validation changed from OR to AND logic — FIXED
- LOW-4: Rate limit cleanup interval now .unref()'d — FIXED
- LOW-5: Raw filenames sanitized in error responses — FIXED

---

## Areas Audited

### 1. Input Validation & File Upload

**Status: SECURE**

- File type validation by extension OR MIME type (`analysis-controller.ts:490` — `return validExtension || validMime`)
- File size limit enforced (`config.maxFileSize = 10MB`)
- Max files limit (`config.maxFiles = 5`)
- Empty file rejection
- Stream consumption on rejection (prevents memory leaks)
- Filename sanitization: path traversal prevention, special char removal, length limit (`analysis-controller.ts:495-501`)

**Finding LOW-1: `application/octet-stream` accepted**
- Browsers may send `.ofx`/`.qfx` files with generic MIME type
- Risk mitigated by extension validation as secondary check
- **Status: Accepted Risk** — Required for browser compatibility

### 2. Memory Security & Data Privacy

**Status: SECURE**

- All processing in-memory only — zero disk persistence
- `secureCleanupFiles()` overwrites buffers with zeros before GC (`analysis-controller.ts:510-518`)
- No database, no session storage, no cookies
- LGPD compliant by design (data minimization)

### 3. Security Headers (Helmet + SSE)

**Finding MED-1: SSE endpoint bypassed Helmet and CORS** [FIXED]

- `reply.hijack()` in Fastify bypasses all plugins including Helmet and CORS
- SSE response had no security headers

**Fix applied** (`analysis-controller.ts:291-302`):
```typescript
reply.raw.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Access-Control-Allow-Origin': config.cors.origin,
});
```

### 4. Rate Limiting

**Finding MED-2: GET SSE endpoint not rate limited** [FIXED]

- Only `POST /api/analyze` was rate limited
- `GET /api/analyze/:jobId/stream` was unprotected

**Fix applied** (`smart-rate-limit.ts:312-316`):
```typescript
if (
  (request.method === 'POST' && request.url.startsWith('/api/analyze')) ||
  (request.method === 'GET' && request.url.includes('/stream'))
) {
```

### 5. Logging & Information Disclosure

**Finding HIGH-1: Raw filename logged before sanitization** [FIXED]

- User-controlled filename was logged directly (`analysis-controller.ts:416`)
- Could enable log injection

**Fix applied**: Log now uses `sanitizeFilename(file.filename)` instead of raw `file.filename`.

**Finding MED-3: Error objects logged unsanitized** [FIXED]

- `ai-classifier.ts:310` logged full error objects which could contain sensitive data

**Fix applied**: Changed to `error instanceof Error ? error.message : String(error)`.

**Note:** `ai-classification-stage.ts:96` was already properly sanitized (pre-existing).

### 6. CORS Configuration

**Status: SECURE**

- Default origin: `http://localhost:3000` (development)
- Configurable via `CORS_ORIGIN` environment variable
- SSE endpoint now includes CORS header (see Finding MED-1)

### 7. Circuit Breaker (AI Service)

**Status: SECURE**

- `opossum` circuit breaker wraps AI calls (`ai-classification-stage.ts:19-29`)
- Timeout: 8s, error threshold: 50%, reset: 30s
- Silent fallback: system never fails due to AI unavailability
- API key read from `DEEPSEEK_API_KEY` env var (not hardcoded)

### 8. Pipeline Timeout

**Finding LOW-2: No global pipeline timeout**

- Individual stages have implicit limits but no global timeout cap
- Pipeline could theoretically run indefinitely with pathological input
- Risk mitigated by: file size limits, SSE job TTL (60s), rate limiting

**Status: Accepted Risk** — Low probability with current input constraints.

### 9. OFX/QFX Parsing

**Finding LOW-3: Limited input validation on OFX**

- OFX parser relies on `ofx-js` library for parsing
- No deep validation of OFX structure beyond what the library provides
- Risk mitigated by: in-memory processing, no code execution from parsed data

**Status: Accepted Risk** — Low risk given processing model.

---

## New Findings (2026-04-13 Re-audit)

### MED-5: File Validation Uses OR Logic Instead of AND [FIXED]

**File:** `analysis-controller.ts:616`
**Issue:** `isAllowedFileType()` returned `validExtension || validMime`.
**Fix applied (Phase 3):** Changed to `validExtension && (validMime || mimetype === 'application/octet-stream')` — requires valid extension AND (valid MIME or octet-stream for OFX/QFX browser compat).
**Status: FIXED**

### LOW-4: Rate Limit Cleanup Interval Not Unref'd [FIXED]

**File:** `smart-rate-limit.ts:177`
**Issue:** `setInterval(cleanupExpiredRecords, 60 * 1000)` never called `.unref()`.
**Fix applied (Phase 3):** Added `.unref()` to cleanup interval.
**Status: FIXED**

### LOW-5: Raw Filename in Error Responses [FIXED]

**File:** `analysis-controller.ts`
**Issue:** Raw `file.filename` was included in error responses without sanitization.
**Fix applied (Phase 3):** All error messages now use `sanitizeFilename(file.filename)`.
**Status: FIXED**

---

## Code Quality Findings (Fixed)

### Q-1: `isDebit()` Bug [FIXED]

**File:** `utils/amount.ts:69-74`
**Bug:** `typeLower.includes('d')` matched 'credito' because it contains 'd'.
**Fix:** Changed to `typeLower === 'd'` for strict matching.

### Q-2: Dead Code Removed [FIXED]

- Deleted `services/deepseek-analyzer.ts` (~300 lines, never imported)
- Uninstalled `zod` dependency (installed but never imported)
- Removed unused `SubscriptionCategory` import from `ai-classifier.ts`

### Q-3: Interface Immutability [FIXED]

**Finding MED-4:** Internal interfaces lacked `readonly` modifiers.

Added `readonly` to all properties in 10 interfaces:
- `AmbiguousChargeSummary`, `ChargeFlags`, `AIClassification`, `AIClassificationResult`
- `AnalysisServiceResult`
- `UploadResult`, `PipelineJob`
- `ConfidenceScores` (deduplicated from 2 files into `pipeline-events.ts`)
- `FileToProcess`

### Q-4: Inconsistent Design Token [FIXED]

**File:** `AnalysisProgress.tsx:98`
**Issue:** `bg-primary-500` (Tailwind scale) used instead of semantic `bg-brand` token.
**Fix:** Replaced with `bg-brand` for dark mode consistency.

---

## Pre-existing Lint Warnings (Out of Scope)

The following lint errors are pre-existing from legacy code retained for backward compatibility:

| Category | Count | Files |
|----------|-------|-------|
| `require-await` in bank parsers | ~18 | `parsers/banks/*.parser.ts` |
| Unused vars in legacy detector | 2 | `subscription-detector.ts` |
| Useless escapes in legacy regex | 3 | `subscription-detector.ts` |
| Test files not in tsconfig | 5 | `*.test.ts` |
| `no-floating-promises` | 2 | `analysis-controller.ts`, `smart-rate-limit.ts` |

These are documented for future cleanup but do not affect security or functionality.

---

## Recommendations (Future)

1. **Structured Logging** — Replace `console.log/warn/error` with a structured logger (pino/winston) for production observability
2. **Global Pipeline Timeout** — Add a 120s hard timeout on the pipeline orchestrator
3. **Test Coverage** — Add integration tests for pipeline stages and SSE endpoint
4. **Legacy Code Cleanup** — Remove `subscription-detector.ts`, `csv-parser.ts`, `pdf-parser.ts`, `base.ts` once backward compat is confirmed unnecessary
5. **Redis Rate Limiting** — For multi-instance deployments, migrate from in-memory to Redis-backed rate limiting

---

## Phase 3 Security Hardening (2026-04-13)

### Implemented

| Feature | Status |
|---------|--------|
| Rate limiting granular por rota | 10/20/30/60 req/min por grupo |
| X-RateLimit-Limit, X-RateLimit-Remaining headers | Todas as rotas /api |
| Response schemas (JSON Schema) | /health, /info |
| Error handler: sem stack traces em prod | `isProd` gate |
| Error handler: detalhes de validacao em dev | `error.validation` |
| File validation AND logic | extensao AND (MIME ou octet-stream) |
| Filename sanitizado em error responses | `sanitizeFilename()` |
| Rate limit cleanup .unref() | Corrigido |
| Consent management (LGPD) | POST/GET/DELETE /api/consent |
| Data retention service | 7-day TTL, auto-cleanup |
| PII stripper | CPF, CNPJ, conta, cartao, saldo, email, telefone |
| Privacy policy page | /privacidade (PT-BR) |
| ROPA documentation | docs/ROPA.md (LGPD Art. 37) |

---

## Verification

| Check | Result |
|-------|--------|
| Backend tests | 88 passing, 0 failing (unit + accuracy + property-based + SSE) |
| Backend build (`tsc`) | Clean |
| Frontend build (`next build`) | Clean, 156 kB First Load JS |
| No hardcoded secrets | Confirmed |
| No `any` types in new code | Confirmed |
| All `.js` import extensions | Confirmed |
| Privacy policy page | /privacidade accessible |
| ROPA documentation | docs/ROPA.md complete |
