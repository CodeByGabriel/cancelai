# Plano de Correção — Cancelaí

**Data:** 2026-04-25
**Escopo:** Críticos e Altos identificados pelos 4 agentes de revisão (code-reviewer backend/frontend, security-auditor, architect-reviewer)
**Estratégia:** correções cirúrgicas, sem refactors estruturais grandes nesta rodada (P1 monorepo, P11 imutabilidade do contexto, etc. ficam para depois)

---

## Fase 1 — Críticos de Segurança (devem ir primeiro)

### 1.1 Trocar `Math.random()` por `crypto.randomUUID()` em jobIds e requestIds
**Arquivos:**
- `apps/backend/src/controllers/analysis-controller.ts:49, 274`
- `apps/backend/src/controllers/open-finance-controller.ts:30, 34`
- `apps/backend/src/services/analysis-service.ts:36`

**Mudança:**
```ts
// Antes
const jobId = `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
// Depois
import { randomUUID } from 'crypto';
const jobId = `job_${randomUUID()}`;
```
**Impacto:** elimina vetor de bruteforce de jobIds que dá acesso ao stream SSE com extratos bancários reais. Atacante não consegue mais enumerar.

### 1.2 Remover `console.log` de access-token no frontend
**Arquivo:** `apps/frontend/src/components/BankConnect.tsx:62`

**Mudança:** deletar a linha `console.log('[Open Finance] Connect token obtained: ...', ...)`. Substituir por log de debug condicional só em `NODE_ENV === 'development'` se necessário, sem o token em si.

### 1.3 Mover side-effect `window.__pluggyCallback` para `useEffect`
**Arquivo:** `apps/frontend/src/components/BankConnect.tsx:135-137`

**Mudança:**
```tsx
// Antes (no corpo do componente)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__pluggyCallback = handleBankConnected;
}
// Depois
useEffect(() => {
  if (typeof window === 'undefined') return;
  window.__pluggyCallback = handleBankConnected;
  return () => { delete window.__pluggyCallback; };
}, [handleBankConnected]);
```
Adicionar declaração de tipo global em `types/index.ts` ou em um `global.d.ts`:
```ts
declare global {
  interface Window {
    __pluggyCallback?: (data: unknown) => void;
  }
}
```

### 1.4 Sanitização anti-CSV-injection nas descrições
**Arquivo:** novo `apps/backend/src/utils/csv-safe.ts` + uso em `pipeline/stages/scoring-stage.ts` (no momento de produzir o `DetectedSubscription` final)

**Mudança:** criar helper `sanitizeForCSV(str)` que prefixa `'` em strings começando com `[=+\-@\t\r]`. Aplicar em `name`, `originalNames[]`, `cancelInstructions` no `buildAnalysisResult`.

### 1.5 Rate limit ativo em todos os ambientes
**Arquivo:** `apps/backend/src/middleware/smart-rate-limit.ts:289-292`

**Mudança:** remover o early-return `if (!isProduction()) return;`. Em vez disso, usar limites mais frouxos em dev (ex: 100 req/min) e os de produção (15) só em prod. Configuração via variável de ambiente `RATE_LIMIT_MAX_DEV` com default sensato.

---

## Fase 2 — Bugs Críticos de Lógica

### 2.1 Corrigir `parseAmount` para formato americano com milhar
**Arquivo:** `apps/backend/src/utils/amount.ts:20-50`

**Problema:** valores como `"1,234.56"` ou `"-1,234.56"` não passam pelos branches existentes e vão para o tratamento final que pode corromper.

**Mudança:**
1. Trocar `replace(/-/g, '')` por `replace(/^-/, '')` (só remove sinal negativo no início).
2. Adicionar branch explícito: `else if (cleaned.includes('.') && cleaned.includes(','))` quando vírgula vem antes de ponto = formato americano (vírgula = milhar, ponto = decimal). Detectar pela posição relativa.
3. Validar com testes unitários novos cobrindo `1.234,56`, `1,234.56`, `-1,234.56`, `1,234`, `1234.56`.

### 2.2 Vazamento do gerador SSE — chamar `generator.return()` no finally
**Arquivos:**
- `apps/backend/src/controllers/analysis-controller.ts:367-395`
- `apps/backend/src/controllers/open-finance-controller.ts:302-320`

**Mudança:** envolver o for-await em try/finally e no finally chamar `await job.generator.return(undefined)`. Isso garante que o `finally` interno do orchestrator (`CleanupStage`, `clearTimeout`) sempre executa quando cliente desconecta.

### 2.3 Cálculo de gasto anual divergente
**Arquivo:** `apps/frontend/src/components/HomeContent.tsx:282`

**Mudança:** usar `s.annualAmount` que já existe em `DetectedSubscription` em vez de `monthlyAmount * 12`. Adicionar filtro por `confidence !== 'low'` para alinhar com summary final.

---

## Fase 3 — Altos de Segurança

### 3.1 CSP do Helmet com `useDefaults: true`
**Arquivo:** `apps/backend/src/server.ts:66-76`

**Mudança:**
```ts
contentSecurityPolicy: {
  useDefaults: true,
  directives: {
    'connect-src': ["'self'", config.cors.origin],
    // outras overrides necessárias
  }
}
```

### 3.2 Headers de segurança nas rotas SSE pós-`reply.hijack()`
**Arquivos:** `analysis-controller.ts:336-348`, `open-finance-controller.ts:288-298`

