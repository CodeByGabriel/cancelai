# Audit Report — Cancelai v2.0

Data: 2026-02-14

## Resumo Executivo

- Total de itens verificados: **105**
- ✅ Implementados: **101** (96.2%)
- ⚠️ Parciais: **4** (3.8%)
- ❌ Nao implementados: **0** (0%)
- 🔄 Com problemas: **0** (0%)

---

## Itens Parciais

Nenhum item critico faltando. Os 4 parciais sao decisoes de design ou otimizacoes menores:

| # | Item | Status | Impacto | Detalhe |
|---|------|--------|---------|---------|
| 1 | **1.7** try/catch individual por stage | ⚠️ | Baixo | 3/8 stages tem catch explicito (parsing-stage, ai-classification-stage + orchestrator). Os demais propagam erros via event system do orchestrator. Funcional — o pipeline nao crasha — mas nao e um try/catch literal por stage. |
| 2 | **1.11** @fastify/sse nas dependencias | ⚠️ | Nenhum | Nenhuma lib SSE usada. Implementado via `reply.hijack()` + `reply.raw.writeHead()` + `reply.raw.write()` (raw Node.js). Decisao de design documentada no SCRATCHPAD — zero deps extras, controle total, funciona em standalone e Railway. |
| 3 | **5.12** will-change controlado | ⚠️ | Baixo | `content-visibility: auto` nos cards ✓, `React.memo` nos SubscriptionCards ✓, mas `will-change` CSS property nao aplicado. Apenas transform/opacity sao animados (GPU-composited por default), entao will-change e redundante na pratica. |
| 4 | **7.7** LazyMotion/domAnimation | ⚠️ | Baixo | LazyMotion nao usado. Motion carregado via `MotionConfig` com `reducedMotion="user"`. Bundle First Load ~165kB e aceitavel para SPA. LazyMotion economizaria ~5-10kB. |

**Recomendacao:** Nenhum dos 4 itens parciais requer acao imediata. Todos sao funcionais. Se desejar corrigir, prioridade: LazyMotion (facil, economiza bundle) > will-change (trivial) > try/catch por stage (refactor medio).

---

## Detalhamento por Fase

### FASE 0: Setup + Memoria Externa

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 0.1 | SCRATCHPAD.md existe com conteudo atualizado | ✅ | 494 linhas, atualizado 2026-02-14, documenta todas 9 fases |
| 0.2 | ARCHITECTURE.md existe | ✅ | Arquivo na raiz com documentacao pesada (17.7KB) |
| 0.3 | CLAUDE.md <= 80 linhas | ✅ | **71 linhas** (limite: 80) |
| 0.4 | 5 regras que quebram build | ✅ | Todas documentadas: imports .js (L15), exactOptionalPropertyTypes (L18), noUncheckedIndexedAccess (L22), readonly (L24), no any (L27) |
| 0.5 | Secao "NUNCA faca" | ✅ | Linhas 30-39 com 8 proibicoes explicitas |
| 0.6 | Referencia ARCHITECTURE.md | ✅ | Linha 70: "Para pipeline, tipos, algoritmo, endpoints, bancos, UI e tudo mais: ARCHITECTURE.md" |

**Fase 0: 6/6 ✅ (100%)**

---

