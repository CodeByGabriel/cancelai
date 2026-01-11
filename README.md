# Cancelai

**Descubra assinaturas esquecidas nos seus extratos bancarios**

O Cancelai e um SaaS que analisa extratos bancarios brasileiros e identifica assinaturas recorrentes que voce pode ter esquecido. Totalmente focado em privacidade - seus dados sao processados e descartados imediatamente.

## Funcionalidades

- Upload de extratos em PDF e CSV
- Suporte a **15+ bancos brasileiros** (Nubank, Itau, Bradesco, BB, Caixa, Inter, Santander, C6, PicPay, Neon, Original, Next, Sofisa, Agibank, Sicoob, e mais)
- Deteccao inteligente de assinaturas recorrentes com **sistema de scoring ponderado**
- Calculo de gastos mensais e anuais com **destaque visual de impacto financeiro**
- Instrucoes de cancelamento para **80+ servicos conhecidos**
- Deteccao de gateway (GOOGLE X, PG *, MP *) e parcelamentos
- **Zero armazenamento de dados**

> **Nota:** Pagamentos via Pix e compras avulsas nao sao considerados assinaturas. Para melhores resultados, envie extratos do cartao de credito dos ultimos 2-3 meses.

## Arquitetura

```
cancelai/
├── apps/
│   ├── backend/           # API Fastify + TypeScript
│   │   ├── src/
│   │   │   ├── config/    # Configuracoes e constantes
│   │   │   ├── controllers/# Controllers REST
│   │   │   ├── detector/  # Algoritmo de deteccao com scoring
│   │   │   ├── middleware/# Rate limiting inteligente
│   │   │   ├── parsers/   # Parsers PDF e CSV
│   │   │   ├── services/  # Servicos conhecidos (80+)
│   │   │   ├── types/     # Tipos TypeScript
│   │   │   └── utils/     # Utilitarios
│   │   └── package.json
│   │
│   └── frontend/          # Next.js + React + Tailwind
│       ├── src/
│       │   ├── app/       # App Router do Next.js
│       │   ├── components/# Componentes React
│       │   ├── lib/       # API client e utilitarios
│       │   └── types/     # Tipos TypeScript
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
- **Similaridade**: string-similarity (Dice's Coefficient)
- **Seguranca**: @fastify/helmet, @fastify/cors, rate limiting customizado

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
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

Analisa extratos bancarios e retorna assinaturas detectadas.

**Request:**
- Content-Type: `multipart/form-data`
- Body: arquivos PDF ou CSV (campo `files`)

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
        "confidenceReasons": ["Padrao mensal detectado", "Servico conhecido"],
        "category": "streaming",
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
    }
  }
}
```

### GET /api/health

Health check do servidor.

### GET /api/info

Informacoes sobre limites e formatos aceitos.

---

## Algoritmo de Deteccao (v2.0 - Scoring Ponderado)

O sistema utiliza um **algoritmo de scoring ponderado** para calcular a confianca de cada assinatura detectada. Isso proporciona maior precisao e transparencia na deteccao.

### Formula de Confianca

```
confidenceScore = stringSimilarity * 0.25
                + recurrenceScore * 0.35
                + valueStabilityScore * 0.20
                + knownServiceBonus * 0.20
```

### Componentes do Score

#### 1. String Similarity (25%)
- Compara descricoes usando o algoritmo **Dice's Coefficient**
- Agrupa transacoes com similaridade >= 70%
- Normaliza nomes removendo caracteres especiais e numeros

```typescript
// Exemplo: "NETFLIX.COM" vs "NETFLIX COM" = 0.95 similaridade
const similarity = stringSimilarity.compareTwoStrings(
  normalize(desc1),
  normalize(desc2)
);
```

#### 2. Recurrence Score (35%)
- Analisa intervalos entre transacoes
- Detecta padroes mensais (28-35 dias) com tolerancia de +-5 dias
- Maior peso pois e o indicador mais forte de assinatura

```typescript
// Calcula desvio do padrao mensal ideal (30 dias)
const monthlyDeviation = Math.abs(avgInterval - 30);
const recurrenceScore = Math.max(0, 1 - (monthlyDeviation / 15));
```

#### 3. Value Stability (20%)
- Mede consistencia dos valores cobrados
- Tolerancia de 15% para variacoes (promocoes, reajustes)
- Valores identicos = score maximo

```typescript
const valueVariance = calculateVariance(amounts);
const valueStabilityScore = 1 / (1 + valueVariance * 10);
```

#### 4. Known Service Bonus (20%)
- Adiciona bonus se descricao corresponde a servico conhecido
- Base de dados com **80+ servicos brasileiros**
- Inclui aliases e variacoes comuns (ex: GOOGLE CRUNCHYROLL, PG *NIO FIBRA)
- Deteccao de gateway prefixes (GOOGLE, PG *, MP *, APPLE)

```typescript
const knownService = findKnownService(description);
const knownServiceBonus = knownService ? 0.20 : 0;
```

### Thresholds de Confianca

| Nivel | Score | Criterio |
|-------|-------|----------|
| **Alta** | >= 0.80 | Padrao mensal claro + valores estaveis + servico conhecido |
| **Media** | >= 0.60 | Padrao detectavel ou valores consistentes |
| **Baixa** | < 0.60 | Apenas multiplas ocorrencias |

### Fluxo de Processamento

