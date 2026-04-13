# Cancelai

**Descubra assinaturas esquecidas nos seus extratos bancarios**

O Cancelai e um SaaS que analisa extratos bancarios brasileiros e identifica assinaturas recorrentes que voce pode ter esquecido. Totalmente focado em privacidade - seus dados sao processados e descartados imediatamente.

## Funcionalidades

- Upload de extratos em PDF, CSV e OFX/QFX
- Suporte a **21 bancos brasileiros** (Nubank, Itau, Bradesco, BB, Caixa, Inter, Santander, C6, PicPay, Mercado Pago, Neon, Original, Next, Sofisa, Agibank, Sicoob, Sicredi, BTG, XP, e mais)
- Deteccao inteligente de assinaturas recorrentes com **sistema de scoring ponderado v3.0 (6 sinais)**
- Calculo de gastos mensais e anuais com **destaque visual de impacto financeiro**
- Instrucoes de cancelamento para **350+ servicos conhecidos**
- Deteccao de gateway (GOOGLE X, PG *, MP *, PAYPAL *, APPLE) e parcelamentos
- Pipeline async com **streaming SSE** em tempo real
- **Zero armazenamento de dados**

> **Nota:** Pagamentos via Pix e compras avulsas nao sao considerados assinaturas. Para melhores resultados, envie extratos do cartao de credito dos ultimos 2-3 meses.

## Arquitetura

```
cancelai/
├── apps/
│   ├── backend/           # API Fastify + TypeScript
│   │   ├── src/
│   │   │   ├── config/    # Configuracoes e dados de servicos conhecidos (352)
│   │   │   ├── controllers/# Controllers REST
│   │   │   ├── detector/  # Algoritmo de deteccao legado (mantido para referencia)
│   │   │   ├── middleware/# Rate limiting inteligente
│   │   │   ├── parsers/   # Sistema de plugins por banco (21 parsers)
│   │   │   │   ├── banks/ # Um arquivo por banco (plugin system)
│   │   │   │   ├── formats/# CSV, PDF, OFX format handlers
│   │   │   │   └── registry/# ParserRegistry (Open/Closed Principle)
│   │   │   ├── pipeline/  # Pipeline async 8 stages + SSE
│   │   │   │   └── stages/# Validation, Parsing, Normalization, Grouping,
│   │   │   │              # Scoring, Sanity, AI Classification, Cleanup
│   │   │   ├── services/  # AI Classifier (DeepSeek) + Known Services (352)
│   │   │   ├── types/     # Tipos TypeScript (readonly)
│   │   │   └── utils/     # Utilitarios + LRU Cache
│   │   └── package.json
│   │
│   └── frontend/          # Next.js 14 + React + Tailwind + Motion
│       ├── src/
│       │   ├── app/       # App Router do Next.js
│       │   ├── components/# 16 componentes React (SSE streaming, dark mode)
│       │   ├── lib/       # API client, SSE hook, utilitarios
│       │   └── types/     # Tipos TypeScript (state machine)
│       └── package.json
│
└── package.json           # Monorepo root
```

## Stack Tecnologica

### Backend
- **Framework**: Fastify (escolhido pela performance superior ao Express/NestJS)
- **Linguagem**: TypeScript
- **PDF Parser**: pdf-parse
- **CSV Parser**: csv-parse
- **OFX Parser**: ofx-data-extractor
- **Similaridade**: string-comparisons (Jaro-Winkler + Dice + Token Jaccard)
- **Fuzzy Search**: fuse.js (matching de servicos conhecidos)
- **Circuit Breaker**: opossum (resiliencia na chamada de IA)
- **Seguranca**: @fastify/helmet, @fastify/cors, rate limiting customizado

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Animacoes**: Motion (framer-motion)
- **Dark Mode**: next-themes
- **Upload**: react-dropzone
- **Icones**: lucide-react

## Como Rodar Localmente

### Pre-requisitos

- Node.js 18+
- npm ou yarn

### Instalacao

```bash
# Clone o repositorio
git clone <repo-url>
cd cancelai

# Instale as dependencias
npm install

# Rode o projeto (backend + frontend)
npm run dev
```

O backend estara em `http://localhost:3001` e o frontend em `http://localhost:3000`.

### Rodando separadamente

```bash
# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend
```

### Build para producao

```bash
npm run build
```

## API Endpoints

### POST /api/analyze

Analisa extratos bancarios e retorna assinaturas detectadas (resposta sincrona).

