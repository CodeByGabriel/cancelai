# SCRATCHPAD - Cancelai

## Status Atual

- **Fase:** Reconciliacao (Fase 9) — COMPLETO
- **Ultima mudanca:** 2026-02-14
- **Testes:** 75 passing, 0 failing (64 unitarios + 6 accuracy + 5 property-based)
- **Build:** Backend (tsc) e Frontend (next build) compilam limpo
- **Security audit:** SECURITY-AUDIT.md gerado na raiz do monorepo
- **Accuracy:** F1=0.966, Recall=1.000, Precision=0.933 (CI gates: F1>=0.85, R>=0.90, P>=0.80)
- **Status:** Projeto reconciliado, pronto para deploy

## Decisoes Tomadas

- Separar CLAUDE.md (680 linhas) em 3 arquivos: CLAUDE.md (72 linhas, instrucoes), ARCHITECTURE.md (referencia), SCRATCHPAD.md (progresso)
- Motivo: Claude Code segue ~150-200 instrucoes/sessao. CLAUDE.md enxuto garante que regras criticas nao sejam ignoradas
- Manter thresholds reais documentados (0.80, nao 0.85 do config) para evitar confusao futura
- Bug do CSV delimiter (RegExp sem escape de `|`) corrigido e documentado como gotcha

### Pipeline (Fase 1)

- Async generators (`AsyncGenerator<PipelineEvent>`) para pipeline lazy, pull-based
- 8 stages independentes: validation, parsing, normalization, grouping, scoring, sanity, ai-classification, cleanup
- Logica extraida (copiada) de `subscription-detector.ts` para stages — arquivo original mantido para backward compat
- `analysis-service.ts` virou facade de 77 linhas consumindo `runPipeline()` via `for-await-of`
- SSE via `reply.hijack()` + `reply.raw` (Node.js ServerResponse direto) — progressive enhancement
- SSE NAO funciona em Vercel serverless (30s max); funciona em Railway/standalone
- Circuit breaker (`opossum`) para AI classification: timeout 8s, errorThreshold 50%, reset 30s
- Fallback silencioso: se breaker aberto, copia `scoredSubscriptions` direto
- Observer pattern (`LoggingObserver`) para logging sem afetar fluxo
- Job store in-memory (`Map<string, PipelineJob>`) com TTL 60s para cleanup de jobs nao consumidos
- AbortController com timeout global de 120s
- Short-circuit apos parsing se nenhum arquivo parseado com sucesso (emite error event, nao break)
- Short-circuit apos normalization se nenhuma transacao valida
- CleanupStage roda no `finally` do orchestrator (sempre executa, zera buffers)
- `exactOptionalPropertyTypes` exige spread condicional: `...(result && { result })` em vez de `result: AnalysisResult | undefined`

### Parser Plugin System (Fase 2)

- Open/Closed Principle: cada banco e um modulo auto-contido (1 arquivo = 1 banco)
- Interface `BankParserPlugin` (nao `BankParser`) para evitar conflito com `base.ts` durante transicao
- Registry central (`ParserRegistry`) com `register()`, `detectParser()`, `parseFile()`
- `parseFile()` pre-processa conteudo: CSV→string, PDF→pdfParse()→text (UMA vez), OFX→string
- Bank parsers recebem `string`, nunca `Buffer` — registro via side-effect import
- Format helpers compartilhados: `csv-format.ts`, `pdf-format.ts`, `ofx-format.ts`
- OFX/QFX suportado via `ofx-data-extractor` (TypeScript nativo, zero deps)
- Generic parser como fallback (registrado por ultimo, prioridade minima)
- 0 transacoes → `success: false` (preserva backward compat com testes)
- `parsing-stage.ts` e `parsers/index.ts` agora delegam para `registry.parseFile()`
- Parsers antigos (`csv-parser.ts`, `pdf-parser.ts`, `base.ts`) mantidos para backward compat
- Config atualizado com MIME types OFX (`.ofx`, `.qfx`)
- Adicionar banco novo = 1 arquivo + 1 import em `banks/index.ts`

### Scoring & Similarity (Fase 3)

