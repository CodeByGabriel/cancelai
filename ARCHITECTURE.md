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
│   │       ├── components/        # React Components (Client/Server)
│   │       ├── lib/               # api.ts, utils.ts
│   │       └── types/             # TypeScript types (espelha backend)
│   │
│   └── backend/               # Fastify + TypeScript
│       └── src/
│           ├── config/            # Configuracao central + knownSubscriptions
│           ├── controllers/       # Route handlers (analysis-controller.ts)
│           ├── detector/          # Algoritmo de deteccao (subscription-detector.ts)
│           ├── middleware/        # Rate limiting (smart-rate-limit.ts)
│           ├── parsers/           # PDF/CSV extraction (pdf-parser.ts, csv-parser.ts)
│           ├── services/          # Logica de negocio
│           │   ├── analysis-service.ts    # Orquestrador principal
│           │   ├── ai-classifier.ts       # Pipeline IA (DeepSeek)
│           │   ├── deepseek-analyzer.ts   # Modulo auxiliar IA (UNUSED - dead code)
│           │   └── known-services.ts      # Banco de 80+ servicos
│           ├── utils/             # Helpers (string.ts, date.ts, amount.ts)
│           └── types/             # Interfaces (todas readonly)
│
├── api/                       # Serverless entrypoint (Vercel Functions)
│   └── index.ts                   # Adapta Fastify para serverless
├── vercel.json                # Deploy config
└── package.json               # Workspace root (engines: node >= 18)
```

---

## API Endpoints

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/api/analyze` | Analisa extratos (multipart/form-data) |
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

---

## Pipeline de Processamento

```
Upload → Validacao → Parsing → Deteccao → IA (opcional) → Resposta
                                                            ↓
                                                    Cleanup (zero buffers)
```

**Etapas detalhadas:**