**Request:**
- Content-Type: `multipart/form-data`
- Body: arquivos PDF, CSV ou OFX (campo `files`)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub_abc123",
        "name": "Netflix",
        "monthlyAmount": 55.90,
        "annualAmount": 670.80,
        "occurrences": 3,
        "confidence": "high",
        "confidenceScore": 0.92,
        "confidenceReasons": ["Padrao mensal consistente", "Servico conhecido"],
        "category": "streaming",
        "detectedPeriod": "monthly",
        "priceRangeFlag": "normal",
        "cancelInstructions": "https://www.netflix.com/cancelplan",
        "transactions": [...]
      }
    ],
    "summary": {
      "totalMonthlySpending": 350.70,
      "totalAnnualSpending": 4208.40,
      "subscriptionCount": 5,
      "highConfidenceCount": 4,
      "mediumConfidenceCount": 1,
      "lowConfidenceCount": 0
    },
    "metadata": {
      "processedAt": "2024-03-15T10:30:00Z",
      "processingTimeMs": 1250,
      "filesProcessed": 2,
      "bankFormatsDetected": ["Nubank", "Itau"],
      "version": "1.0.0"
    },
    "installments": [...]
  }
}
```

### POST /api/analyze/stream

Cria um job de analise assincrono para consumo via SSE.

**Request:** Mesmo formato de `/api/analyze`

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "streamUrl": "/api/analyze/job_abc123/stream"
  }
}
```

### GET /api/analyze/:jobId/stream

Stream SSE de eventos do pipeline em tempo real.

**Eventos SSE:**
- `stage-start` / `stage-complete` — progresso por stage
- `subscription-detected` — assinatura encontrada
- `progress` — porcentagem geral
- `complete` — resultado final
- `error` — erro no processamento

### GET /api/health

Health check do servidor.

### GET /api/info

Informacoes sobre limites e formatos aceitos.

---

## Algoritmo de Deteccao (v3.0 - Scoring Ponderado 6 Sinais)

O sistema utiliza um **algoritmo de scoring ponderado com 6 sinais** para calcular a confianca de cada assinatura detectada. Implementado em `pipeline/stages/scoring-stage.ts`.

### Formula de Confianca

```
confidenceScore = stringSimilarity * 0.20
                + recurrenceScore * 0.30
                + valueStabilityScore * 0.20
                + knownServiceBonus * 0.15
                + habitualityScore * 0.10
                + streamMaturity * 0.05
```

### Componentes do Score

#### 1. String Similarity (20%)
- Pipeline hibrido: Token Jaccard pre-filter (0.3) → Jaro-Winkler primary (0.88) → Dice tiebreaker (0.65)
- Normaliza nomes com 10-step pipeline (acentos, gateway prefixes, auth codes, datas, parcelas, stop words)
- LRU cache de 10K entries para performance

#### 2. Recurrence Score (30%)
- Analisa intervalos entre transacoes
- Detecta padroes semanais, quinzenais, mensais, trimestrais, semestrais e anuais
- Usa periodo detectado via mediana dos intervalos (nao mais hardcoded 30 dias)
- Maior peso pois e o indicador mais forte de assinatura

#### 3. Value Stability (20%)
- Mede consistencia dos valores cobrados
- Tolerancia de 15% para variacoes (promocoes, reajustes)
- Valores identicos = score maximo

#### 4. Known Service Bonus (15%)
- Matching 4-pass: HashMap exact → Gateway prefix removal → Substring → Fuse.js fuzzy
- Base de dados com **352 servicos brasileiros** com billing descriptors reais
- Inclui aliases e variacoes comuns de 15+ bancos

#### 5. Habituality Score (10%)
- Fracao de intervalos dentro da tolerancia do periodo detectado
- Mede regularidade real dos pagamentos

#### 6. Stream Maturity (5%)
- `min(1, span/180) * 0.6 + min(1, count/6) * 0.4`
- Favorece streams com mais historico e mais ocorrencias

### Thresholds de Confianca

| Nivel | Score | Criterio |
|-------|-------|----------|
| **Alta** | >= 0.85 | Padrao consistente + valores estaveis + servico conhecido |
| **Media** | >= 0.60 | Padrao detectavel ou valores consistentes |
| **Baixa** | >= 0.40 | Multiplas ocorrencias com alguma regularidade |

### Pipeline de Processamento (8 Stages)