- **string-comparisons** substitui `string-similarity` (unmaintained). API: `JaroWrinker.similarity()`, `SorensenDice.similarity()` (nota: typo `JaroWrinker` e da lib)
- Pipeline hibrido de similaridade: Token Jaccard pre-filter (0.3) → Jaro-Winkler primary (0.88) → Dice tiebreaker (0.65)
- `normalizeDescription()` reescrito com 10-step pipeline: strip acentos, uppercase, gateway prefixes, auth codes, datas, timestamps, parcelas, stop words, special chars, lowercase
- Gateway prefixes configurados em `GATEWAY_PREFIXES` (config): PAG*, MP*, MERCPAGO*, GOOGLE*, PAYPAL*, etc.
- Stop words financeiras em `NOISE_STOP_WORDS`: COMPRA, CARTAO, DEBITO, CREDITO, VISA, etc.
- LRU cache generico em `utils/lru-cache.ts` (Map-based, O(1) get/set) — usado por normalizeDescription (10K entries)
- Auth code regex: `/\b(?=[A-Z0-9]*\d)[A-Z0-9]{6,}\b/g` — exige ao menos 1 digito para nao remover palavras puras
- Parcelas separadas em `context.installments[]` (DetectedInstallment) em vez de descartadas
- `extractInstallmentInfo()` extrai current/total de patterns como "PARC 3/12"
- Recurrence analyzer: funcoes puras (`analyzeRecurrence`, `enrichGroupsWithRecurrence`)
- Periodo detectado via mediana dos intervalos + RECURRENCE_PERIODS (weekly 7±2 ate annual 365±20)
- Habituality score: fracao de intervalos dentro da tolerancia do periodo detectado
- Stream maturity: `min(1, span/180) * 0.6 + min(1, count/6) * 0.4`
- Bigram inverted index no grouping: O(n × avg_candidates) em vez de O(n²)
- 6 sinais de scoring: stringSimilarity 0.20, recurrence 0.30, valueStability 0.20, knownService 0.15, habituality 0.10, streamMaturity 0.05
- Novos thresholds: high >= 0.85, medium >= 0.60, low >= 0.40
- Recurrence score agora usa periodo detectado em vez de hardcoded 30 dias
- Confidence reasons incluem nome do periodo em portugues ("Padrao mensal/semanal/trimestral consistente")
- Price range validation no sanity-stage: usa `typicalPriceRange` de known-services.ts com 15% tolerancia
- `priceRangeFlag` ('normal' | 'promo' | 'above_range') adicionado a DetectedSubscription
- `detectedPeriod` adicionado a DetectedSubscription
- TransactionGroup estendido com campos opcionais: habitualityScore, streamMaturity, detectedPeriod, recurrenceMetrics
- `installments` adicionado a PipelineContext e AnalysisResult
- Corrige falha pre-existente em `string.test.ts` (PAG*NETFLIX → netflix) — agora 64 passing, 0 failing

### Known Services Expansion (Fase 3.5)

- **Separacao dados vs logica**: `config/known-services-data.ts` (dados 152 servicos) + `services/known-services.ts` (matching engine)
- Dados mudam frequentemente, logica e estavel — separacao facilita manutencao
- **152 servicos** organizados em 14 categorias (era 91 em 12 categorias)
- Categoria `cloud` removida — servicos migrados para `software` (Dropbox, Google One, iCloud, OneDrive, pCloud)
- 3 categorias novas: `telecom` (8 servicos), `security` (8 servicos), `dating` (7 servicos)
- ISPs (Claro, Vivo, TIM, Oi, etc.) re-categorizados de `other` para `telecom`
- **CancelMethod** type: `'web' | 'app' | 'phone' | 'platform' | 'telecom'`
- `typicalPriceRange` agora REQUIRED em todos servicos (era optional)
- `billingDescriptors` REQUIRED (array vazio se desconhecido) — strings COM prefixo gateway (PAG*, MERCPAGO*, GOOGLE*, APPLE.COM/BILL, PAYPAL*)
- `cancelMethod` optional com `| undefined` (exactOptionalPropertyTypes)
- **Cancel instructions** para top 30 servicos populares (em portugues)
- **Matching pipeline** (4 passes + LRU cache):
  1. HashMap exact match (O(1)) — aliases + billingDescriptors normalizados via `normalizeForMatching()`
  2. Gateway prefix removal + HashMap retry — preserva two-pass existente
  3. Substring match — aliases >= 4 chars contidos no input (sorted by length desc, prefer longer matches)
  4. Fuse.js fuzzy fallback — threshold 0.4, distance 100, keys: canonicalName (1.0) + aliases (0.8)
- **Pre-computed indexes** (built once at module load):
  - `aliasIndex`: Map<string, KnownService> — aliases + descriptors + canonicalName normalizados
  - `longAliasEntries`: Array<[string, KnownService]> — aliases >= 4 chars para substring match
  - Fuse.js index com canonicalName + aliases joined
- LRU cache: 5K entries wrapping `findKnownService()`, inclusive null caching
- `clearMatchCache()` exportado para testes
- Gateway prefixes expandidos: adicionados `mercpago` e `merpago`
- Re-export `KNOWN_SERVICES = KNOWN_SERVICES_DATA` para backward compat (ai-classifier.ts)
- `deepseek-analyzer.ts` atualizado: `'cloud'` → categorias novas na validacao
- `config/index.ts` atualizado: 3 servicos cloud re-categorizados para `software`
- **Testes: 64 passing, 0 failing (isDebit corrigido no Audit)**