```
Transacoes Brutas
       │
       ▼
┌──────────────────┐
│ 1. Normalizacao  │  Remove caracteres especiais, lowercase
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Agrupamento   │  Agrupa por similaridade de string
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Filtragem     │  Remove grupos com < 2 ocorrencias
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Scoring       │  Aplica formula ponderada
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. Enriquecimento│  Adiciona categoria, cancel URL
└────────┬─────────┘
         │
         ▼
   Assinaturas Detectadas
```

---

## Base de Servicos Conhecidos

O sistema inclui uma base curada de **80+ servicos** de assinatura brasileiros com **300+ aliases** reais coletados de faturas Nubank, PicPay, Mercado Pago, Itau, Bradesco e outros bancos.

**Arquivo:** [`apps/backend/src/services/known-services.ts`](apps/backend/src/services/known-services.ts)

> **Como contribuir:** Para adicionar novos servicos ou aliases, edite o arquivo acima seguindo o padrao existente e abra um PR.

### Categorias

| Categoria | Exemplos | Qtd |
|-----------|----------|-----|
| Streaming | Netflix, Prime Video, Disney+, HBO Max, Globoplay, Paramount+, Crunchyroll, Mubi, Apple TV+ | 12 |
| Musica | Spotify, Deezer, Apple Music, YouTube Premium, Tidal, Amazon Music, Audible | 7 |
| Gaming | Xbox Game Pass, PlayStation Plus, Nintendo Online, EA Play, Steam, Epic Games, Twitch, Ubisoft+ | 8 |
| Software | Adobe, Microsoft 365, Google Workspace, Canva, Notion, Figma, Slack, Zoom, ChatGPT, Claude | 12 |
| Cloud | Dropbox, Google One, iCloud+, OneDrive, pCloud | 5 |
| Fitness | Smart Fit, Wellhub (Gympass), TotalPass, Bluefit, Bodytech, Selfit | 6 |
| Delivery | iFood Club, Rappi Prime, Uber Eats, Ze Delivery, James Delivery | 5 |
| Educacao | Duolingo, Coursera, Alura, Udemy, Skillshare, Descomplica, Rocketseat, LinkedIn Learning | 8 |
| Noticias | UOL, Estadao, O Globo, Valor Economico, Medium, Exame | 6 |
| Telecom | Claro, Vivo, TIM, Oi, NIO Fibra, Brisanet, Algar, Desktop | 8 |
| Fintech | PicPay, Mercado Pago, Nubank, PagBank, Ame Digital, RecargaPay | 6 |
| E-commerce | Amazon, Shopee, AliExpress, Magazine Luiza | 4 |
| Transporte | Uber, 99, Waze Carpool, Yellow/Grow | 4 |

### Estrutura de Servico Conhecido

```typescript
interface KnownService {
  canonicalName: string;       // Nome padrao para exibicao
  aliases: string[];           // Variacoes encontradas em extratos
  category: SubscriptionCategory;
  cancelUrl?: string;          // Link direto para cancelamento
  cancelInstructions?: string; // Instrucoes quando nao ha link
  typicalPriceRange?: {        // Faixa de preco tipica
    min: number;
    max: number;
  };
  isPopular?: boolean;         // Prioridade na deteccao
}
```

---

## Seguranca

O Cancelai foi projetado com foco em seguranca e privacidade:

### Dados
- **Zero armazenamento**: Arquivos sao processados em memoria e descartados
- **Cleanup seguro**: Buffers sao zerados antes de liberar memoria
- **Sem logs sensiveis**: Conteudo dos extratos nunca e logado
- **Sem banco de dados**: Nao ha persistencia de dados do usuario

### Rate Limiting Inteligente

Sistema customizado que considera multiplos fatores:

```typescript
const LIMITS = {
  maxRequestsPerWindow: 15,        // Requisicoes por janela
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
- **Validacao de arquivos**: Tipo MIME, extensao, tamanho, sanitizacao

### Upload
- Maximo 10MB por arquivo
- Maximo 5 arquivos por requisicao
- Apenas PDF e CSV aceitos
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

### Por que Scoring Ponderado?

1. **Transparencia**: Usuario entende por que algo foi detectado
2. **Ajustavel**: Pesos podem ser calibrados com dados reais
3. **Explicavel**: Cada componente tem significado claro
4. **Robusto**: Combina multiplos sinais em vez de regras rigidas

### Por que Rate Limiting Customizado?

1. **Granularidade**: Considera bytes enviados, nao so requisicoes
2. **Inteligencia**: Detecta padroes de abuso especificos
3. **Flexibilidade**: Facil ajustar parametros sem dependencia externa
4. **Seguranca**: Hash de User-Agent dificulta bypass

---

## Roadmap

- [x] Suporte a 15+ bancos brasileiros
- [x] Base de 80+ servicos conhecidos com aliases reais
- [x] Deteccao de gateway prefixes (GOOGLE X, PG *, MP *)
- [x] Deteccao de parcelamentos vs. assinaturas
- [ ] Exportacao em PDF/Excel
- [ ] PWA para mobile
- [ ] API publica para integracoes
- [ ] Machine Learning para melhorar deteccao

## Contribuindo

Contribuicoes sao bem-vindas! Por favor, abra uma issue antes de enviar PRs grandes.

## Licenca

MIT

---

Feito para ajudar brasileiros a economizar