```
Upload (multipart/form-data)
       │
       ▼
┌──────────────────────┐
│ 1. Validation Stage  │  Tipo MIME + extensao, tamanho, quantidade
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 2. Parsing Stage     │  Registry detecta banco → plugin especifico
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 3. Normalization     │  10-step: acentos, gateways, auth codes, stop words
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 4. Grouping Stage    │  Bigram inverted index O(n × avg_candidates)
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 5. Scoring Stage     │  Formula ponderada 6 sinais
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 6. Sanity Stage      │  Filtra TOTAL/FATURA, limite R$50k, price range
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 7. AI Classification │  DeepSeek (opcional, circuit breaker)
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ 8. Cleanup Stage     │  Buffers zerados, GC, resultado final
└──────────────────────┘
```

Cada stage emite eventos SSE para o frontend acompanhar o progresso em tempo real.

---

## Base de Servicos Conhecidos

O sistema inclui uma base curada de **352 servicos** de assinatura brasileiros com **aliases e billing descriptors reais** coletados de faturas de 15+ bancos.

**Arquivo:** [`apps/backend/src/config/known-services-data.ts`](apps/backend/src/config/known-services-data.ts)
**Engine:** [`apps/backend/src/services/known-services.ts`](apps/backend/src/services/known-services.ts)

> **Como contribuir:** Para adicionar novos servicos ou aliases, edite o arquivo de dados seguindo o padrao existente e abra um PR.

### Categorias (16)

| Categoria | Exemplos | Qtd |
|-----------|----------|-----|
| Streaming | Netflix, Disney+, Max, Globoplay, DAZN, Telecine, Paramount+ | 19 |
| Musica | Spotify, Apple Music, Deezer, YouTube Music, Tidal | 8 |
| Gaming | Xbox Game Pass, PS Plus, GeForce NOW, Roblox, Steam | 10 |
| Software | Adobe, Microsoft 365, ChatGPT, Claude, Canva, Notion, Figma, Cursor | 54 |
| Educacao | Alura, Duolingo, Coursera, Domestika, Gran Cursos | 33 |
| Fitness | Wellhub, Smart Fit, Strava, Calm | 11 |
| Delivery | iFood Club, Rappi Prime | 6 |
| Transporte | Sem Parar, ConectCar, Uber One, 99 | 9 |
| Telecom | Claro, Vivo, TIM, Oi | 8 |
| Noticias | Estadao, Folha, UOL, O Globo | 11 |
| Seguranca | NordVPN, Surfshark, Norton, ExpressVPN | 17 |
| Dating | Tinder, Bumble, Happn, Badoo | 7 |
| Financas | GuiaBolso, Serasa Premium, Kinvo, Mobills | 19 |
| Saude | Unimed, Amil, Alice Saude | 9+ |
| Seguros | Porto Seguro, SulAmerica | 8+ |
| Outros | Shein, Amazon | 6 |

### Estrutura de Servico Conhecido

```typescript
interface KnownService {
  canonicalName: string;        // Nome padrao para exibicao
  aliases: string[];            // Variacoes encontradas em extratos
  billingDescriptors: string[]; // Strings COM prefixo gateway (PAG*, GOOGLE*, etc.)
  category: SubscriptionCategory;
  cancelUrl?: string;           // Link direto para cancelamento
  cancelInstructions?: string;  // Instrucoes quando nao ha link
  cancelMethod?: CancelMethod;  // 'web' | 'app' | 'phone' | 'platform' | 'telecom'
  typicalPriceRange: {          // Faixa de preco tipica (REQUIRED)
    min: number;
    max: number;
  };
  isPopular?: boolean;          // Prioridade na deteccao
  currency?: string;            // 'BRL' | 'USD' | 'EUR/USD'
  iofApplicable?: boolean;      // Cobrado em moeda estrangeira
}
```

---

## Seguranca

O Cancelai foi projetado com foco em seguranca e privacidade:

### Dados
- **Zero armazenamento**: Arquivos sao processados em memoria e descartados
- **Cleanup seguro**: Buffers sao zerados com `.fill(0)` antes de liberar memoria
- **Sem logs sensiveis**: Conteudo dos extratos nunca e logado
- **Sem banco de dados**: Nao ha persistencia de dados do usuario

### Rate Limiting Inteligente

Sistema customizado que considera multiplos fatores:

```typescript
const LIMITS = {
  maxRequestsPerWindow: 10,        // Requisicoes por janela (default)
  maxUploadBytesPerWindow: 50MB,   // Bytes totais de upload
  windowMs: 60 * 1000,             // Janela de 1 minuto
  blockDurationMs: 5 * 60 * 1000,  // Bloqueio de 5 minutos
  suspiciousThreshold: 10,         // Limite para suspeita
};
```

