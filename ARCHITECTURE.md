# ARCHITECTURE.md - Cancelai

Referencia completa de arquitetura, tipos, pipeline e configuracao.
Para instrucoes de desenvolvimento, leia `CLAUDE.md`.

---

## Estrutura do Monorepo

```
cancelai/
├── apps/
│   ├── frontend/              # Next.js 14 (App Router)
│   │   └── src/
│   │       ├── app/               # Pages (layout.tsx, page.tsx, globals.css)
│   │       ├── components/        # 18 React Components (Client/Server) — inclui MethodSelector, BankConnect
│   │       ├── lib/               # api.ts (+ Open Finance API), use-sse-stream.ts, utils.ts
│   │       └── types/             # TypeScript types (state machine, SSE events)
│   │
│   └── backend/               # Fastify + TypeScript
│       └── src/
│           ├── config/            # Configuracao central + known-services-data (352 servicos)
│           ├── adapters/           # open-finance.adapter.ts (agregador → Transaction)
│           ├── controllers/       # Route handlers (analysis-controller.ts, open-finance-controller.ts)
│           ├── detector/          # Algoritmo legado (subscription-detector.ts) — NAO usado pelo pipeline
│           ├── middleware/        # Rate limiting (smart-rate-limit.ts)
│           ├── parsers/           # Sistema de plugins por banco
│           │   ├── banks/         # 21 parsers (1 arquivo = 1 banco) + generic fallback
│           │   ├── formats/       # csv-format.ts, pdf-format.ts, ofx-format.ts
│           │   └── registry/      # ParserRegistry + BankParserPlugin interface
│           ├── pipeline/          # Pipeline async 8 stages + SSE
│           │   ├── stages/        # 8 stages + recurrence-analyzer
│           │   ├── pipeline-orchestrator.ts
│           │   ├── pipeline-events.ts
│           │   └── pipeline-observer.ts
│           ├── services/          # Logica de negocio
│           │   ├── analysis-service.ts    # Facade consumindo runPipeline()
│           │   ├── ai-classifier.ts       # Pipeline IA (DeepSeek)
│           │   └── known-services.ts      # Matching engine (4-pass + Fuse.js + LRU cache)
│           ├── utils/             # Helpers (string.ts, date.ts, amount.ts, lru-cache.ts)
│           └── types/             # Interfaces (todas readonly)
│
├── api/                       # Serverless entrypoint (legado, nao usado no Railway)
│   └── index.ts                   # Adapta Fastify para serverless (legado)
└── package.json               # Workspace root (engines: node >= 18)
```

---

## API Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/api/analyze` | Analisa extratos sincrono (multipart/form-data) |
| `POST` | `/api/analyze/stream` | Cria job async, retorna jobId + streamUrl |
| `GET` | `/api/analyze/:jobId/stream` | SSE stream de eventos do pipeline |
| `POST` | `/api/open-finance/link` | Cria connect token para widget Pluggy |
| `GET` | `/api/open-finance/accounts/:itemId` | Lista contas de uma conexao bancaria |
| `POST` | `/api/open-finance/analyze` | Busca transacoes via Open Finance + cria job pipeline |
| `GET` | `/api/open-finance/:jobId/stream` | SSE stream de eventos (Open Finance) |
| `DELETE` | `/api/open-finance/connection/:itemId` | Revoga conexao bancaria |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/info` | Limites e versao da API |

### Codigos de Erro

| Codigo | Quando |
|--------|--------|
| `INVALID_CONTENT_TYPE` | Request nao e multipart/form-data |
| `NO_FILES` | Nenhum arquivo enviado |
| `ANALYSIS_FAILED` | Erro no processamento |
| `INTERNAL_ERROR` | Erro inesperado |
| `NETWORK_ERROR` | Frontend: erro de conexao |
| `OPEN_FINANCE_NOT_CONFIGURED` | AGGREGATOR_CLIENT_ID/SECRET nao definidos |
| `AGGREGATOR_ERROR` | Erro de comunicacao com o agregador (Pluggy) |

### Eventos SSE (streaming)

| Evento | Descricao |
|--------|-----------|
| `stage-start` | Stage do pipeline iniciado |
| `stage-complete` | Stage do pipeline concluido |
| `subscription-detected` | Assinatura encontrada em tempo real |
| `progress` | Porcentagem geral do processamento |
| `file-partial` | Resultado parcial de um arquivo |
| `file-error` | Erro em arquivo especifico |
| `complete` | Resultado final completo |
| `error` | Erro no processamento |

---

## Pipeline de Processamento (8 Stages)

O pipeline usa **async generators** (`AsyncGenerator<PipelineEvent>`) para processamento lazy, pull-based.

```
Upload → ValidationStage → ParsingStage → NormalizationStage → GroupingStage
         → ScoringStage → SanityStage → AIClassificationStage → CleanupStage