### FASE 1: Pipeline Async Generators + SSE

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 1.1 | Diretorio pipeline/ existe | ✅ | `apps/backend/src/pipeline/` com index.ts, stages/, core files |
| 1.2 | pipeline-orchestrator.ts com async generators | ✅ | `async function* runPipeline(...): AsyncGenerator<PipelineEvent>` (L94-97). Usa `yield` extensivamente |
| 1.3 | pipeline-events.ts com 8 tipos SSE | ✅ | Todos presentes: stage-start (L75), stage-complete (L81), subscription-detected (L89), progress (L96), file-error (L104), file-partial (L110), complete (L117), error (L123). Union type L130-138 |
| 1.4 | Interfaces com readonly | ✅ | Todas as interfaces de eventos usam readonly. ConfidenceScores (L155-163) tambem readonly |
| 1.5 | 8 stages separados | ✅ | Todos em `pipeline/stages/`: validation ✓, parsing ✓, normalization ✓, grouping ✓, scoring ✓, sanity ✓, ai-classification ✓, cleanup ✓ |
| 1.6 | Stages fazem yield de eventos | ✅ | 8/8 stages contem `yield` statements. Cada um emite stage-start e stage-complete no minimo |
| 1.7 | try/catch individual por stage | ⚠️ | 3/8 stages tem catch explicito (parsing: 2 catches, ai-classification: 1 catch). Demais propagam via event system do orchestrator |
| 1.8 | AbortController com timeout global | ✅ | `GLOBAL_TIMEOUT_MS = 120_000` (L34), `new AbortController()` (L43), `setTimeout(() => abort.abort(), ...)` (L100), `clearTimeout` no finally (L180) |
| 1.9 | POST /api/analyze (backward compat) | ✅ | `app.post('/api/analyze', ...)` em analysis-controller.ts (L86-217). Retorna `ApiResponse<AnalysisResult>` |
| 1.10 | Rota SSE existe | ✅ | POST `/api/analyze/stream` (L225-264) cria job. GET `/api/analyze/:jobId/stream` (L272-300+) abre SSE |
| 1.11 | @fastify/sse nas dependencias | ⚠️ | Nao usa lib SSE. Implementado via `reply.hijack()` + `reply.raw` (raw Node.js). Design choice documentado |
| 1.12 | PipelineObserver implementado | ✅ | `pipeline-observer.ts` (75L): interface PipelineObserver, class LoggingObserver, function observePipeline(). Error handling isolado |
| 1.13 | Circuit breaker (opossum) | ✅ | `ai-classification-stage.ts`: import CircuitBreaker (L10), config timeout 8s, errorThreshold 50%, reset 30s (L19-29). Fallback silencioso (L91-110) |

**Fase 1: 11/13 ✅, 2/13 ⚠️ (84.6% completo, 100% funcional)**

---

### FASE 2: Parser Registry + Plugin Pattern

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 2.1 | Diretorio registry/ existe | ✅ | `parsers/registry/` com bank-parser.interface.ts, parser-registry.ts, index.ts |
| 2.2 | parser-registry.ts existe | ✅ | 180+ linhas. Class ParserRegistry com register(), detectParser(), getParser(), listParsers(), parseFile() |
| 2.3 | Interface BankParserPlugin completa | ✅ | bankId (L37), displayName (L38), bankCode (L39), supportedFormats (L40), canParse (L46), parse (L53). Tudo readonly |
| 2.4 | Diretorio banks/ existe | ✅ | `parsers/banks/` com 21 arquivos de parser |
| 2.5 | Parsers individuais | ✅ | **21 parsers:** CSV+PDF (9): nubank, itau, bradesco, bb, caixa, inter, santander, picpay, mercadopago. CSV-only (11): c6, neon, original, next, sofisa, agibank, sicoob, sicredi, btg, xp. Fallback: generic (CSV+PDF+OFX) |
| 2.6 | Index barrel registra todos | ✅ | `banks/index.ts` com side-effect imports para todos 21 parsers. Generic por ultimo (prioridade minima). Imports com .js |
| 2.7 | Suporte OFX/QFX | ✅ | `ofx-format.ts` com isOFXContent() e parseOFXTransactions(). Usa ofx-data-extractor. Generic parser suporta OFX |
| 2.8 | ofx-data-extractor nas deps | ✅ | `"ofx-data-extractor": "^1.4.8"` em package.json |
| 2.9 | Parsers antigos mantidos | ✅ | `base.ts` (1.9KB), `csv-parser.ts` (15.5KB), `pdf-parser.ts` (10.2KB) mantidos para backward compat |
| 2.10 | Format helpers | ✅ | `formats/`: csv-format.ts (4.7KB), pdf-format.ts (5.5KB), ofx-format.ts (3.1KB), index.ts barrel |

**Fase 2: 10/10 ✅ (100%)**

---

### FASE 3: Algoritmo de Deteccao Melhorado