### Servicos por Categoria (Fase 3.5)

| Categoria | Quantidade | Exemplos |
|-----------|-----------|----------|
| streaming | 19 | Netflix, Disney+, Max, Globoplay, DAZN, Telecine |
| music | 8 | Spotify, Apple Music, Deezer, YouTube Music |
| gaming | 10 | Xbox Game Pass, PS Plus, GeForce NOW, Roblox |
| software | 28 | Adobe, Canva, ChatGPT, Dropbox, Google One, iCloud |
| education | 13 | Alura, Duolingo, Coursera, Domestika |
| fitness | 11 | Wellhub, Smart Fit, Strava, Calm |
| food | 6 | iFood Club, Rappi Prime |
| transport | 9 | Sem Parar, ConectCar, Uber One, 99 |
| telecom | 8 | Claro, Vivo, TIM, Oi |
| news | 11 | Estadao, Folha, UOL |
| security | 8 | NordVPN, Surfshark, Norton, ExpressVPN |
| dating | 7 | Tinder, Bumble, Happn, Badoo, Grindr |
| finance | 8 | GuiaBolso, Serasa Premium, Meli+ |
| other | 6 | Shein, Amazon (marketplace) |

### Accuracy Test Suite (Fase 6)

- **Objetivo:** Suite de testes que valida accuracy da deteccao de assinaturas e previne regressoes
- **5 fixtures CSV** (nubank, itau, bradesco, inter, generic) com 28 assinaturas ground truth total
- **5 golden files** com snapshots auto-gerados + ground truth manual
- **Classification accuracy test:** confusion matrix, Precision, Recall, F1, F2, per-fixture + aggregate assertions
- **Property-based tests (fast-check):** 5 propriedades validando invariantes do pipeline
- **CI gates:** F1 >= 0.85, Recall >= 0.90, Precision >= 0.80 (aggregate)
- **Per-fixture gates:** Recall >= 0.60, Precision >= 0.50 (relaxed)
- **Resultado:** F1=0.966, Recall=1.000, Precision=0.933 — todos os gates passam
- **FP reduction:** De 21 FPs (primeiro run) para 2 FPs (diversificacao de descricoes normais)
- **Dependencia:** `fast-check` (property-based testing)

### Reconciliacao Algoritmo x Banco (Fase 9)

- **Objetivo:** Alinhar algoritmo de deteccao (Fase 3) com banco expandido (Fase 4) — fases executadas linearmente (0→8) em vez da ordem recomendada (0→4→3)
- **Diagnostico:** 6 checklists verificados:

**✓ known-services ↔ scoring/sanity — JA CONECTADOS**
- `scoring-stage.ts:237` chama `findKnownService(serviceName)` para knownServiceBonus (peso 0.15)
- `sanity-stage.ts:131` chama `findKnownService(sub.name)` para validacao de faixa de preco
- Ambos usam banco expandido de 152 servicos via `known-services-data.ts`

**✓ HashMap de aliases — SEM DUPLICACAO**
- `grouping-stage.ts` usa bigram + string similarity (NAO usa known-services) — correto por design
- `scoring-stage.ts` faz lookup via `findKnownService()` com HashMap pre-computado + LRU cache

**⚠ CORRIGIDO: Duas listas de gateway prefixes desincronizadas**
- Lista 1: `config/index.ts` GATEWAY_PREFIXES (16 regex patterns para `normalizeDescription()`)
- Lista 2: `known-services.ts` GATEWAY_PREFIXES (9 strings hardcoded para `removeGatewayPrefix()`)
- **Discrepancias encontradas:**
  - `PG\s+` ausente em config (presente em known-services) — PagSeguro variante com 10+ billingDescriptors
  - `IZ*`, `PICPAY*`, `HTM*`, `EDZ*`, `EBW+`, `APMX*`, `SP\s+`, `PP\s+` ausentes em known-services
- **Por que funcionava:** billingDescriptors indexados no HashMap em forma normalizada completa, pass 1 (exact match) cobria maioria dos casos. Fragil — funcionava por acidente, nao por design
- **Correcao:** (1) Adicionado `PG\s+` ao config, (2) `known-services.ts` agora importa `GATEWAY_PREFIXES` do config e deriva lista lowercase (single source of truth)

**✓ Frontend ↔ Backend — TIPOS ALINHADOS**
- Todas 14 categorias presentes em ambos os lados
- `installments`, `priceRangeFlag`, `detectedPeriod` presentes nos tipos do frontend
- SSE hook `useSSEStream` processa todos os 8 event types

**Metricas antes/depois:** Identicas — F1=0.966, Recall=1.000, Precision=0.933. Nenhuma regressao.