**Mudança:** adicionar `Strict-Transport-Security`, `Content-Security-Policy: default-src 'none'`, `Permissions-Policy: ()`, `Cross-Origin-Resource-Policy: same-origin` aos headers SSE.

### 3.3 Validação de `dateFrom`/`dateTo` no Open Finance
**Arquivo:** `apps/backend/src/controllers/open-finance-controller.ts:204-209`

**Mudança:**
1. Adicionar `format: 'date'` no JSON schema.
2. Validar `from < to` e janela máxima de 365 dias antes de chamar `getTransactions`.
3. Limitar paginação no `service.ts:139-154` com cap de 50 páginas.

### 3.4 `trustProxy` específico em vez de `true` global
**Arquivo:** `apps/backend/src/server.ts:26`

**Mudança:** trocar `trustProxy: true` por `trustProxy: 1` (um hop, suficiente para Railway). Remover lógica customizada de leitura de `x-forwarded-for` em `smart-rate-limit.ts:140-153` — confiar em `request.ip`.

### 3.5 Substituir `console.log` por `request.log`/`app.log` no controller
**Arquivos:** `analysis-controller.ts` (~15 pontos)

**Mudança:** substituição em massa para herdar `redact` configurado em `server.ts:37-44` e correlation por requestId.

---

## Fase 4 — Altos de Qualidade

### 4.1 Validar URL em `cancelInstructions`
**Arquivo:** `apps/frontend/src/components/SubscriptionCard.tsx:304`

**Mudança:** trocar `startsWith('http')` por validação real com `new URL()` + check de `protocol === 'https:' || 'http:'`.

### 4.2 Corrigir `onDrop` com closure stale em FileUpload
**Arquivo:** `apps/frontend/src/components/FileUpload.tsx:33-39`

**Mudança:** usar updater function `setFiles(prev => [...prev, ...acceptedFiles].slice(0, MAX_FILES))` e remover `files` do array de deps.

### 4.3 `useMemo` em filtros de Results
**Arquivo:** `apps/frontend/src/components/Results.tsx:18-23`

**Mudança:** memoizar `confirmed`/`needsReview` com `useMemo([subscriptions])`.

### 4.4 Bigram fallback para descrições curtas
**Arquivo:** `apps/backend/src/pipeline/stages/grouping-stage.ts:113-114`

**Mudança:** se `baseName.length < 4`, comparar igualdade exata em loop linear antes de tentar bigrams. Ou ajustar `MIN_SHARED_BIGRAMS` dinamicamente: `Math.min(2, bigrams.size)`.

### 4.5 Remover dead code (refatoração detector → services)
**Arquivos:**
- `apps/backend/src/utils/string.ts:197-258` (`groupSimilarStrings`, `removeAccents`, `generateTransactionHash`)
- `apps/backend/src/parsers/csv-parser.ts` e `pdf-parser.ts` (legado, ninguém importa)
- `apps/backend/src/pipeline/pipeline-observer.ts` (criado mas não usado)

**Mudança:** verificar via grep que não há imports, deletar.

### 4.6 Footer com ano dinâmico
**Arquivo:** `apps/frontend/src/components/Footer.tsx:17`

**Mudança:** `Cancelai {new Date().getFullYear()}`.

### 4.7 Imports não usados em HomeContent
**Arquivo:** `apps/frontend/src/components/HomeContent.tsx:5`

**Mudança:** remover `AlertCircle`, `RefreshCw` não usados.

---

## Fase 5 — Verificação

### 5.1 Build e testes
- `npm run build` (turbo)
- `npm run test`
- `npm run typecheck`
- `npm run lint`

### 5.2 Testes manuais críticos
- Upload CSV com valor americano (`1,234.56`) → confirmar parsing correto
- Upload CSV com descrição começando com `=cmd` → confirmar prefixo `'` no output
- Job ID gerado é UUID, não enumerável
- SSE: cancelar request no meio → verificar nos logs que cleanup rodou

### 5.3 Commit
Um commit por fase, com mensagens descritivas. Sem `Co-Authored-By`.

---

## O que NÃO está nesta rodada (ficou para depois)

- **P1 — Criar `@cancelai/shared` real** (refator grande, requer config de TS project references e ajustes em ambos apps).
- **P2 — Extrair regras de domínio dos stages** (vazamento sanity↔scoring) — requer redesenho.
- **P3 — Deduplicar `runPipeline` e `runPipelineFromTransactions`** — refator de pipeline core.
- **Substituir `pdf-parse`** — requer migração para `pdfjs-dist` ou `unpdf` + worker thread, mudança grande.
- **Auth no Open Finance** — requer design de sessão (cookies/JWT), fora do escopo de "fix de bugs".
- **TF-IDF corpus com aliases** — requer mudança no init dos KNOWN_SERVICES, design pendente.

Esses ficam documentados em `docs/audits/` para próxima sprint.

---

## Estimativa

- Fase 1 (Críticos segurança): 5 mudanças, ~20min
- Fase 2 (Bugs críticos): 3 mudanças, ~25min
- Fase 3 (Altos segurança): 5 mudanças, ~25min
- Fase 4 (Altos qualidade): 7 mudanças, ~30min
- Fase 5 (Verificação): build/test/typecheck

**Total esperado:** ~1h40 de trabalho de edição + verificação.