**Identificacao de Cliente:**
- Hash de IP + User-Agent
- Tracking de bytes enviados
- Deteccao de padroes suspeitos

### Protecoes
- **CORS restritivo**: Apenas dominios autorizados
- **Helmet**: Headers de seguranca HTTP
- **Validacao de arquivos**: Extensao OU tipo MIME, tamanho (10MB max), quantidade (5 max)
- **Sanitizacao de filename**: Remove `..`, caracteres especiais, limite 255 chars
- **Circuit breaker**: Protege chamadas externas (IA) contra falhas em cascata

### Upload
- Maximo 10MB por arquivo
- Maximo 5 arquivos por requisicao
- PDF, CSV e OFX/QFX aceitos
- Validacao de tipo MIME expandida para diferentes browsers

---

## Deploy

### Frontend (Vercel)

```bash
cd apps/frontend
vercel deploy
```

Configure a variavel de ambiente:
- `NEXT_PUBLIC_API_URL`: URL do backend

### Backend (Railway/Fly.io)

```bash
cd apps/backend
# Railway
railway deploy

# Fly.io
fly deploy
```

Configure as variaveis de ambiente:
- `PORT`: Porta do servidor (default: 3001)
- `CORS_ORIGIN`: URL do frontend
- `NODE_ENV`: production
- `DEEPSEEK_API_KEY`: (opcional) Habilita classificacao por IA
- `RATE_LIMIT_MAX`: (opcional) Requests/min, default: 10

---

## Decisoes Tecnicas

### Por que Fastify ao inves de NestJS?

1. **Performance**: Fastify e ~2x mais rapido que Express/NestJS
2. **Simplicidade**: Para este escopo, NestJS seria over-engineering
3. **Baixo overhead**: Menos memoria, ideal para processamento de arquivos
4. **Plugins**: Ecossistema maduro para seguranca

### Por que Next.js?

1. **SSR/SSG**: Melhor SEO para landing page
2. **App Router**: Estrutura moderna e organizada
3. **Vercel**: Deploy trivial e otimizado
4. **DX**: Hot reload rapido, TypeScript nativo

### Por que nao usar banco de dados?

1. **Privacidade**: Principio de minimizacao de dados (LGPD)
2. **Simplicidade**: Sem estado = facil escalar horizontalmente
3. **Confianca**: Usuarios confiam mais se nao ha armazenamento
4. **Compliance**: Sem dados pessoais = sem compliance complexo

### Por que Scoring Ponderado com 6 Sinais?

1. **Transparencia**: Usuario entende por que algo foi detectado
2. **Ajustavel**: Pesos podem ser calibrados com dados reais
3. **Explicavel**: Cada componente tem significado claro
4. **Robusto**: Combina multiplos sinais em vez de regras rigidas
5. **Habituality e Maturity**: Capturam regularidade e historico que 4 sinais nao conseguem

### Por que Pipeline Async com SSE?

1. **UX**: Usuario ve progresso em tempo real, nao fica esperando
2. **Modularidade**: Cada stage e independente e testavel
3. **Resiliencia**: Circuit breaker protege contra falhas de IA
4. **Extensibilidade**: Adicionar stage novo = 1 arquivo

### Por que Plugin System para Parsers?

1. **Open/Closed**: Adicionar banco novo = 1 arquivo + 1 import
2. **Isolamento**: Bug em 1 parser nao afeta os outros
3. **Testabilidade**: Cada parser e testavel isoladamente

---

## Roadmap

- [x] Suporte a 21 bancos brasileiros (plugin system)
- [x] Base de 352 servicos conhecidos com billing descriptors reais
- [x] Deteccao de gateway prefixes (GOOGLE X, PG *, MP *, PAYPAL *, APPLE)
- [x] Deteccao de parcelamentos vs. assinaturas
- [x] Pipeline async 8 stages com SSE streaming
- [x] Dark mode
- [x] Circuit breaker para IA
- [x] Suporte a OFX/QFX
- [ ] Exportacao em PDF/Excel
- [ ] PWA para mobile
- [ ] API publica para integracoes
- [ ] Machine Learning para melhorar deteccao

## Contribuindo

Contribuicoes sao bem-vindas! Por favor, abra uma issue antes de enviar PRs grandes.

### Adicionar Banco Novo (Plugin System)

Criar arquivo em `apps/backend/src/parsers/banks/meubanco.parser.ts` implementando `BankParserPlugin`, e adicionar o import em `banks/index.ts`. Veja parsers existentes como referencia.

## Licenca

MIT

---

Feito para ajudar brasileiros a economizar