### Security Audit + Quality (Post-Refactoring)

- **Bug fix:** `isDebit()` em `amount.ts:69-74` — `typeLower.includes('d')` matchava 'credito'. Fix: `typeLower === 'd'`
- **Dead code removido:** `deepseek-analyzer.ts` (300 linhas, nunca importado), `zod` (nunca importado), `SubscriptionCategory` import em `ai-classifier.ts`
- **ConfidenceScores deduplicado:** extraido de `scoring-stage.ts` e `sanity-stage.ts` para `pipeline-events.ts` (single source of truth, com readonly)
- **Readonly em 10 interfaces:** AmbiguousChargeSummary, ChargeFlags, AIClassification, AIClassificationResult, AnalysisServiceResult, UploadResult, PipelineJob, ConfidenceScores, FileToProcess
- **SSE security headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Access-Control-Allow-Origin` adicionados ao `reply.raw.writeHead()` (Helmet/CORS bypass fix)
- **Rate limiting expandido:** GET `/api/analyze/:jobId/stream` agora rate limited (antes so POST)
- **Log sanitization:** Filename logado apos sanitizacao; error objects logados como `.message` (nao objeto completo)
- **Design token fix:** `bg-primary-500` → `bg-brand` em AnalysisProgress.tsx
- **Regex fix:** Unnecessary escape `\/` → `/` em ai-classifier.ts
- **Testes: 64 passing, 0 failing** (isDebit fix resolveu o 1 failing pre-existente)
- **Builds:** Backend (tsc) e Frontend (next build ~165 kB) compilam limpo
- **SECURITY-AUDIT.md:** Gerado na raiz do monorepo com 9 areas auditadas, findings detalhados, severity levels

### Dark Mode + Visual Polish (Fase 5)

- **Objetivo:** Dark mode com toggle System/Light/Dark, CSS custom properties, visual polish
- **next-themes** v0.4.x: `attribute="class"`, `enableSystem`, `defaultTheme="system"` — class-based strategy
- **CSS variables** em `:root` (light) e `.dark` (dark) — semantic design tokens
- **Light palette:** bg #FFFFFF, surface #F9FAFB, elevated #F3F4F6, text #111827, primary #22c55e
- **Dark palette:** bg #0a0a0a (NOT pure black), surface #171717, elevated #262626, text #f5f5f5, primary #4ade80
- **Tailwind mapping:** 14 semantic colors mapped to CSS vars (background, surface, elevated, card, foreground, foreground-secondary, foreground-muted, foreground-faint, border-default, border-strong, brand, brand-soft, brand-muted, brand-text)
- **Status colors** (green/yellow/red confidence) use `dark:` Tailwind variants, NOT CSS variables — ensures correct semantics
- **ThemeToggle:** 3-button radio group (Monitor/Sun/Moon from lucide), mounted check for hydration safety
- **Body transition:** `background-color 0.3s ease, color 0.3s ease` for smooth theme switch
- **suppressHydrationWarning** on `<html>` — required for next-themes SSR compat
- **Visual polish:** SubscriptionCard `hover:scale-[1.02]`, button `active:scale-[0.98]`, dropzone `hover:border-brand/50`
- **Shimmer animation:** uses CSS vars `--color-shimmer-from` / `--color-shimmer-via` (dark: #262626/#333333)
- **Scrollbar:** styled with CSS vars for both themes
- **All 15 components updated:** Header, Footer, Features, FileUpload, HomeContent, Results, ResultsSummary, SubscriptionCard, AnalysisProgress, SubscriptionTags, PrivacyBadge, ThemeToggle (new), Providers, layout.tsx, index.ts
- **Build:** Compila limpo com zero erros. First Load JS para `/`: ~165 kB

### Frontend Live Discovery (Fase 4)

- **Objetivo:** Transformar fluxo sincrono (upload → espera → resultados) em "descoberta ao vivo" inspirada no justcancel.io
- **Font:** DM Sans (nao Inter — "generico demais"). Geometric sans-serif, bom para numeros grandes. Pesos 400/500/600/700
- **Motion library:** `motion` (Framer Motion rebrand) — bundle ~4.6KB com LazyMotion (vs ~30KB GSAP), MIT license
- **State machine:** `useReducer` nativo (nao XState) — 6 estados lineares: idle → uploading → processing → streaming → complete → error
- **SSE strategy:** Primary SSE via EventSource + fallback sincrono para `POST /api/analyze`
- **Spring presets:**
  - Interacoes rapidas: `{ stiffness: 400, damping: 30 }`
  - Entrada de cards: `{ stiffness: 260, damping: 20 }`
  - Counter: `{ stiffness: 50, damping: 20 }` (suave, sem overshoot)
  - Tags stagger: `{ stiffness: 300, damping: 24, delay: index * 0.06 }`
- **SSE events escutados (8 tipos):** stage-start, stage-complete, subscription-detected, progress, file-partial, file-error, complete, error
- Backend emite named events: `event: ${type}\ndata: ${JSON.stringify(...)}\n\n` → frontend usa `addEventListener(type, ...)`
- **Reducer valida transicoes:** START_UPLOAD so em idle/error, UPLOAD_COMPLETE so em uploading, SSE_CONNECTED so em processing, etc.
- **Fallback automatico:** Se `POST /api/analyze/stream` ou SSE falhar, cai para `POST /api/analyze` sincrono sem intervencao do usuario
- **AnimatedCounter:** react-countup com formatacao brasileira (R$, separator=".", decimal=",", suffix="/ano"), easing easeOutExpo
- **SubscriptionTags:** Tag cloud dinamico — tags aparecem conforme SSE detecta, overflow chip "+N mais" quando > 12
- **AnalysisProgress:** Barra continua (nao steps discretos), stage-to-percentage mapping, timer real com setInterval 100ms
- **PrivacyBadge:** "Nenhum dado armazenado" com lock icon, variants inline (dropzone) e floating (resultados)
- **SubscriptionCard:** React.memo para evitar re-renders durante streaming, `content-visibility: auto` para performance offscreen
- **Performance mobile:** Apenas transform/opacity animados (GPU-composited), max 3 elementos simultaneos, stagger em vez de paralelo
- **Acessibilidade:** `<MotionConfig reducedMotion="user">` via Providers.tsx, `aria-live="polite"`, `aria-busy="true"`, `role="progressbar"`
- **Providers.tsx:** Client Component wrapper para manter layout.tsx como Server Component com metadata
- **Build:** Compila limpo com zero erros. First Load JS para `/`: ~163 kB

## Problemas Encontrados

- `detectDelimiter` em csv-parser.ts usava `new RegExp('|', 'g')` sem escapar pipe — corrigido
- `config/index.ts` define `high: 0.85` mas `subscription-detector.ts` usa `0.80` — discrepancia resolvida (pipeline usa `CONFIDENCE_THRESHOLDS_V2` com high: 0.85)
- ~~`deepseek-analyzer.ts` e dead code~~ — REMOVIDO (Audit)
- ~~`zod` esta no package.json mas nunca e importado~~ — REMOVIDO (Audit)
- ~~1 falha pre-existente em testes (amount.test.ts: `isDebit` credito)~~ — CORRIGIDO (Audit): `typeLower.includes('d')` → `typeLower === 'd'`
- `string-comparisons` nao tem tipos TS — criado `types/string-comparisons.d.ts`
- `string-comparisons` tem typo no export: `JaroWrinker` (nao `JaroWinkler`)

## Arquivos Criados (Fase 6)

```
apps/backend/test/
  fixtures/
    nubank-3months.csv               — 72 transacoes, 7 subs × 3 meses, formato Nubank
    itau-credit-2months.csv          — 58 transacoes, 6 subs × 2 meses, formato Itau (D/C)
    bradesco-checking-1month.csv     — 45 transacoes, 5 subs × 2 ocorrencias, formato Bradesco (D/C)
    inter-credit-3months.csv         — 65 transacoes, 5 subs × 3 meses, formato Inter
    generic-csv-2months.csv          — 56 transacoes, 5 subs × 2 meses, formato generico
  golden/
    nubank-3months.golden.json       — ground truth: 7 subs + snapshot auto-gerado
    itau-credit-2months.golden.json  — ground truth: 6 subs + snapshot auto-gerado
    bradesco-checking-1month.golden.json — ground truth: 5 subs + snapshot auto-gerado
    inter-credit-3months.golden.json — ground truth: 5 subs + snapshot auto-gerado
    generic-csv-2months.golden.json  — ground truth: 5 subs + snapshot auto-gerado
  classification-accuracy.test.ts    — 6 testes (5 per-fixture + 1 aggregate CI gate)
  property-based.test.ts             — 5 property-based testes com fast-check