```

**Implementacao:** `pipeline-orchestrator.ts` executa stages em sequencia via `for-await-of`.

| # | Stage | Arquivo | Descricao |
|---|-------|---------|-----------|
| 1 | **Validation** | `validation-stage.ts` | Tipo (extensao + MIME), tamanho (10MB max), quantidade (5 max) |
| 2 | **Parsing** | `parsing-stage.ts` | Delega para `registry.parseFile()` → plugin do banco detectado |
| 3 | **Normalization** | `normalization-stage.ts` | 10-step: acentos, gateways, auth codes, datas, parcelas, stop words |
| 4 | **Grouping** | `grouping-stage.ts` | Bigram inverted index, similaridade hibrida (Jaccard → Jaro-Winkler → Dice) |
| 5 | **Scoring** | `scoring-stage.ts` | Formula ponderada 6 sinais (ver abaixo) |
| 6 | **Sanity** | `sanity-stage.ts` | Filtra aggregates (TOTAL/FATURA), limite R$50k, price range validation |
| 7 | **AI Classification** | `ai-classification-stage.ts` | DeepSeek classifica ambiguos (circuit breaker com opossum) |
| 8 | **Cleanup** | `cleanup-stage.ts` | Buffers zerados, GC, formata resultado final (roda no `finally`) |

**Auxiliar:** `recurrence-analyzer.ts` — funcoes puras para analise de recorrencia.

**Short-circuits:**
- Apos parsing: se nenhum arquivo parseado com sucesso
- Apos normalization: se nenhuma transacao valida

**Resiliencia:**
- Circuit breaker (`opossum`): timeout 8s, errorThreshold 50%, reset 30s
- Fallback silencioso: se breaker aberto, copia scored subscriptions direto
- AbortController com timeout global de 120s
- CleanupStage roda sempre (no `finally`)

---

## Algoritmo de Deteccao (Weighted Scoring v3.0 — 6 Sinais)

### Formula de Confianca

**Implementacao ativa:** `pipeline/stages/scoring-stage.ts` (usa `SCORING_WEIGHTS_V2` de `config/index.ts`)

```
confidenceScore =
    stringSimilarity    x 0.20    // Similaridade de descricao
  + recurrenceScore     x 0.30    // Padrao periodico (semanal a anual)
  + valueStabilityScore x 0.20    // Consistencia de valor (±15%)
  + knownServiceBonus   x 0.15    // Servico conhecido
  + habitualityScore    x 0.10    // Regularidade dos intervalos
  + streamMaturity      x 0.05    // Historico e quantidade de ocorrencias