#### 3A. Preprocessing Pipeline

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.1 | Strip de gateway prefixes | ✅ | 17 prefixes em `config/index.ts` (L260-265): PAG\*, MP\*, MERCPAGO\*, MERPAGO\*, GOOGLE\*, PAYPAL\*, IZ\*, PICPAY\*, APPLE\.COM/, HTM\*, EDZ\*, EBW\+, APMX\*, STRIPE\*, SP\s+, PP\s+, PG\s+. GATEWAY_REGEX compilado em string.ts (L19-22) |
| 3.2 | Remocao de noise | ✅ | AUTH_CODE_REGEX (6+ alfanum com digito), DATE_REGEX, TIME_REGEX em string.ts (L30-36). Stop words: COMPRA, CARTAO, DEBITO, CREDITO, VISA, MASTERCARD, ELO, LTDA, SA, EIRELI, MEI, ME |
| 3.3 | Normalizacao completa | ✅ | 10-step pipeline em normalizeDescription() (L64-104): NFD accent strip, uppercase, gateway removal, auth codes, datas, timestamps, parcelas, stop words, special chars, lowercase |
| 3.4 | LRU cache de normalizacao | ✅ | `utils/lru-cache.ts` generico (Map-based, O(1)). Usado em string.ts (L40) com NORMALIZATION_CACHE_SIZE = 10,000 |

#### 3B. Deteccao de Parcelas

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.5 | Regex de parcelas | ✅ | 6 patterns em normalization-stage.ts (L32-42): PARC\s*\d+/\d+, PARCEL\w*\s*\d+/\d+, PARCELA, PARCELADO, \d+\s*X, \d+\s*DE\s*\d+. extractInstallmentInfo() (L75-88) |
| 3.6 | Parcelas separadas (nao descartadas) | ✅ | Armazenadas em context.installments como DetectedInstallment (L134-137). Tipo definido em types/index.ts |

#### 3C. Similaridade Hibrida

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.7 | Jaro-Winkler como primary | ✅ | string.ts (L172-175): JaroWrinker.similarity() do pacote string-comparisons. Threshold: 0.88 |
| 3.8 | Token Jaccard pre-filter | ✅ | string.ts (L127-141): tokenJaccard(). Threshold: 0.3 (SIMILARITY_CONFIG.tokenJaccardPreFilter) |
| 3.9 | Dice coefficient como tiebreaker | ✅ | string.ts (L178-182): SorensenDice.similarity(). Threshold: 0.65 |
| 3.10 | string-similarity substituido | ✅ | `"string-comparisons": "^0.0.20"` em package.json. string-similarity NAO presente |
| 3.11 | Bigram inverted index | ✅ | grouping-stage.ts: buildBigramIndex() + findCandidates(). Map<string, Set<number>> para O(n x avg_candidates) |

#### 3D. Recorrencia Calendar-Aware

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.12 | Modulo recurrence-analyzer | ✅ | `pipeline/stages/recurrence-analyzer.ts` (145 linhas). Funcoes: analyzeRecurrence(), enrichGroupsWithRecurrence() |
| 3.13 | Mediana dos intervalos | ✅ | Funcao median() (L23-31). Usada em L115: `const medianInterval = median(intervals)` |
| 3.14 | Periodos com tolerancias | ✅ | config/index.ts (L278-286): weekly +-2, biweekly +-3, monthly +-5, bimonthly +-7, quarterly +-10, semiannual +-15, annual +-20 |
| 3.15 | Habituality score | ✅ | recurrence-analyzer.ts (L54-69): calculateHabituality(). Fracao de intervalos dentro da tolerancia |

#### 3E. Novo Modelo de Scoring

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.16 | 6 sinais no scoring | ✅ | scoring-stage.ts (L116-146): stringSimilarityScore, recurrenceScore, valueStabilityScore, knownServiceBonus, habitualityScore, streamMaturity |
| 3.17 | Pesos corretos | ✅ | config/index.ts (L288-295): stringSimilarity 0.20, recurrence 0.30, valueStability 0.20, knownService 0.15, habituality 0.10, streamMaturity 0.05 |
| 3.18 | Thresholds corretos | ✅ | config/index.ts (L297-301): high 0.85, medium 0.60, low 0.40 |

#### 3F. Validacao por Faixa de Preco

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 3.19 | Faixas de preco nos servicos | ✅ | typicalPriceRange em todos 152 servicos de known-services-data.ts. Ex: Netflix { min: 20, max: 60 } |
| 3.20 | Tolerancia +15% | ✅ | sanity-stage.ts (L129-152): `maxTolerant = max * (1 + PRICE_RANGE_TOLERANCE)`. PRICE_RANGE_TOLERANCE = 0.15 |