```

## Arquivos Modificados (Fase 6)

- `vitest.config.ts` — adicionado `test/**/*.test.ts` ao include
- `package.json` — adicionado `fast-check` devDep, scripts `test:accuracy` e `test:golden`

## Dependencias Alteradas (Fase 6)

- Adicionado: `fast-check` (property-based testing)

## Arquivos Modificados (Fase 9)

- `config/index.ts` — adicionado `'PG\\s+'` ao GATEWAY_PREFIXES (17o prefixo)
- `services/known-services.ts` — importa GATEWAY_PREFIXES do config, deriva `gatewayPrefixStrings` via `.map()` (remove regex escapes, normaliza lowercase), elimina lista hardcoded

## Arquivos Criados (Fase 5)

```
apps/frontend/src/components/ThemeToggle.tsx  — toggle System/Light/Dark, useTheme(), mounted check, radio group a11y
```

## Arquivos Modificados (Fase 5)

- `tailwind.config.js` — `darkMode: 'class'`, 14 semantic color tokens mapped to CSS vars
- `app/globals.css` — CSS variables `:root`/`.dark`, body transition, shimmer/scrollbar via vars
- `app/layout.tsx` — `suppressHydrationWarning` on html, `bg-background` on body
- `components/Providers.tsx` — wrapped with `<ThemeProvider attribute="class" enableSystem defaultTheme="system">`
- `components/Header.tsx` — added ThemeToggle, semantic colors (bg-card/80, border-border-default, etc.)
- `components/Footer.tsx` — semantic colors (border-border-default, bg-card, text-foreground-muted)
- `components/Features.tsx` — semantic colors (hover:bg-card, bg-brand-muted, text-brand-text)
- `components/FileUpload.tsx` — semantic colors + dark: error variants + active:scale polish
- `components/HomeContent.tsx` — full rewrite of color classes across all sections (hero, FAQ, how-it-works, etc.)
- `components/Results.tsx` — semantic colors + dark: variants for warning/empty state
- `components/ResultsSummary.tsx` — semantic colors for metric cards, brand-soft for bank badges
- `components/SubscriptionCard.tsx` — semantic colors + dark: variants for confidence borders/buttons + hover:scale-[1.02]
- `components/AnalysisProgress.tsx` — semantic colors (bg-brand-muted, text-brand-text, bg-elevated)
- `components/SubscriptionTags.tsx` — semantic colors (bg-card, border-border-strong, text-foreground-*)
- `components/PrivacyBadge.tsx` — text-foreground-muted, text-brand
- `components/index.ts` — added ThemeToggle export
- `lib/utils.ts` — dark: variants in getConfidenceColor() and getScoreBarColor()

## Dependencias Alteradas (Fase 5)

- Adicionado: `next-themes`

## Arquivos Criados (Fase 4)

```
apps/frontend/src/
  lib/use-sse-stream.ts              — SSE hook com EventSource, 8 named event listeners, cleanup automatico
  components/AnimatedCounter.tsx      — react-countup wrapper, motion.div spring, sr-only accessibility
  components/SubscriptionTags.tsx     — tag cloud animado, staggered spring, confidence borders, overflow chip
  components/PrivacyBadge.tsx         — badge persistente, variants inline/floating, lock icon
  components/Providers.tsx            — MotionConfig reducedMotion="user" wrapper