```

> **NOTA:** `detector/subscription-detector.ts` contem uma versao legada com 4 sinais (0.25/0.35/0.20/0.20, high >= 0.80). Este arquivo NAO e usado pelo pipeline ativo — mantido apenas como referencia historica.

### Thresholds REAIS (codigo fonte: `config/index.ts:314-318`)

| Nivel | Score | Definido em |
|-------|-------|-------------|
| **High** | >= 0.85 | `CONFIDENCE_THRESHOLDS_V2.high` |
| **Medium** | >= 0.60 | `CONFIDENCE_THRESHOLDS_V2.medium` |
| **Low** | >= 0.40 | `CONFIDENCE_THRESHOLDS_V2.low` |

### Validacao de Sanidade

- **Aggregate patterns:** Rejeita linhas com TOTAL, FATURA, SALDO, SUBTOTAL
- **Max amount:** R$50.000 por transacao (provavelmente erro de parsing)
- **High value:** Assinaturas > R$500 precisam de regras mais rigorosas:
  - Recorrencia >= 0.6
  - Estabilidade de valor >= 0.7
  - Similaridade de descricao >= 0.8
- **Price range validation:** Usa `typicalPriceRange` de known-services-data.ts com 15% tolerancia

### Criterios de Qualidade (grupo valido)

```typescript
meetsRecurrence:    scores.recurrenceScore >= 0.6
meetsStability:     scores.valueStabilityScore >= 0.7
meetsDescription:   group.stringSimilarityScore >= 0.8
```

---

## AI Classifier (DeepSeek)

### Configuracao

```typescript
const CONFIG = {
  API_URL: 'https://api.deepseek.com/v1/chat/completions',
  MODEL: 'deepseek-chat',
  TIMEOUT_MS: 5000,
  MIN_CONFIDENCE_TO_INCLUDE: 0.75,
  MAX_ITEMS_PER_REQUEST: 10,
};
```

### Pipeline

```
1. separateSubscriptions()
   → high confidence → confirmed (direto para resultado)
   → medium/low → ambiguous (vai para IA)

2. classifyAmbiguousCharges(ambiguous)
   → Converte para resumos (sem dados sensiveis)
   → Envia prompt para DeepSeek
   → Recebe: subscription | installment | not_subscription

3. applyAIClassifications()
   → subscription + confidence >= 0.75 → promoted (medium, score + 0.1)
   → installment/not_subscription → discarded
   → sem classificacao → unchanged

4. Resultado final = confirmed + promoted + unchanged
```

### Fallback Silencioso

Se a IA falhar (timeout, erro, sem API key, circuit breaker aberto), retorna `confirmed + ambiguous` sem alteracao. **O sistema NUNCA falha por causa da IA.**

---

## Rate Limiting

### Chave de Cliente

```typescript
clientKey = `${IP}:${md5(userAgent).substring(0, 8)}`
```

### Limites por Ambiente

| Parametro | Producao | Desenvolvimento |
|-----------|----------|-----------------|
| Requests/min | 10 (default, configuravel via `RATE_LIMIT_MAX`) | 1000 |
| Upload/min | 50 MB | 500 MB |
| Block duration | 5 min | 10 seg |
| Suspicious threshold | 10 req/s | 1000 req/s |

> **IMPORTANTE:** Rate limiting e completamente **DESATIVADO** quando `NODE_ENV !== 'production'`.

### Store

In-memory `Map<string, ClientUsage>`. Em producao com multiplas instancias, considerar Redis.

---

## Parsers (Plugin System)

### Arquitetura

O sistema usa um **plugin system** baseado no Open/Closed Principle. Cada banco e um modulo auto-contido.

**Registry:** `parsers/registry/parser-registry.ts`
**Interface:** `parsers/registry/bank-parser.interface.ts` (`BankParserPlugin`)

```
parsers/
├── banks/           # 21 parsers + generic fallback
│   ├── index.ts     # Registra todos os plugins via side-effect import
│   ├── nubank.parser.ts
│   ├── itau.parser.ts
│   ├── bradesco.parser.ts
│   ├── bb.parser.ts
│   ├── caixa.parser.ts
│   ├── inter.parser.ts
│   ├── santander.parser.ts
│   ├── c6.parser.ts
│   ├── picpay.parser.ts
│   ├── mercadopago.parser.ts
│   ├── neon.parser.ts
│   ├── original.parser.ts
│   ├── next.parser.ts
│   ├── sofisa.parser.ts
│   ├── agibank.parser.ts
│   ├── sicoob.parser.ts
│   ├── sicredi.parser.ts
│   ├── btg.parser.ts
│   ├── xp.parser.ts
│   └── generic.parser.ts  # Fallback (registrado por ultimo)
├── formats/         # Helpers compartilhados
│   ├── csv-format.ts
│   ├── pdf-format.ts
│   └── ofx-format.ts
└── registry/
    ├── parser-registry.ts    # register(), detectParser(), parseFile()
    └── bank-parser.interface.ts