1. **Rate Limit** - IP + md5(UserAgent) como chave
2. **Validacao** - Tipo (extensao + MIME), tamanho (10MB max), quantidade (5 max)
3. **Sanitizacao** - Remove `..`, caracteres nao-alfanumericos, limite 255 chars no filename
4. **Parsing** - PDF (pdf-parse + regex por banco) ou CSV (csv-parse + mapeamento de colunas)
5. **Normalizacao** - Lowercase, remove codigos/datas/prefixos bancarios
6. **Agrupamento** - String similarity >= 0.7 (Dice's Coefficient)
7. **Scoring** - Formula ponderada (ver abaixo)
8. **Validacao financeira** - Filtra TOTAL/FATURA, limite R$50k, regras para >R$500
9. **IA (opcional)** - Classifica ambiguos via DeepSeek
10. **Cleanup** - Buffers zerados, GC libera memoria

---

## Algoritmo de Deteccao (Weighted Scoring v2.0)

### Formula de Confianca

```
confidenceScore =
    stringSimilarity    x 0.25    // Similaridade de descricao
  + recurrenceScore     x 0.35    // Padrao mensal (28-35 dias)
  + valueStabilityScore x 0.20    // Consistencia de valor (±15%)
  + knownServiceBonus   x 0.20    // Servico conhecido
```

### Thresholds REAIS (codigo fonte)

| Nivel | Score | Arquivo |
|-------|-------|---------|
| **High** | >= 0.80 | `subscription-detector.ts:95` |
| **Medium** | >= 0.60 | `subscription-detector.ts:96` |
| **Low** | < 0.60 | - |

> **ATENCAO:** O `config/index.ts` define `high: 0.85` mas o detector usa `0.80`. O valor real e `0.80`.

### Validacao de Sanidade

- **Aggregate patterns:** Rejeita linhas com TOTAL, FATURA, SALDO, SUBTOTAL
- **Max amount:** R$50.000 por transacao (provavelmente erro de parsing)
- **High value:** Assinaturas > R$500 precisam de regras mais rigorosas:
  - Recorrencia >= 0.6
  - Estabilidade de valor >= 0.7
  - Similaridade de descricao >= 0.8

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

Se a IA falhar (timeout, erro, sem API key), retorna `confirmed + ambiguous` sem alteracao. **O sistema NUNCA falha por causa da IA.**

### Dead Code

`deepseek-analyzer.ts` exporta `refineWithDeepSeek()` mas **nunca e importado**. O pipeline ativo usa `ai-classifier.ts`. Este arquivo pode ser removido.

---

## Rate Limiting

### Chave de Cliente

```typescript
clientKey = `${IP}:${md5(userAgent).substring(0, 8)}`
```

### Limites por Ambiente

| Parametro | Producao | Desenvolvimento |
|-----------|----------|-----------------|
| Requests/min | 15 | 1000 |
| Upload/min | 50 MB | 500 MB |
| Block duration | 5 min | 10 seg |
| Suspicious threshold | 10 req/s | 1000 req/s |

> **IMPORTANTE:** Rate limiting e completamente **DESATIVADO** quando `NODE_ENV !== 'production'`.

### Store

In-memory `Map<string, ClientUsage>`. Em producao com multiplas instancias, considerar Redis.

---

## Parsers

### PDF (pdf-parser.ts)

Suporta 10+ bancos via regex patterns:
- Nubank, Itau, Bradesco, BB, Caixa, Inter, Santander, C6, PicPay, Mercado Pago

Cada banco tem:
- `detectPattern`: Regex para identificar o banco no conteudo
- `transactionPattern`: Regex para extrair data/descricao/valor
- `dateParser`: Funcao especifica de parse de data

### CSV (csv-parser.ts)

- Auto-detecta delimitador (`,`, `;`, `\t`, `|`)
- Auto-detecta banco via conteudo dos headers/linhas
- Mapeamento de colunas flexivel por banco

**Bug corrigido:** `detectDelimiter` usava `new RegExp('|', 'g')` sem escapar o pipe, fazendo match com tudo. Corrigido com `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### Bancos Suportados

Nubank, Itau, Bradesco, Banco do Brasil, Caixa, Inter, Santander, C6, PicPay, Mercado Pago, Neon, Original, Next, Sofisa, Agibank, Sicoob + CSV Generico (fallback).

---

## Servicos Conhecidos (known-services.ts)

80+ servicos com aliases reais de extratos bancarios.

### Estrutura

```typescript
interface KnownService {
  canonicalName: string;        // "Netflix"
  aliases: string[];            // ["netflix", "netflix.com", "nflx*"]
  category: SubscriptionCategory;
  cancelUrl?: string;
  cancelInstructions?: string;
  typicalPriceRange?: { min: number; max: number };
  isPopular?: boolean;
}
```

### Matching

Two-pass matching:
1. **Direto:** Compara descricao normalizada com cada alias
2. **Gateway prefix removal:** Remove prefixos como `PG*`, `PAG*`, `MP*`, `GOOGLE*`, `APPLE*` e tenta novamente

### Categorias

`streaming` | `music` | `gaming` | `software` | `cloud` | `news` | `fitness` | `food` | `transport` | `education` | `finance` | `other`

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
        │   └── SubscriptionCard.tsx (expandivel, com cancel link)
        ├── Features.tsx
        └── Footer.tsx
```

### Estados da Aplicacao

```typescript
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
type AnalysisStep = 'uploading' | 'reading' | 'analyzing' | 'validating' | 'complete';
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
| Zero storage | Buffers zerados apos processamento |
| CORS | Origem restrita via env `CORS_ORIGIN` |
| Helmet | Headers HTTP seguros (CSP, XSS, etc) |
| File validation | Extensao + MIME type + tamanho |
| Filename sanitization | Remove `..`, non-alnum, max 255 chars |
| Rate limiting | IP + UserAgent, byte-aware |
| No sensitive logging | Apenas metricas tecnicas |
| Buffer cleanup | `secureCleanupFiles()` - zera e seta null |
| LGPD compliance | Minimizacao de dados |

---

## Testes

### Framework: Vitest

```bash
npm run test              # Watch mode
npm run test -- --run     # Single run
npm run test:coverage     # Com cobertura
```

### Arquivos de Teste (5 arquivos, 64 testes)

| Arquivo | Testes | Status |
|---------|--------|--------|
| `utils/date.test.ts` | 13 | Todos passam |
| `utils/amount.test.ts` | 11 | 1 falha pre-existente (`isDebit` credito) |
| `utils/string.test.ts` | 11 | 1 falha pre-existente (`PAG*` prefix removal) |
| `services/ai-classifier.test.ts` | 14 | Todos passam |
| `services/analysis-service.test.ts` | 9 | Todos passam |

### Falhas Pre-existentes

1. **`amount.test.ts`:** `isDebit('100.00')` retorna `true` mas teste espera `false`
2. **`string.test.ts`:** `normalizeDescription('PAG*NETFLIX')` retorna `'pag netflix'` mas teste espera `'netflix'`

### Patterns de Teste

- Testes unitarios usam dados in-memory
- Testes de integracao usam CSV real com `Buffer.from(csvString)`
- IA desabilitada via `delete process.env.DEEPSEEK_API_KEY`
- Comparacoes de float usam `toBeCloseTo(value, 2)` nao `toBe()`

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
}

interface AnalysisResult {
  readonly subscriptions: readonly DetectedSubscription[];
  readonly summary: AnalysisSummary;
  readonly metadata: AnalysisMetadata;
  readonly warnings?: readonly string[];
  readonly info?: readonly string[];
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
}
```

### Frontend (sem readonly, Date como string)

Mesmas interfaces mas sem `readonly` e `date: string` ao inves de `date: Date`.

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
RATE_LIMIT_MAX=15            # Opcional - requests/min em producao
```

---

## Deploy

### Vercel (Recomendado)

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Serverless entrypoint** (`api/index.ts`):
- Cache de instancia Fastify para warm starts
- Converte request/response via `fastify.inject()`

### Railway (Alternativa para backend standalone)

Backend roda como processo Node.js persistente.

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
| `string-similarity` | ^4.0 | Dice's Coefficient para similaridade |
| `zod` | ^3.22 | **NUNCA IMPORTADO** - pode ser removido |
| `tsx` | ^4.7 | Dev: TypeScript runtime |
| `vitest` | ^1.2 | Testing framework |

### Frontend

| Pacote | Versao | Uso |
|--------|--------|-----|
| `next` | ^14.1 | Framework (App Router) |
| `react` | ^18.2 | UI |
| `react-dropzone` | ^14.2 | Drag-drop upload |
| `lucide-react` | ^0.321 | Icones |
| `tailwindcss` | ^3.4 | Styling |

---

## Fluxo do Usuario (UI)

```
1. LANDING PAGE
   ├── Hero: "Descubra assinaturas esquecidas no seu extrato"
   ├── Stats: 15+ bancos | 80+ servicos | 0 dados armazenados
   ├── Area de Upload (drag-drop)
   ├── Features: Seguro | Rapido | Transparente | Sem rastros
   └── FAQ: Privacidade, bancos, como funciona, gratis

2. UPLOAD
   ├── Drag-drop ou click para selecionar
   ├── Preview de arquivos com tamanho
   ├── Remover arquivos antes de enviar
   └── Botao "Analisar extratos"

3. PROCESSAMENTO (4 steps com progress bar)
   ├── Enviando arquivos
   ├── Lendo extratos
   ├── Analisando transacoes
   └── Validando resultados

4. RESULTADOS
   ├── Banner de impacto financeiro (anual + projecao 5 anos)
   ├── Grid de metricas (assinaturas, transacoes, periodo, bancos)
   ├── Indicador de confianca (verde/amarelo/cinza)
   ├── "Assinaturas confirmadas" (high confidence, borda verde)
   ├── "Pode precisar de revisao" (medium/low, aviso amarelo)
   ├── Cards expandiveis com:
   │   ├── Nome + categoria + valor mensal/anual
   │   ├── Barra de confianca visual
   │   ├── Razoes da deteccao
   │   ├── Historico de transacoes
   │   ├── Link/instrucoes de cancelamento
   │   └── Botoes: Confirmar | Rejeitar | Nao sei
   └── Botao "Analisar novamente"
```

---

## Contribuindo

### Adicionar Servico Conhecido

Editar `apps/backend/src/services/known-services.ts`:

```typescript
novoServico: {
  canonicalName: 'Nome do Servico',
  aliases: ['alias1', 'alias2', 'ALIAS3'],
  category: 'streaming',
  cancelUrl: 'https://...',
  typicalPriceRange: { min: 19.90, max: 59.90 },
  isPopular: true,
},
```

### Adicionar Banco (PDF)

Editar `apps/backend/src/parsers/pdf-parser.ts`:

```typescript
{
  name: 'Novo Banco',
  detectPattern: /novo\s*banco/i,
  transactionPattern: /(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d.,]+)/gim,
  dateParser: parseStandardDate,
},
```

### Adicionar Banco (CSV)

Editar `apps/backend/src/parsers/csv-parser.ts`:

```typescript
novoBanco: {
  date: ['Data', 'data'],
  description: ['Descricao', 'descricao', 'Historico'],
  amount: ['Valor', 'valor'],
  detectPattern: /novo\s*banco/i,
},
```