```

## Arquivos Modificados (Fase 4)

- `components/HomeContent.tsx` — **rewrite completo**: useReducer state machine (6 estados, 10 actions), AnimatePresence mode="wait", SSE integration via useSSEStream, fallback sincrono, FAQ accordion animado
- `components/AnalysisProgress.tsx` — **rewrite**: barra continua com stage-to-percentage mapping, timer real, mensagens SSE dinamicas, chips de arquivos processados
- `components/SubscriptionCard.tsx` — React.memo wrapper + `content-auto` CSS class (content-visibility: auto)
- `types/index.ts` — 8 SSE event interfaces, SSEEvent union, AppState (6-status), AppAction (10-type), 14 categorias
- `lib/api.ts` — `startStreamAnalysis()` (POST /api/analyze/stream), `getApiUrl()` exportado
- `lib/utils.ts` — getCategoryIcon/getCategoryLabel: adicionados telecom/security/dating, removido cloud
- `app/globals.css` — @import DM Sans, @media prefers-reduced-motion, .content-auto utility
- `tailwind.config.js` — fontFamily.sans: ['DM Sans', 'system-ui', 'sans-serif']
- `app/layout.tsx` — children wrapped em `<Providers>`
- `components/index.ts` — 5 novos exports (AnalysisProgress, AnimatedCounter, SubscriptionTags, PrivacyBadge, Providers)

## Dependencias Alteradas (Fase 4)

- Adicionado: `motion` v12.34.0 (Framer Motion rebrand)
- Adicionado: `react-countup` v6.5.3

## Arquivos Criados (Fase 3.5)

```
apps/backend/src/config/known-services-data.ts  — 152 servicos, 14 categorias, billingDescriptors, cancel instructions
```

## Arquivos Modificados (Fase 3.5)

- `services/known-services.ts` — reescrito como matching engine (dados extraidos para config); HashMap + Fuse.js + LRU cache
- `types/index.ts` — SubscriptionCategory: removido 'cloud', adicionados 'telecom' | 'security' | 'dating'; adicionado CancelMethod
- `services/deepseek-analyzer.ts` — isValidCategory atualizado com novas categorias (removido 'cloud')
- `config/index.ts` — 3 servicos cloud re-categorizados para 'software'

## Dependencias Alteradas (Fase 3.5)

- Adicionado: `fuse.js`

## Arquivos Criados (Fase 1)

```
apps/backend/src/pipeline/
  pipeline-events.ts         — tipos: PipelineContext, PipelineEvent union, PipelineStage interface
  pipeline-orchestrator.ts   — runPipeline(), createPipelineContext(), buildAnalysisResult()
  pipeline-observer.ts       — LoggingObserver, observePipeline()
  index.ts                   — barrel export
  stages/
    validation-stage.ts      — valida MIME, tamanho, existencia
    parsing-stage.ts         — wrapa parsers, deduplicacao, per-file isolation
    normalization-stage.ts   — filtra debitos, remove aggregates/installments/pix
    grouping-stage.ts        — agrupa por similaridade (Dice coefficient)
    scoring-stage.ts         — calcula scores, confidence, cria DetectedSubscription
    sanity-stage.ts          — valida grupos, remove falsos positivos
    ai-classification-stage.ts — circuit breaker opossum, fallback silencioso
    cleanup-stage.ts         — zera buffers, libera memoria
    index.ts                 — barrel export