```

**Formatos suportados:** CSV, PDF, OFX/QFX

**Fluxo:** `parsing-stage.ts` → `registry.parseFile()` → detecta banco → plugin especifico → transacoes

> **NOTA:** `csv-parser.ts` e `pdf-parser.ts` na raiz de `parsers/` sao codigo legado mantido para backward compat. O pipeline ativo usa o registry.

### Adicionar Banco Novo

Criar `apps/backend/src/parsers/banks/meubanco.parser.ts`:

```typescript
import { registry } from '../registry/index.js';
import type { BankParserPlugin } from '../registry/bank-parser.interface.js';

const meuBancoParser: BankParserPlugin = {
  bankName: 'Meu Banco',
  detect: (content: string) => /meu\s*banco/i.test(content),
  parse: (content: string) => {
    // Extrair transacoes do conteudo
    return { transactions: [...], success: true };
  },
};

registry.register(meuBancoParser);
```

Adicionar import em `banks/index.ts`:
```typescript
import './meubanco.parser.js';
```

---

## Servicos Conhecidos (known-services-data.ts + known-services.ts)

**352 servicos** com aliases e billing descriptors reais de extratos bancarios.

### Arquitetura

- **Dados:** `config/known-services-data.ts` — 352 servicos (dados puros, muda frequentemente)
- **Engine:** `services/known-services.ts` — matching 4-pass + Fuse.js + LRU cache (logica estavel)

### Matching Pipeline (4 passes + LRU cache)

1. **HashMap exact match** (O(1)) — aliases + billingDescriptors normalizados
2. **Gateway prefix removal** + HashMap retry — remove PAG*, GOOGLE*, etc.
3. **Substring match** — aliases >= 4 chars, sorted by length desc
4. **Fuse.js fuzzy fallback** — threshold 0.4, distance 100

Pre-computed indexes construidos uma vez no module load.
LRU cache de 5K entries (inclusive null caching).

### Estrutura

```typescript
interface KnownService {
  canonicalName: string;        // "Netflix"
  aliases: string[];            // ["netflix", "netflix.com", "nflx*"]
  billingDescriptors: string[]; // COM prefixo gateway: ["PAG*NETFLIX", "GOOGLE*NETFLIX"]
  category: SubscriptionCategory;
  cancelUrl?: string;
  cancelInstructions?: string;
  cancelMethod?: CancelMethod;  // 'web' | 'app' | 'phone' | 'platform' | 'telecom'
  typicalPriceRange: { min: number; max: number };  // REQUIRED
  isPopular?: boolean;
  currency?: string;            // 'BRL' | 'USD' | 'EUR/USD'
  iofApplicable?: boolean;
}
```

### Categorias (16)

`streaming` | `music` | `gaming` | `software` | `cloud` | `news` | `fitness` | `food` | `transport` | `education` | `finance` | `security` | `dating` | `health` | `insurance` | `other`

---

## Frontend

### Arquitetura de Componentes

```
app/layout.tsx (Server Component)
└── app/page.tsx (Server Component - NAO adicionar 'use client')
    └── HomeContent.tsx (Client Component - estado centralizado)
        ├── Header.tsx
        ├── FileUpload.tsx (react-dropzone)
        ├── AnalysisProgress.tsx (4 steps: upload → read → analyze → validate)
        ├── Results.tsx
        │   ├── ResultsSummary.tsx (impacto financeiro + metricas)
        │   ├── SubscriptionCard.tsx (expandivel, com cancel link)
        │   └── SubscriptionTags.tsx (categoria + periodo)
        ├── Features.tsx
        ├── PrivacyBadge.tsx
        ├── ThemeToggle.tsx (dark mode via next-themes)
        ├── AnimatedCounter.tsx (react-countup)
        ├── ClientOnly.tsx (hydration safety)
        └── Footer.tsx