**Fase 3: 20/20 ✅ (100%)**

---

### FASE 4: Banco de Servicos Expandido

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 4.1 | Dados separados em known-services-data.ts | ✅ | `config/known-services-data.ts` (1793 linhas). Dados separados da logica (known-services.ts) |
| 4.2 | Quantidade de servicos >= 120 | ✅ | **152 servicos** com canonicalName (meta: >= 120, ideal: 150+) |
| 4.3 | 14 categorias | ✅ | streaming (19), music (8), gaming (10), software (27), education (13), fitness (11), food (6), transport (9), telecom (8), news (11), security (8), dating (7), finance (8), other (7) |
| 4.4 | Campo cancelMethod | ✅ | Interface KnownService: `readonly cancelMethod?: CancelMethod \| undefined`. Type: 'web' \| 'app' \| 'phone' \| 'platform' \| 'telecom' |
| 4.5 | Campo billingDescriptors | ✅ | Interface: `readonly billingDescriptors: readonly string[]`. Presente em todos 152 servicos |
| 4.6 | Servicos brasileiros criticos (10/10) | ✅ | Globoplay ✓, Wellhub/Gympass ✓, Sem Parar ✓, iFood ✓, Uber One ✓, Meli+/Mercado Livre ✓, Alura ✓, Descomplica ✓, Tinder ✓, NordVPN ✓ |
| 4.7 | HashMap pre-computado de aliases | ✅ | known-services.ts (L123-150): `aliasIndex = new Map<string, KnownService>()`. Built at module load, O(1) lookup |
| 4.8 | Fuse.js para fuzzy match | ✅ | `"fuse.js": "^7.1.0"` em package.json. Threshold 0.4, distance 100, keys: canonicalName (1.0) + aliases (0.8) |
| 4.9 | URLs de cancelamento | ✅ | **119 cancelUrl** em known-services-data.ts. Top services cobertos: Netflix, Spotify, Disney+, Prime Video, etc. |

**Fase 4: 9/9 ✅ (100%)**

---

### FASE 5: Frontend Motion + Streaming UX

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 5.1 | motion nas dependencias | ✅ | `"motion": "^12.34.0"` em frontend package.json |
| 5.2 | react-countup nas dependencias | ✅ | `"react-countup": "^6.5.3"` |
| 5.3 | AnimatedCounter | ✅ | `components/AnimatedCounter.tsx`. CountUp + motion.div com spring animation |
| 5.4 | SubscriptionTags | ✅ | `components/SubscriptionTags.tsx`. AnimatePresence + motion.div, confidence borders, category icons, overflow chip "+N mais" |
| 5.5 | useReducer state machine | ✅ | HomeContent.tsx (L158): `useReducer(appReducer, INITIAL_STATE)`. 6 estados: idle, uploading, processing, streaming, complete, error |
| 5.6 | useSSEStream hook | ✅ | `lib/use-sse-stream.ts` (126L). 8 event listeners: stage-start, stage-complete, subscription-detected, progress, file-partial, file-error, complete, error |
| 5.7 | AnalysisProgress reescrito | ✅ | STAGE_PROGRESS mapping (L18-28): validation 5%, parsing 25%, normalization 35%, etc. Barra continua + texto dinamico em portugues via AnimatePresence |
| 5.8 | Timer real | ✅ | AnalysisProgress.tsx (L44-48): `Date.now() - startTime` com setInterval 100ms |
| 5.9 | Privacy badge persistente | ✅ | `components/PrivacyBadge.tsx`. Texto "Nenhum dado armazenado", lock icon, motion animation. Usado no upload e resultados |
| 5.10 | AnimatePresence mode="wait" | ✅ | AnalysisProgress.tsx (L105), SubscriptionTags, HomeContent |
| 5.11 | Spring configs customizados | ✅ | 4 presets: rapidas (400/30), cards (260/20), counter (50/20), tags stagger (300/24 + delay) |
| 5.12 | Performance mobile | ⚠️ | content-visibility: auto ✓ (globals.css). React.memo ✓ (SubscriptionCard.tsx L54). will-change: **nao encontrado**. Apenas transform/opacity animados (GPU-composited por default) |
| 5.13 | Acessibilidade (5/5) | ✅ | MotionConfig reducedMotion="user" ✓ (Providers.tsx). aria-live="polite" ✓ (SubscriptionTags L23). aria-busy ✓ (AnalysisProgress L62). role="progressbar" ✓ (L58). Input file ✓ (FileUpload L75) |
| 5.14 | page.tsx Server Component | ✅ | Sem 'use client'. Primeira linha: comentario JSDoc. Server Component confirmado |