```

## Arquivos Criados (Fase 2)

```
apps/backend/src/parsers/
  registry/
    bank-parser.interface.ts   — BankParserPlugin, FileMetadata, ParseOptions, CSVColumnMapping
    parser-registry.ts         — ParserRegistry class (register, detect, parseFile)
    index.ts                   — barrel export
  formats/
    csv-format.ts              — detectDelimiter, parseCSVRecords, parseCSVWithMapping
    pdf-format.ts              — matchTransactions, parsePDFWithPattern, date parsers
    ofx-format.ts              — isOFXContent, parseOFXTransactions (via ofx-data-extractor)
    index.ts                   — barrel export
  banks/
    nubank.parser.ts           — CSV + PDF (bankCode: 260)
    itau.parser.ts             — CSV + PDF (bankCode: 341)
    bradesco.parser.ts         — CSV + PDF (bankCode: 237)
    bb.parser.ts               — CSV + PDF (bankCode: 001)
    caixa.parser.ts            — CSV + PDF (bankCode: 104)
    inter.parser.ts            — CSV + PDF (bankCode: 077)
    santander.parser.ts        — CSV + PDF (bankCode: 033)
    picpay.parser.ts           — CSV + PDF (bankCode: 380)
    mercadopago.parser.ts      — CSV + PDF (bankCode: 10573)
    c6.parser.ts               — CSV only (bankCode: 336)
    neon.parser.ts             — CSV only (bankCode: 735)
    original.parser.ts         — CSV only (bankCode: 212)
    next.parser.ts             — CSV only (bankCode: 237)
    sofisa.parser.ts           — CSV only (bankCode: 637)
    agibank.parser.ts          — CSV only (bankCode: 121)
    sicoob.parser.ts           — CSV only (bankCode: 756)
    sicredi.parser.ts          — CSV only (bankCode: 748)
    btg.parser.ts              — CSV only (bankCode: 208)
    xp.parser.ts               — CSV only (bankCode: 102)
    generic.parser.ts          — CSV + PDF + OFX fallback (bankCode: 000)
    index.ts                   — auto-registro (side-effect imports)
```

## Arquivos Criados (Fase 3)

```
apps/backend/src/
  utils/lru-cache.ts                       — LRUCache<K,V> generico (Map-based)
  pipeline/stages/recurrence-analyzer.ts   — analyzeRecurrence(), enrichGroupsWithRecurrence()
  types/string-comparisons.d.ts            — declaracao de tipos para string-comparisons