```

### Estados da Aplicacao (State Machine)

```typescript
type AppState = 'idle' | 'uploading' | 'processing' | 'streaming' | 'complete' | 'error';
```

### API Client (lib/api.ts)

```typescript
// Automatico: relativo em producao, localhost:3001 em dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''                          // Producao: mesmo dominio
    : 'http://localhost:3001'     // Dev: backend local
);
```

Funcoes exportadas:
- `analyzeStatements(files)` → POST /api/analyze
- `checkHealth()` → GET /api/health
- `getApiInfo()` → GET /api/info

### SSE Streaming (lib/use-sse-stream.ts)

Custom hook para consumir eventos SSE do pipeline em tempo real.

### Utilities (lib/utils.ts)

- `formatCurrency(value)` → "R$ 55,90"
- `formatDate(dateStr)` → "01/10/2024"
- `formatFileSize(bytes)` → "2.3 MB"
- `getConfidenceColor(confidence)` → classes Tailwind
- `getCategoryIcon(category)` → emoji
- `cn(...classes)` → classnames helper (sem dependencia externa)
- `calculatePotentialSavings(subscriptions)` → economia potencial

### Hydration Pattern

`page.tsx` e Server Component. `HomeContent.tsx` usa `isMounted` pattern para evitar hydration mismatch:
```typescript
const [isMounted, setIsMounted] = useState(false);
useEffect(() => setIsMounted(true), []);
if (!isMounted) return <Loading />;
```

### Tailwind (tailwind.config.js)

- **Cores:** `primary` (green #22c55e), `accent` (blue #3b82f6)
- **Fonte:** Inter, system-ui, sans-serif
- **Animacoes:** `fade-in`, `slide-up`, `pulse-slow`
- **Responsivo:** Mobile-first (sm/md/lg breakpoints)

---

## Seguranca

### Checklist

| Medida | Implementacao |
|--------|---------------|
| Zero storage | Buffers zerados com `.fill(0)` apos processamento |
| CORS | Origem restrita via env `CORS_ORIGIN` |
| Helmet | Headers HTTP seguros (CSP, XSS, etc) |
| File validation | Extensao OU MIME type + tamanho |
| Filename sanitization | Remove `..`, non-alnum, max 255 chars |
| Rate limiting | IP + UserAgent hash, byte-aware |
| No sensitive logging | Apenas metricas tecnicas |
| Buffer cleanup | `secureCleanupFiles()` - `.fill(0)` e seta null |
| LGPD compliance | Minimizacao de dados |
| Circuit breaker | Protege chamadas externas (DeepSeek) |

---

## Testes

### Framework: Vitest

```bash
npm run test              # Watch mode
npm run test -- --run     # Single run
npm run test:coverage     # Com cobertura
npm run test:accuracy     # Accuracy suite
```

### Arquivos de Teste (7 arquivos, ~75 testes)

| Arquivo | Tipo | Testes |
|---------|------|--------|
| `utils/date.test.ts` | Unitario | 13 |
| `utils/amount.test.ts` | Unitario | 11 |
| `utils/string.test.ts` | Unitario | 11 |
| `services/ai-classifier.test.ts` | Unitario | 14 |
| `services/analysis-service.test.ts` | Integracao | 9 |
| `test/classification-accuracy.test.ts` | Accuracy | 6 |
| `test/property-based.test.ts` | Property-based | 5 |

**CI gates:** F1 >= 0.85, Recall >= 0.90, Precision >= 0.80 (aggregate)

### Patterns de Teste

- Testes unitarios usam dados in-memory
- Testes de integracao usam CSV real com `Buffer.from(csvString)`
- IA desabilitada via `delete process.env.DEEPSEEK_API_KEY`
- Comparacoes de float usam `toBeCloseTo(value, 2)` nao `toBe()`
- Property-based tests com `fast-check`

---

## Tipos Principais

### Backend (readonly em tudo)

```typescript
interface Transaction {
  readonly date: Date;
  readonly description: string;
  readonly originalDescription: string;
  readonly amount: number;        // Sempre positivo
  readonly type: 'debit' | 'credit';
  readonly source: string;
}