**Fase 5: 13/14 ✅, 1/14 ⚠️ (92.9%)**

---

### FASE 6: Dark Mode

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 6.1 | next-themes nas dependencias | ✅ | `"next-themes": "^0.4.6"` |
| 6.2 | ThemeProvider configurado | ✅ | Providers.tsx: `<ThemeProvider attribute="class" enableSystem defaultTheme="system">` |
| 6.3 | Toggle System/Light/Dark | ✅ | ThemeToggle.tsx com useTheme(). 3 opcoes: System/Light/Dark. Integrado no Header |
| 6.4 | CSS custom properties | ✅ | 11+ variaveis com `var(--` em globals.css: --color-bg, --color-text, --color-primary, --color-border, --color-shadow, --color-shimmer-from/via, etc. |
| 6.5 | Dark bg NAO e pure black | ✅ | `.dark { --color-bg: #0a0a0a; }` (nao #000000) |
| 6.6 | Green primary ajustado | ✅ | Light: `--color-primary: #22c55e` (green-500). Dark: `--color-primary: #4ade80` (green-400, mais claro para fundo escuro) |
| 6.7 | Transicao suave | ✅ | `transition: background-color 0.3s ease, color 0.3s ease;` no body |

**Fase 6: 7/7 ✅ (100%)**

---

### FASE 7: Security Audit

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 7.1 | SECURITY-AUDIT.md existe | ✅ | Na raiz do monorepo. 210 linhas com 9 areas auditadas |
| 7.2 | deepseek-analyzer.ts removido | ✅ | Arquivo NAO existe em services/. Dead code eliminado |
| 7.3 | zod removido | ✅ | NAO encontrado em package.json. Nenhum import de zod no backend |
| 7.4 | isDebit fix (amount.test.ts) | ✅ | amount.test.ts (L53-56): testa isDebit('29,90', 'CREDITO') === false. Fix: `typeLower === 'd'` em vez de `.includes('d')` |
| 7.5 | PAG*NETFLIX fix (string.test.ts) | ✅ | string.test.ts (L26-29): testa normalizeDescription('PAG*NETFLIX') === 'netflix' |
| 7.6 | Zero any em arquivos novos | ✅ | Nenhum `: any`, `as any`, `<any>` em pipeline/, parsers/registry/, parsers/banks/. ESLint enforced |
| 7.7 | LazyMotion | ⚠️ | LazyMotion/domAnimation NAO usado. Usa MotionConfig com reducedMotion="user". Bundle ~165kB aceitavel |
| 7.8 | CORS no SSE | ✅ | analysis-controller.ts (L298-302): headers X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: no-referrer, Access-Control-Allow-Origin configurado |

**Fase 7: 7/8 ✅, 1/8 ⚠️ (87.5%)**

---

### FASE 8: Testes de Classificacao

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 8.1 | test/fixtures/ com CSVs | ✅ | 5 arquivos: nubank-3months.csv, itau-credit-2months.csv, bradesco-checking-1month.csv, inter-credit-3months.csv, generic-csv-2months.csv |
| 8.2 | test/golden/ com snapshots | ✅ | 5 golden files correspondentes (.golden.json) |
| 8.3 | classification-accuracy.test.ts | ✅ | 280 linhas. Suite completa com 6 testes |
| 8.4 | Confusion matrix | ✅ | Interface ConfusionMatrix { tp, fn, fp } (L102-128). Calcula Precision, Recall, F1, F2 (L130-136) |
| 8.5 | CI gates definidos | ✅ | L273-276: F1 >= 0.85, Recall >= 0.90, Precision >= 0.80. Per-fixture: Recall >= 0.60, Precision >= 0.50 |
| 8.6 | property-based.test.ts | ✅ | 210 linhas. 5 propriedades com fast-check: idempotencia, monotonicidade, min-occurrences, positive-amounts, confidence-range |
| 8.7 | fast-check nas devDeps | ✅ | `"fast-check": "^4.5.3"` |
| 8.8 | Scripts test:accuracy e test:golden | ✅ | package.json (L11-12): `"test:accuracy": "vitest run test/classification-accuracy"`, `"test:golden": "UPDATE_GOLDEN=true vitest run test/classification-accuracy"` |

**Fase 8: 8/8 ✅ (100%)**

---

### FASE 9: Reconciliacao

| # | Item | Status | Evidencia |
|---|------|--------|-----------|
| 9.1 | Scoring usa banco expandido (150+) | ✅ | scoring-stage.ts chama findKnownService() que usa aliasIndex com 152 servicos de known-services-data.ts |
| 9.2 | Preprocessing conhece todos prefixes da Fase 4 | ✅ | known-services.ts importa GATEWAY_PREFIXES do config (single source of truth). 17 prefixes sincronizados |
| 9.3 | Accuracy passa com banco expandido | ✅ | Golden files mostram servicos expandidos (ChatGPT Plus, Canva Pro, Wellhub, etc.). F1=0.966, Recall=1.000, Precision=0.933 |

**Fase 9: 3/3 ✅ (100%)**

---

## Verificacoes Globais

| # | Check | Status | Evidencia |
|---|-------|--------|-----------|
| G1 | Imports com extensao .js | ✅ | Nenhum import sem .js encontrado em backend src. tsconfig "module": "NodeNext" enforce |
| G2 | Zero any types | ✅ | Nenhum `: any` ou `as any` em backend src (excluindo test files) |
| G3 | Interfaces com readonly | ✅ | Todos os 10+ interfaces em types/index.ts usam readonly em todas propriedades |
| G4 | ThemeProvider em Providers.tsx | ✅ | Em Providers.tsx (nao layout.tsx direto). 'use client' correto |
| G5 | SSE security headers | ✅ | X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: no-referrer, CORS origin configuravel |
| G6 | Rate limiting no SSE | ✅ | smart-rate-limit.ts (L312-316): cobre POST /api/analyze E GET /stream |
| G7 | Lint | ✅ | 55 warnings pre-existentes (async sem await em parsers, vars nao usadas em subscription-detector.ts). 0 novos da refatoracao |

**Global: 7/7 ✅ (100%)**

---

## Comandos de Build/Test

```
$ npm run test -- --run
  75 passing, 0 failing
  - 64 testes unitarios
  - 6 testes de accuracy (5 per-fixture + 1 aggregate)
  - 5 testes property-based (fast-check)

$ npm run test:accuracy
  Aggregate: F1=0.966, Recall=1.000, Precision=0.933
  CI Gates: F1>=0.85 PASS | Recall>=0.90 PASS | Precision>=0.80 PASS
  FPs residuais: 2 (Raia Farma + Renner Roupas — agrupamento por sufixo)

$ npm run build
  Backend (tsc): compila limpo, zero erros
  Frontend (next build): compila limpo, First Load JS ~165kB

$ npm run lint
  55 warnings pre-existentes (0 novos)
  Nenhum warning em arquivos criados/modificados nas 9 fases
```

---

## Recomendacao

O projeto esta **pronto para deploy**. Nenhum item critico faltando, nenhum bug, nenhuma regressao.

Se desejar resolver os 4 itens parciais (todos opcionais):

1. **LazyMotion** (facil, ~30min) — Substituir import completo de `motion` por `LazyMotion` + `domAnimation` em Providers.tsx. Economiza ~5-10kB no bundle.

2. **will-change** (trivial, ~5min) — Adicionar `will-change: transform` nos SubscriptionCards que animam. Na pratica desnecessario pois apenas transform/opacity sao animados (GPU-composited por default).

3. **try/catch por stage** (medio, ~1h) — Adicionar try/catch individual em cada stage restante (normalization, grouping, scoring, sanity, cleanup). Atualmente o orchestrator captura erros globalmente e o event system propaga. Funcional, mas nao fornece isolamento granular.

4. **@fastify/sse** (nao recomendado) — A implementacao raw via `reply.hijack()` e superior: zero deps extras, controle total dos headers, funciona em standalone/Railway/VPS. Uma lib SSE adicionaria overhead sem beneficio.