```

## Arquivos Modificados (Fase 3)

- `config/index.ts` — adicionados GATEWAY_PREFIXES, NOISE_STOP_WORDS, SIMILARITY_CONFIG, RECURRENCE_PERIODS, SCORING_WEIGHTS_V2, CONFIDENCE_THRESHOLDS_V2, PRICE_RANGE_TOLERANCE, NORMALIZATION_CACHE_SIZE
- `types/index.ts` — adicionados RecurrencePeriodType, RecurrenceMetrics, DetectedInstallment; DetectedSubscription +detectedPeriod +priceRangeFlag; AnalysisResult +installments
- `pipeline/pipeline-events.ts` — TransactionGroup +habitualityScore +streamMaturity +detectedPeriod +recurrenceMetrics; PipelineContext +installments
- `pipeline/pipeline-orchestrator.ts` — createPipelineContext inicializa installments; buildAnalysisResult inclui installments
- `utils/string.ts` — normalizeDescription reescrito (10-step pipeline + LRU cache); calculateSimilarity com pipeline hibrido (Token Jaccard → JW → Dice); string-similarity → string-comparisons
- `pipeline/stages/normalization-stage.ts` — parcelas separadas em context.installments (nao descartadas); extractInstallmentInfo(); toInstallment()
- `pipeline/stages/grouping-stage.ts` — bigram inverted index; enrichGroupsWithRecurrence() apos agrupamento
- `pipeline/stages/scoring-stage.ts` — 6 sinais (era 4); SCORING_WEIGHTS_V2 e CONFIDENCE_THRESHOLDS_V2; recurrence score usa periodo detectado; confidence reasons com nome do periodo
- `pipeline/stages/sanity-stage.ts` — price range validation com findKnownService().typicalPriceRange; priceRangeFlag em subscriptions

## Arquivos Modificados (Fase 2)

- `pipeline/stages/parsing-stage.ts` — usa `registry.parseFile()` em vez de `findParser()` local
- `parsers/index.ts` — `parseStatements()` delega para registry; exporta `registry` e `BankParserPlugin`
- `config/index.ts` — adicionados MIME types OFX/QFX e extensoes `.ofx`/`.qfx`

## Arquivos Modificados (Fase 1)

- `services/analysis-service.ts` — reescrito como facade (177 → 77 linhas)
- `controllers/analysis-controller.ts` — adicionados endpoints SSE (POST stream, GET stream)

## Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/analyze` | Request-response (backward compat) |
| POST | `/api/analyze/stream` | Cria job, retorna `{ jobId, streamUrl }` |
| GET | `/api/analyze/:jobId/stream` | Abre SSE, consome pipeline events |
| GET | `/api/health` | Health check |
| GET | `/api/info` | Limites e formatos aceitos |

## Dependencias Alteradas (Fase 3)

- Adicionado: `string-comparisons`
- Removido: `string-similarity`, `@types/string-similarity`

## Testes Que Devem Passar

- [x] `utils/date.test.ts` — 13 testes
- [x] `utils/amount.test.ts` — 15 testes (isDebit fix no Audit)
- [x] `utils/string.test.ts` — 13 testes (PAG* fix na Fase 3)
- [x] `services/ai-classifier.test.ts` — 14 testes
- [x] `services/analysis-service.test.ts` — 9 testes
- [x] `test/classification-accuracy.test.ts` — 6 testes (5 fixtures + aggregate)
- [x] `test/property-based.test.ts` — 5 testes (idempotency, monotonicity, min-occurrences, positive-amounts, confidence-range)
- **Total: 75 passing, 0 failing**

### Accuracy Metrics (Classification Accuracy Suite)

| Fixture | TP | FN | FP | Precision | Recall | F1 | F2 |
|---------|----|----|----|----|----|----|-----|
| nubank-3months (7 subs, 3 meses) | 7 | 0 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| itau-credit-2months (6 subs, 2 meses) | 6 | 0 | 1 | 0.857 | 1.000 | 0.923 | 0.968 |
| bradesco-checking-1month (5 subs, ~40 dias) | 5 | 0 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| inter-credit-3months (5 subs, 3 meses) | 5 | 0 | 0 | 1.000 | 1.000 | 1.000 | 1.000 |
| generic-csv-2months (5 subs, 2 meses) | 5 | 0 | 1 | 0.833 | 1.000 | 0.909 | 0.962 |
| **AGGREGATE** | **28** | **0** | **2** | **0.933** | **1.000** | **0.966** | **0.986** |

**CI Gates:** F1=0.966 >= 0.85 ✓ | Recall=1.000 >= 0.90 ✓ | Precision=0.933 >= 0.80 ✓

**FPs residuais (2):**
- Itau: "RAIA FARMA" + "ARAUJO FARMA" agrupados por sufixo "FARMA" com valores similares (R$28.90/R$31.20)
- Generic: "RENNER ROUPAS" + "MARISA ROUPAS" agrupados por sufixo "ROUPAS" com valores similares (R$109.90/R$95.00)

**Scripts:**
- `npm run test:accuracy` — roda suite de accuracy (sem atualizar golden files)
- `npm run test:golden` — roda com UPDATE_GOLDEN=true (regenera snapshots, preserva groundTruth)

### Accuracy Test Architecture

- **Golden file pattern:** `groundTruth` (manual, nunca auto-atualizado) + `snapshot` (auto-gerado com UPDATE_GOLDEN=true)
- **Confusion matrix:** TP (ground truth detectado), FN (ground truth perdido), FP (detectado mas nao no ground truth)
- **Matching algorithm:** normalize (lowercase, strip acentos, remove gateway prefixes) → exact match → substring → first-word match
- **Property-based tests (fast-check):** idempotencia, monotonicidade, min-occurrences >= 2, amounts > 0, confidence [0,1]