interface DetectedSubscription {
  readonly id: string;
  readonly name: string;
  readonly originalNames: readonly string[];
  readonly monthlyAmount: number;
  readonly annualAmount: number;
  readonly occurrences: number;
  readonly transactions: readonly SubscriptionTransaction[];
  readonly confidence: 'high' | 'medium' | 'low';
  readonly confidenceScore?: number;   // 0-1
  readonly confidenceReasons: readonly string[];
  readonly category?: SubscriptionCategory;
  readonly cancelInstructions?: string;
  readonly detectedPeriod?: string;
  readonly priceRangeFlag?: 'normal' | 'promo' | 'above_range';
}

interface AnalysisResult {
  readonly subscriptions: readonly DetectedSubscription[];
  readonly summary: AnalysisSummary;
  readonly metadata: AnalysisMetadata;
  readonly warnings?: readonly string[];
  readonly info?: readonly string[];
  readonly installments?: readonly DetectedInstallment[];
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
}
```

### Frontend (sem readonly, Date como string)

Mesmas interfaces mas sem `readonly` e `date: string` ao inves de `date: Date`.
Inclui tipos de state machine (`AppState`, `AppAction`) e eventos SSE.

---

## Variaveis de Ambiente

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001   # Opcional (auto-detecta)
```

### Backend (.env)

```env
PORT=3001                    # Porta do servidor (default: 3001)
HOST=0.0.0.0                # Host (default: 0.0.0.0)
CORS_ORIGIN=http://localhost:3000  # Origem CORS permitida
NODE_ENV=development         # development | production (controla rate limit)
DEEPSEEK_API_KEY=sk-xxx      # OPCIONAL - IA de classificacao
MAX_FILE_SIZE=10485760       # Opcional - 10MB default
MAX_FILES=5                  # Opcional
RATE_LIMIT_MAX=10            # Opcional - requests/min em producao (default: 10)
```

---

## Deploy

### Railway (Producao)

Backend roda como processo Node.js persistente no Railway. SSE streaming funciona normalmente.

```bash
# Deploy via Railway CLI
railway up --detach
```

Frontend (Next.js) e backend (Fastify) sao servicos separados no Railway.

**Variaveis de ambiente Railway:**
- `RAILWAY_TOKEN`: Token de deploy (GitHub Actions secret)
- `CORS_ORIGIN`: URL do frontend Railway
- `NODE_ENV`: production

---

## Dependencias

### Backend

| Pacote | Versao | Uso |
|--------|--------|-----|
| `fastify` | ^4.26 | Framework HTTP |
| `@fastify/multipart` | ^8.1 | Upload de arquivos |
| `@fastify/cors` | ^9.0 | CORS |
| `@fastify/helmet` | ^11.1 | Headers de seguranca |
| `pdf-parse` | ^1.1 | Extracao de texto de PDFs |
| `csv-parse` | ^5.5 | Parse de CSVs |
| `ofx-data-extractor` | ^1.4 | Parse de OFX/QFX |
| `string-comparisons` | ^0.0.20 | Jaro-Winkler + Dice + Jaccard |
| `fuse.js` | ^7.1 | Fuzzy search para servicos conhecidos |
| `opossum` | ^9.0 | Circuit breaker para chamadas IA |
| `tsx` | ^4.7 | Dev: TypeScript runtime |
| `vitest` | ^1.2 | Testing framework |
| `fast-check` | - | Property-based testing |

### Frontend

| Pacote | Versao | Uso |
|--------|--------|-----|
| `next` | ^14.1 | Framework (App Router) |
| `react` | ^18.2 | UI |
| `react-dropzone` | ^14.2 | Drag-drop upload |
| `lucide-react` | ^0.321 | Icones |
| `motion` | ^12.34 | Animacoes |
| `next-themes` | ^0.4 | Dark mode |
| `react-countup` | ^6.5 | Contadores animados |
| `tailwindcss` | ^3.4 | Styling |

---

## Contribuindo

### Adicionar Servico Conhecido

Editar `apps/backend/src/config/known-services-data.ts`:

```typescript
novoServico: {
  canonicalName: 'Nome do Servico',
  aliases: ['alias1', 'alias2', 'ALIAS3'],
  billingDescriptors: ['PAG*NOMESERVICO', 'GOOGLE*NOMESERVICO'],
  category: 'streaming',
  cancelUrl: 'https://...',
  typicalPriceRange: { min: 19.90, max: 59.90 },
  isPopular: true,
},
```

### Adicionar Banco (Plugin System)

Criar `apps/backend/src/parsers/banks/meubanco.parser.ts` implementando `BankParserPlugin`.
Adicionar `import './meubanco.parser.js';` em `banks/index.ts`.
Veja parsers existentes como referencia.

---

## Open Finance Brasil (Fase 6)

### Arquitetura

```
Frontend                         Backend
┌──────────────┐                ┌─────────────────────┐
│ MethodSelector│                │ open-finance-ctrl   │
│ ┌────┬──────┐ │                │                     │
│ │CSV │ Bank │ │  POST /link    │ open-finance.service│
│ └────┴──────┘ │ ──────────►   │ (Pluggy SDK + CB)   │
│               │                │         │           │
│ BankConnect   │  POST /analyze │         ▼           │
│ (widget)      │ ──────────►   │ open-finance.adapter│
│               │                │ adaptTransactions() │
│ useSSEStream  │  GET /stream   │         │           │
│ (reutilizado) │ ◄──────────   │         ▼           │
│               │    SSE         │ runPipelineFrom     │
└──────────────┘                │ Transactions()      │
                                │ (normalization→...→  │
                                │  complete)           │
                                └─────────────────────┘
```

### Decisoes

- **Agregador:** Pluggy (BCB-autorizado, SDK TypeScript, 100+ bancos BR)
- **Adapter pattern:** `adaptTransactions()` isola logica Pluggy → trocar agregador requer apenas novo adapter
- **Pipeline entry point:** `runPipelineFromTransactions()` pula validation+parsing, inicia na normalizacao
- **SSE reutilizado:** Frontend usa o mesmo `useSSEStream` hook para ambos os modos
- **Circuit breaker:** `opossum` para chamadas ao Pluggy (timeout 15s, 50% threshold, reset 30s)
- **Sem persistencia:** Connection IDs sao efemeros, nao armazenados (LGPD)
- **Consent scope:** `open_finance` adicionado a `ConsentScope`

### Variaveis de Ambiente

```env
AGGREGATOR_CLIENT_ID=xxx       # Pluggy Client ID — rotas retornam 501 sem isso
AGGREGATOR_CLIENT_SECRET=xxx   # Pluggy Client Secret
```

### State Machine Frontend (estendida)

```
                    Upload path                    Open Finance path
                    ──────────                     ─────────────────
idle ─────────► uploading ──► processing ──►   idle ──► connecting-bank ──► fetching-transactions
                                    │                                              │
                                    ▼                                              ▼
                              streaming ◄──────────────────── processing (reusado)
                                    │
                                    ▼
                               complete
```
