# Cancel.AI — Plano Mestre de Execução

**O Cancel.AI é uma plataforma SaaS brasileira de detecção de assinaturas em extratos bancários**, atualmente em estado avançado de desenvolvimento após 9 fases de refatoração. O sistema processa arquivos CSV/OFX através de um pipeline de 8 estágios com streaming SSE, usando um algoritmo híbrido de similaridade (Jaro-Winkler + bigram + recorrência calendárica) contra uma base de 352 serviços conhecidos, alcançando F1=0.966. O backend Fastify e o frontend Next.js 14 estão implantados no Railway. Este plano detalha **47 tarefas atômicas organizadas em 6 fases**, cobrindo cada item pendente do roadmap, dívida técnica identificada, e preparação para produção — tudo orquestrado para execução direta via Claude Code.

---

## 1. Resumo executivo

O Cancel.AI passou por um ciclo significativo de desenvolvimento que estabeleceu fundações sólidas: pipeline async-generator com SSE, registry de 21 parsers bancários, algoritmo híbrido de classificação com métricas validadas por golden files, base de 352 serviços com detector de plataforma, frontend com Motion animations + dark mode, e auditoria de segurança. A arquitetura é coerente e bem documentada.

**O que resta fazer** se organiza em 6 eixos críticos:

- **Infraestrutura de CI/CD** — Pipeline GitHub Actions completo com testes, linting, typecheck, deploy seletivo para Railway (esforço: ~3 dias)
- **Hardening de segurança e LGPD** — Rate limiting, validação de input exaustiva, consent management, política de retenção de dados, DPO, ROPA (esforço: ~5 dias)
- **Expansão do pipeline e acurácia** — Ampliar base para 500+ serviços, melhorar normalização, adicionar TF-IDF como scorer secundário, edge cases brasileiros (esforço: ~4 dias)
- **Frontend de produção** — Error boundaries, loading states, SEO/metadata, acessibilidade (prefers-reduced-motion), performance mobile (esforço: ~3 dias)
- **SSE production-grade** — Heartbeats, reconnection com Last-Event-ID, gestão de conexões, timeout preventivo para Railway (esforço: ~2 dias)
- **Open Finance Brasil** — Integração com agregador (Pluggy/Belvo), consent flow unificado, dados normalizados (esforço: ~5 dias)

**Esforço total estimado: 22-28 dias de trabalho** com execução via Claude Code agents em paralelo onde possível.

---

## 2. Entendimento do repositório

### Stack tecnológico e estrutura

O projeto é um **monorepo TypeScript** organizado em:

```
cancelai/
├── apps/
│   ├── backend/          # Fastify + pipeline de detecção
│   │   ├── src/
│   │   │   ├── pipeline/
│   │   │   │   ├── stages/        # 8 estágios do pipeline
│   │   │   │   ├── parsers/       # 21 parsers bancários (plugin registry)
│   │   │   │   └── detector/      # Detector de plataforma (Apple/Google/Stripe/Hotmart)
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   ├── config/
│   │   │   └── known-services-data.ts  # 352 serviços
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── accuracy/          # F1=0.966, Recall=1.000, Precision=0.933
│   │   │   ├── property/          # fast-check
│   │   │   └── golden/            # Golden files
│   │   └── package.json
│   └── frontend/         # Next.js 14 App Router
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── pages/ or app/
│       │   └── animations/        # Motion/LazyMotion + will-change
│       └── package.json
├── packages/              # Shared packages
├── CLAUDE.md
├── ARCHITECTURE.md
├── SCRATCHPAD.md
├── AUDIT-REPORT.md
├── SECURITY-AUDIT.md
├── package.json           # Root workspace config
└── tsconfig.json
```

### Padrões arquiteturais implementados

O backend segue um **pipeline de processamento em 8 estágios** usando async generators, o que permite streaming de resultados via SSE conforme cada estágio produz output. Os 21 parsers bancários são registrados via plugin registry, permitindo adição de novos formatos sem modificar o core. O algoritmo de similaridade é **híbrido**: combina Jaro-Winkler para correspondência fonética, índice bigram para matching parcial, e análise de recorrência calendárica para confirmação temporal. O detector de plataforma identifica padrões específicos de cobrança da Apple (APPLE.COM/BILL), Google Play (GOOGLE*), Stripe (STRIPE*), e Hotmart.

O frontend usa **LazyMotion** com `domAnimation` para code-splitting das animações, `will-change` otimizações, e dark mode. A comunicação backend→frontend é via SSE unidirecional.

### Dívida técnica identificada (baseada no contexto do projeto)

- **CI/CD inexistente** — Deploy manual no Railway, sem pipeline automatizado de testes/build
- **SSE sem heartbeat** — Conexões podem morrer silenciosamente atrás do proxy Railway (timeout de 5 minutos)
- **Sem reconnection SSE** — Perda de dados se conexão cair durante análise
- **Rate limiting possivelmente incompleto** — Mencionado na auditoria de segurança mas escopo de implementação incerto
- **LGPD não endereçada** — Processamento de dados financeiros sem framework de compliance
- **Error boundaries limitados** — Frontend pode não ter error boundaries em todos os segmentos de rota
- **Acessibilidade motion** — `prefers-reduced-motion` possivelmente não implementado globalmente
- **Base de serviços precisa expansão** — 352 serviços é bom mas mercado brasileiro demanda 500+
- **Testes de integração E2E** — Provavelmente ausentes para fluxo completo upload→parse→detect→stream
- **Métricas de observabilidade** — Sem dashboards de saúde do pipeline em produção

---

## 3. Itens pendentes do roadmap

Baseado nas fases documentadas e no contexto fornecido, os seguintes itens estão pendentes ou incompletos:

### 3.1 Infraestrutura e DevOps

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R1 | Pipeline CI/CD completo com GitHub Actions | Workflow monorepo-aware com Turborepo, cache de dependências, testes seletivos, deploy condicional Railway | Nenhuma |
| R2 | Containerização com Dockerfile otimizado | Multi-stage build para cada serviço, cache de pnpm store | R1 |
| R3 | Health check endpoints | Backend: `/health` com uptime, memória, status do pipeline | Nenhuma |
| R4 | Observabilidade e logging estruturado | Pino JSON logging, métricas de pipeline, alertas | R3 |

### 3.2 Segurança e compliance

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R5 | Rate limiting granular por rota | Limites diferentes para upload, SSE, API reads | Nenhuma |
| R6 | Validação de input exaustiva | JSON Schema para todas as rotas, `additionalProperties: false` | Nenhuma |
| R7 | LGPD compliance framework | Consent management, política de retenção, DSAR portal, ROPA | R6 |
| R8 | Data stripping pipeline | Remover PII desnecessário dos CSVs após parsing | R7 |
| R9 | Encryption at rest para dados financeiros | AES-256 para dados armazenados | R7 |
| R10 | Breach notification workflow | Notificação em 3 dias úteis para incidentes com dados financeiros | R7 |

### 3.3 Pipeline e acurácia

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R11 | Expansão da base para 500+ serviços | Serviços brasileiros: Globoplay, iFood Club, Smart Fit, Conta Azul, etc. | Nenhuma |
| R12 | Aliases de merchant por banco | 3-10 variantes de descrição por serviço, por banco | R11 |
| R13 | TF-IDF como scorer secundário | Cosine similarity para nomes longos com ordem variável de palavras | Nenhuma |
| R14 | Normalização de merchant aprimorada | Remover prefixos brasileiros: PAG*, PGTO, DEB, PIX, TED, COMPRA | Nenhuma |
| R15 | Edge cases de detecção | Boletos recorrentes, Pix, valores variáveis, assinaturas anuais, trials | R14 |
| R16 | Categorização por tipo | Streaming, produtividade, fitness, delivery, cloud, música, gaming | R11 |

### 3.4 Frontend e UX

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R17 | Error boundaries por segmento de rota | `error.tsx`, `not-found.tsx`, `global-error.tsx` | Nenhuma |
| R18 | Loading states com Suspense | `loading.tsx` com skeletons para cada rota significativa | Nenhuma |
| R19 | SEO e metadata | `generateMetadata()`, `sitemap.xml`, `robots.txt`, Open Graph | Nenhuma |
| R20 | Acessibilidade motion global | `MotionConfig reducedMotion="user"`, `useReducedMotion` | Nenhuma |
| R21 | Performance mobile audit | Lighthouse 90+, bundle analysis, eliminação de jank | R20 |
| R22 | Dark mode completude | Verificar todos os componentes com `dark:` utilities | Nenhuma |

### 3.5 SSE production-grade

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R23 | Heartbeat SSE a cada 15s | Comentário SSE `: heartbeat\n\n` para manter conexão viva | Nenhuma |
| R24 | Reconnection com Last-Event-ID | Buffer de eventos, replay no reconnect, IDs sequenciais | R23 |
| R25 | Timeout preventivo Railway | Reconectar proativamente antes dos 5 minutos do Railway | R23 |
| R26 | Gestão de conexões ativas | Map de conexões, cleanup automático, limite de conexões | R23 |
| R27 | Graceful shutdown com drain SSE | Enviar evento `shutdown` antes de fechar, SIGTERM handler | R26 |
| R28 | Hook `useSSE` robusto no frontend | Estado de reconexão, backoff exponencial, status visual | R24, R25 |

### 3.6 Integração Open Finance Brasil

| # | Item | Escopo | Dependências |
|---|------|--------|-------------|
| R29 | Integração com agregador (Pluggy/Belvo) | SDK setup, autenticação, link de contas | R7 |
| R30 | Consent flow unificado | UI de consentimento, gestão de permissões, revogação | R29 |
| R31 | Parser para dados normalizados Open Finance | Adapter para transações do agregador no formato do pipeline | R29 |
| R32 | Modo híbrido CSV/OFX + Open Finance | Toggle entre upload manual e conexão automatizada | R31 |

---

## 4. Boas práticas aplicadas

### Claude Code workflow

O CLAUDE.md deve seguir o padrão de **100-200 linhas máximo** com foco em erros que Claude cometeria sem orientação. Cada correção durante execução deve ser registrada em `tasks/lessons.md` — o "self-improvement loop" recomendado por Boris Cherny. **Plan mode** (Shift+Tab 2x) deve ser usado para qualquer tarefa tocando mais de 2 arquivos, com documentação do plano em `tasks/todo.md` antes de execução. Subdirectory CLAUDE.md files de 50-100 linhas para `apps/backend/` e `apps/frontend/` fornecem contexto on-demand.

### Monorepo architecture

**Turborepo + pnpm workspaces** é o stack recomendado para este projeto. O `turbo.json` deve configurar `dependsOn: ["^build"]` para garantir que shared packages são compilados antes dos apps dependentes. TypeScript project references com `composite: true` e `incremental: true` habilitam caching eficiente de `.tsbuildinfo`. Shared packages devem usar o padrão **JIT** (export TypeScript direto de `src/index.ts`) para ciclo de dev mais rápido.

### Fastify security

**Atualizar para Fastify v5.3.2+** para evitar CVE de bypass de validação (CVSS 7.5). `@fastify/helmet` para hardening de headers HTTP, `@fastify/cors` com origens explícitas (nunca `origin: true`), `@fastify/rate-limit` com limites granulares por grupo de rota. Response schemas via JSON Schema servem duplo propósito: serialização rápida via `fast-json-stringify` e prevenção de data leakage.

### SSE production patterns

O **timeout de 5 minutos do Railway é não-negociável** — toda a arquitetura SSE deve ser desenhada para reconnection. Heartbeats a cada 15 segundos mantêm a conexão viva. O servidor deve enviar evento `reconnect` proativamente antes de 4.5 minutos. O cliente deve usar `Last-Event-ID` nativo do `EventSource` para replay de eventos perdidos. Um buffer circular de 100 eventos por análise garante replay sem consumo excessivo de memória.

### Testing strategy

**Property-based testing** com `@fast-check/vitest` para parsers e transformações de dados — padrões round-trip (`parse(serialize(x)) === x`) e invariantes (`confidence >= 0 && confidence <= 1`). **Golden file testing** com normalização de timestamps e IDs dinâmicos, threshold de F1 >= 0.96 como gate no CI. Combinação de ambos cobre tanto edge cases desconhecidos quanto regressão de acurácia.

### LGPD compliance

Dados financeiros em extratos bancários requerem **base legal documentada** (performance contratual para parsing, consentimento para analytics). Retenção máxima de CSVs/OFX cru: 7 dias após processamento. DSAR com prazo de **15 dias** (vs. 30 do GDPR). Notificação de breach em **3 dias úteis** para dados financeiros. Brazilian SCCs obrigatórias desde agosto 2025 para transfers cross-border. Infraestrutura deve estar na região São Paulo (AWS/GCP/Azure).

---

## 5. Plano de arquitetura

### O que preservar (fundações sólidas)

- **Pipeline async generator de 8 estágios** — Arquitetura elegante que permite streaming natural via SSE
- **Plugin registry de parsers** — Extensível sem modificar core, 21 parsers já implementados
- **Algoritmo híbrido Jaro-Winkler + bigram + recorrência** — F1=0.966 é excelente baseline
- **Detector de plataforma** — Apple/Google/Stripe/Hotmart bem segmentados
- **LazyMotion + will-change pattern** — Já otimizado para bundle size
- **Dark mode implementation** — Base funcional com next-themes + Tailwind

### O que refatorar

- **SSE connection management** — De implementação básica para production-grade com heartbeats, reconnection, e event buffering. Extrair para um módulo `SSEManager` reutilizável no backend e um hook `useSSE` robusto no frontend.
- **Known services data structure** — De flat array para estrutura indexada com aliases, categorias, e preços conhecidos. Considerar extrair para um `packages/known-services` shared package que pode ser usado tanto no backend quanto em testes.
- **Error handling** — De tratamento pontual para framework consistente com error boundaries no frontend e Fastify error handler centralizado no backend que redige informação sensível.
- **Input validation** — De validação parcial para JSON Schema completo em todas as rotas com `additionalProperties: false`.

### O que adicionar

- **GitHub Actions CI/CD** — `.github/workflows/ci.yml` e `.github/workflows/deploy.yml`
- **Turbo configuration** — `turbo.json` com tasks e caching
- **LGPD compliance layer** — Módulo de consent management, data retention service, DSAR handler
- **Observability** — Health check endpoint, métricas de pipeline, structured logging com Pino
- **Open Finance adapter** — Módulo de integração com Pluggy/Belvo no backend
- **SEO layer** — Metadata, sitemap, robots no frontend
- **Accessibility layer** — `MotionConfig reducedMotion="user"`, `prefers-reduced-motion` checks

---

## 6. Plano de execução por fases

### Fase 1: Fundações de infraestrutura (3-4 dias)

**Input:** Repositório atual sem CI/CD
**Output:** Pipeline CI automatizado, deploy seletivo, health checks

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T1: Configurar turbo.json e validar workspace | 2h | devops-engineer |
| T2: GitHub Actions CI workflow | 4h | devops-engineer |
| T3: GitHub Actions deploy workflow com Railway | 3h | deployment-engineer |
| T4: Health check endpoint no Fastify | 1h | backend-architect |
| T5: Pino structured logging | 2h | backend-architect |
| T6: Graceful shutdown handler | 2h | backend-architect |

**Checkpoint:** CI green em PR, deploy automático funcional, `/health` respondendo

### Fase 2: SSE production-grade (2-3 dias)

**Input:** SSE básico funcionando
**Output:** Streaming resiliente com reconnection completa

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T7: SSEManager no backend (heartbeat, event IDs, buffer) | 4h | backend-architect |
| T8: Timeout preventivo Railway (reconnect antes de 4.5min) | 2h | backend-architect |
| T9: Gestão de conexões ativas (Map, cleanup, limites) | 2h | backend-architect |
| T10: Hook useSSE no frontend (reconnection, backoff, status) | 4h | frontend-developer |
| T11: UI de status de conexão (connecting, reconnecting, error) | 2h | frontend-developer |
| T12: Testes de reconnection (unit + integration) | 3h | test-engineer |

**Checkpoint:** SSE sobrevive restart do backend, reconnecta automaticamente, zero perda de eventos

### Fase 3: Segurança e LGPD (4-5 dias)

**Input:** Backend funcional sem hardening completo
**Output:** Aplicação production-ready com compliance LGPD

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T13: Rate limiting granular por grupo de rota | 2h | security-engineer |
| T14: JSON Schema validation em todas as rotas | 4h | backend-architect |
| T15: Response schemas para prevenção de data leakage | 3h | security-engineer |
| T16: Error handler centralizado (sem stack traces em prod) | 2h | security-engineer |
| T17: CORS lock-down para origens explícitas | 1h | security-engineer |
| T18: @fastify/helmet com CSP configurado | 1h | security-engineer |
| T19: Consent management module | 4h | backend-architect |
| T20: Data retention service (cleanup automático) | 3h | backend-architect |
| T21: Data stripping pipeline (remover PII pós-parsing) | 3h | data-engineer |
| T22: Privacy policy page (PT-BR) | 2h | frontend-developer |
| T23: ROPA documentation | 3h | documentation-expert |
| T24: Security audit final | 3h | security-auditor |

**Checkpoint:** Penetration test básico passa, ROPA documentado, consent flow funcional, dados PII removidos após processamento

### Fase 4: Pipeline e acurácia (4-5 dias)

**Input:** 352 serviços, F1=0.966
**Output:** 500+ serviços, F1>=0.97, edge cases cobertos

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T25: Expansão da base para 500+ serviços brasileiros | 6h | data-engineer |
| T26: Sistema de aliases de merchant por banco (3-10 por serviço) | 4h | data-engineer |
| T27: Normalização aprimorada (remover PAG*, PGTO, PIX, etc.) | 3h | backend-architect |
| T28: TF-IDF scorer secundário para nomes longos | 4h | data-scientist |
| T29: Categorização por tipo (streaming, fitness, delivery, etc.) | 3h | data-engineer |
| T30: Edge cases: boletos recorrentes, Pix, valores variáveis | 4h | backend-architect |
| T31: Atualizar golden files para nova base e regras | 3h | test-engineer |
| T32: Property-based tests para novos scorers | 3h | test-engineer |
| T33: Benchmark de acurácia e report comparativo | 2h | data-scientist |

**Checkpoint:** F1>=0.97 nos golden tests, 500+ serviços validados, zero regressão em testes existentes

### Fase 5: Frontend de produção (3-4 dias)

**Input:** Frontend funcional com dark mode e animations
**Output:** Frontend production-grade com SEO, a11y, error handling

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T34: Error boundaries em todos os segmentos de rota | 3h | frontend-developer |
| T35: Loading states com Suspense + skeletons | 3h | frontend-developer |
| T36: SEO metadata (generateMetadata, sitemap, robots, OG) | 3h | seo-analyzer |
| T37: MotionConfig reducedMotion="user" global | 1h | frontend-developer |
| T38: Audit dark mode em todos os componentes | 2h | ui-ux-designer |
| T39: Lighthouse audit e otimizações | 4h | frontend-developer |
| T40: Bundle analysis com @next/bundle-analyzer | 2h | frontend-developer |
| T41: Verificar strict mode no LazyMotion | 1h | frontend-developer |

**Checkpoint:** Lighthouse 90+ em todas as métricas, zero hydration errors, dark mode consistente, a11y score verde

### Fase 6: Open Finance Brasil (5-6 dias)

**Input:** Sistema funcional com CSV/OFX
**Output:** Modo híbrido com conexão bancária automatizada

| Tarefa | Duração | Agente |
|--------|---------|--------|
| T42: Avaliar e selecionar agregador (Pluggy vs. Belvo) | 4h | architect-review |
| T43: SDK setup e autenticação com agregador | 4h | backend-architect |
| T44: Adapter de transações normalizadas para o pipeline | 4h | backend-architect |
| T45: Consent flow UI (permissões, revogação) | 4h | frontend-developer |
| T46: Toggle CSV/OFX vs. Open Finance no frontend | 3h | fullstack-developer |
| T47: Testes de integração do fluxo completo | 4h | test-engineer |

**Checkpoint:** Fluxo completo de conexão bancária → detecção funcional, consent gerenciado, fallback para CSV/OFX funcional

---

## 7. Quebra em tarefas atômicas

### T1: Configurar turbo.json e validar workspace

**Objetivo:** Adicionar Turborepo como build orchestrator ao monorepo existente.
**Arquivos afetados:** `turbo.json` (criar), `package.json` (root — adicionar turbo como devDep e scripts), `pnpm-workspace.yaml` (verificar/criar).
**Dependências:** Nenhuma.
**Critério de conclusão:** `turbo build`, `turbo test`, `turbo lint`, `turbo typecheck` executam com sucesso. Cache funciona (segunda execução é <1s para pacotes sem alteração).

### T2: GitHub Actions CI workflow

**Objetivo:** Criar pipeline de CI que roda em PRs e pushes para main.
**Arquivos afetados:** `.github/workflows/ci.yml` (criar).
**Dependências:** T1.
**Critério de conclusão:** PR aberto dispara workflow que executa install, build, lint, test, typecheck. Cache de pnpm e Turborepo funcionando. PRs com testes falhando não podem ser mergeados.

### T3: GitHub Actions deploy workflow com Railway

**Objetivo:** Deploy automático seletivo quando push na main.
**Arquivos afetados:** `.github/workflows/deploy.yml` (criar).
**Dependências:** T1, T2.
**Critério de conclusão:** Push na main com mudanças em `apps/backend/` deploya apenas backend. Push com mudanças em `apps/frontend/` deploya apenas frontend. Push com mudanças em `packages/` deploya ambos.

### T4: Health check endpoint

**Objetivo:** Endpoint `/health` com informações de uptime, memória, e status.
**Arquivos afetados:** `apps/backend/src/controllers/health.controller.ts` (criar), `apps/backend/src/routes/` (registrar rota).
**Dependências:** Nenhuma.
**Critério de conclusão:** `GET /health` retorna 200 com `{ status, uptime, memory, timestamp }`. Configurado como healthcheck no Railway.

### T5: Pino structured logging

**Objetivo:** Logging JSON estruturado com redação de headers sensíveis.
**Arquivos afetados:** `apps/backend/src/config/` (configuração do Fastify), logger setup.
**Dependências:** Nenhuma.
**Critério de conclusão:** Logs em JSON em produção, pino-pretty em dev. Headers `authorization` e `cookie` redigidos. `trustProxy: true` configurado.

### T6: Graceful shutdown handler

**Objetivo:** Shutdown limpo em SIGTERM (deploy Railway).
**Arquivos afetados:** `apps/backend/src/index.ts` ou entry point principal.
**Dependências:** Nenhuma.
**Critério de conclusão:** SIGTERM fecha conexões SSE com evento `shutdown`, aguarda 10s, encerra processo. `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=10` configurado.

### T7: SSEManager no backend

**Objetivo:** Módulo centralizado para gestão de streams SSE com heartbeats e event IDs.
**Arquivos afetados:** `apps/backend/src/services/sse-manager.ts` (criar), controller de análise (refatorar para usar SSEManager).
**Dependências:** T6.
**Critério de conclusão:** Cada evento SSE tem `id` sequencial. Heartbeats enviados a cada 15s. Buffer circular de 100 eventos por análise. Eventos têm campo `retry: 3000`.

### T8: Timeout preventivo Railway

**Objetivo:** Reconectar proativamente antes do timeout de 5 minutos do Railway.
**Arquivos afetados:** `apps/backend/src/services/sse-manager.ts`.
**Dependências:** T7.
**Critério de conclusão:** Servidor envia `event: reconnect` com `data: {"reason":"timeout_prevention"}` aos 4 minutos e 30 segundos. Cliente reconecta automaticamente.

### T9: Gestão de conexões ativas

**Objetivo:** Tracking e cleanup de conexões SSE com limite máximo.
**Arquivos afetados:** `apps/backend/src/services/sse-manager.ts`.
**Dependências:** T7.
**Critério de conclusão:** Map de conexões ativas com `createdAt`. Cleanup periódico de conexões stale. Warning em log quando >80% do limite. Métricas em `/health`.

### T10: Hook useSSE no frontend

**Objetivo:** React hook robusto para consumo de SSE com reconnection e backoff exponencial.
**Arquivos afetados:** `apps/frontend/src/hooks/useSSE.ts` (criar ou refatorar).
**Dependências:** T7, T8.
**Critério de conclusão:** Hook gerencia `EventSource` com estados `connecting | connected | reconnecting | complete | error`. Backoff exponencial até 30s. Máximo de 20 tentativas. `Last-Event-ID` enviado automaticamente. Cleanup em unmount.

### T11: UI de status de conexão

**Objetivo:** Indicador visual de status da conexão SSE.
**Arquivos afetados:** `apps/frontend/src/components/ConnectionStatus.tsx` (criar).
**Dependências:** T10.
**Critério de conclusão:** Ícone/badge mostra estado atual. Toast/notificação quando reconectando. Mensagem amigável quando erro permanente. Animação sutil com Motion.

### T12: Testes de reconnection SSE

**Objetivo:** Cobertura de testes para cenários de reconnection.
**Arquivos afetados:** `apps/backend/tests/sse/` (criar diretório e testes).
**Dependências:** T7, T8, T9.
**Critério de conclusão:** Testes cobrem: conexão normal com todos os eventos, reconnection com Last-Event-ID, timeout preventivo, cleanup de conexão stale, graceful shutdown com drain.

### T13–T18: Security hardening (detalhadas acima na Fase 3)

Cada tarefa de segurança é atômica: rate limiting, JSON Schema, response schemas, error handler, CORS, helmet. **Critério unificado:** Nenhuma rota aceita payload não-validado, nenhuma resposta 5xx contém stack trace, CORS rejeita origens não-listadas.

### T19: Consent management module

**Objetivo:** Módulo backend para gestão de consentimento LGPD.
**Arquivos afetados:** `apps/backend/src/services/consent.service.ts` (criar), `apps/backend/src/controllers/consent.controller.ts` (criar), rotas.
**Dependências:** T14.
**Critério de conclusão:** API para registrar, consultar, e revogar consentimento. Registro com timestamp, base legal, e escopo. Revogação dispara limpeza de dados associados.

### T20: Data retention service

**Objetivo:** Serviço automático de cleanup de dados conforme política de retenção.
**Arquivos afetados:** `apps/backend/src/services/data-retention.service.ts` (criar).
**Dependências:** T19.
**Critério de conclusão:** CSVs/OFX crus deletados após 7 dias. Resultados de análise mantidos enquanto conta ativa + 30 dias. Job periódico (cron) executa cleanup. Audit log de todas as deleções.

### T21: Data stripping pipeline

**Objetivo:** Remover PII desnecessário dos dados de extrato após parsing.
**Arquivos afetados:** `apps/backend/src/pipeline/stages/` (adicionar estágio ou modificar parser output).
**Dependências:** T19.
**Critério de conclusão:** Após parsing, dados retém apenas: descrição do merchant, valor, data, tipo de transação. Números de conta, saldos, e dados pessoais são descartados.

### T25: Expansão da base para 500+ serviços

**Objetivo:** Adicionar serviços brasileiros relevantes à base known-services.
**Arquivos afetados:** `apps/backend/src/known-services-data.ts`.
**Dependências:** Nenhuma.
**Critério de conclusão:** Base contém 500+ serviços com cobertura de: streaming brasileiro (Globoplay, Telecine, Paramount+), delivery (iFood Club, Rappi Prime), fitness (Smart Fit, Bio Ritmo, Gympass/Wellhub), SaaS brasileiro (Conta Azul, RD Station, Bling), telecom (Claro, Vivo, Tim, Oi), seguros, e planos de saúde. Cada serviço tem nome, categoria, plataforma, e pelo menos 2 aliases.

### T26–T33: Pipeline e acurácia (detalhadas acima na Fase 4)

**Critério unificado:** Golden tests passam com F1>=0.97, zero regressão em cenários existentes, novos edge cases cobertos com golden files específicos.

### T34–T41: Frontend de produção (detalhadas acima na Fase 5)

**Critério unificado:** Lighthouse 90+ em Performance, Accessibility, Best Practices, SEO. Zero console errors. Dark mode consistente em todos os componentes. Animations respeitam `prefers-reduced-motion`.

### T42–T47: Open Finance Brasil (detalhadas acima na Fase 6)

**Critério unificado:** Fluxo completo de link bancário → consentimento → pull de transações → detecção → resultados funcional end-to-end. Fallback para CSV/OFX funcional. Consentimento revogável.

---

## 8. Estratégia de coordenação de agentes

### Mapeamento de agentes por responsabilidade

| Agente | Responsabilidades primárias | Tarefas |
|--------|---------------------------|---------|
| **devops-engineer** | CI/CD, Turborepo, GitHub Actions | T1, T2, T3 |
| **deployment-engineer** | Railway config, deploy workflows | T3 |
| **backend-architect** | Pipeline, SSE, Fastify config, serviços | T4, T5, T6, T7, T8, T9, T14, T19, T20, T27, T30, T43, T44 |
| **security-engineer** | Hardening, rate limiting, CORS, helmet | T13, T15, T16, T17, T18 |
| **security-auditor** | Audit final, validação de compliance | T24 |
| **frontend-developer** | Componentes, hooks, error boundaries, SEO | T10, T11, T22, T34, T35, T39, T40, T41, T45 |
| **data-engineer** | Base de serviços, aliases, categorias, data stripping | T21, T25, T26, T29 |
| **data-scientist** | TF-IDF, benchmark de acurácia, scoring | T28, T33 |
| **test-engineer** | Testes de SSE, golden files, property tests | T12, T31, T32, T47 |
| **ui-ux-designer** | Dark mode audit, acessibilidade visual | T38 |
| **seo-analyzer** | Metadata, sitemap, robots, Open Graph | T36 |
| **documentation-expert** | ROPA, privacy policy, documentação | T23 |
| **architect-review** | Avaliação de agregador Open Finance | T42 |
| **fullstack-developer** | Toggle CSV/Open Finance, integração E2E | T46 |
| **typescript-pro** | Shared types, type safety, refactoring | Consultivo em T7, T10, T14 |
| **context-manager** | Manter SCRATCHPAD.md e lessons.md atualizados | Contínuo |

### Execução paralela vs. sequencial

```
FASE 1 (Infraestrutura):
  ┌─ T1 (turbo.json)
  │    └─ T2 (CI) ──┐
  │         └─ T3 (deploy) ──→ CHECKPOINT 1
  ├─ T4 (health) ───────┘ (paralelo com T2)
  ├─ T5 (logging) ──────── (paralelo com T2)
  └─ T6 (shutdown) ─────── (paralelo com T2)

FASE 2 (SSE) — depende de T6:
  ┌─ T7 (SSEManager) ─────┐
  │    ├─ T8 (timeout) ────┤
  │    └─ T9 (conexões) ───┤
  └────────────────────────└─ T12 (testes SSE)
  ┌─ T10 (useSSE hook) ─── depende de T7
  │    └─ T11 (UI status) ─→ CHECKPOINT 2

FASE 3 (Segurança) — paralela com Fase 2 exceto T19-T21:
  ┌─ T13 (rate limit) ──┐
  ├─ T14 (validation) ──┤ (todas paralelas)
  ├─ T15 (response) ────┤
  ├─ T16 (error handler)┤
  ├─ T17 (CORS) ────────┤
  └─ T18 (helmet) ──────┘
           └─ T19 (consent) ─┐
                T20 (retention)┤ (sequenciais)
                T21 (stripping)┤
                T22 (privacy)──┤
                T23 (ROPA) ────┤
                T24 (audit) ───→ CHECKPOINT 3

FASE 4 (Pipeline) — paralela parcial:
  ┌─ T25 (500+ serviços)─── ┐
  ├─ T26 (aliases) ──────── ┤ (depende de T25)
  ├─ T27 (normalização) ─── ┤ (paralelo)
  ├─ T28 (TF-IDF) ──────── ┤ (paralelo)
  ├─ T29 (categorias) ──── ┤ (depende de T25)
  └─ T30 (edge cases) ──── ┤ (depende de T27)
           └─ T31 (golden files) ── ┤ (depende de T25-T30)
              T32 (prop tests) ───── ┤ (paralelo com T31)
              T33 (benchmark) ──────→ CHECKPOINT 4

FASE 5 (Frontend) — paralela internamente:
  ┌─ T34 (error bounds)── ┐
  ├─ T35 (loading) ────── ┤
  ├─ T36 (SEO) ────────── ┤ (todas paralelas)
  ├─ T37 (a11y motion) ── ┤
  ├─ T38 (dark mode) ──── ┤
  ├─ T41 (LazyMotion) ─── ┤
  └──────────────────────── └─ T39 (Lighthouse) ─── ┐
                                T40 (bundle) ───────→ CHECKPOINT 5

FASE 6 (Open Finance) — sequencial majoritariamente:
  T42 (avaliar) → T43 (SDK) → T44 (adapter) → T45 (UI) → T46 (toggle) → T47 (testes)
  → CHECKPOINT 6 (FINAL)
```

### Checkpoints e gates

| Checkpoint | Critérios de passagem |
|-----------|----------------------|
| **CP1** | CI green, deploy automático funcional, `/health` 200 OK |
| **CP2** | SSE sobrevive 10 minutos sem perda de eventos, reconnection funcional |
| **CP3** | Zero rotas sem validação, zero data leakage em responses, ROPA completo |
| **CP4** | F1>=0.97, 500+ serviços, zero regressão nos golden tests existentes |
| **CP5** | Lighthouse 90+ em todas as métricas, zero console errors |
| **CP6** | Fluxo Open Finance E2E funcional, fallback CSV/OFX funcional |

---

## 9. Validação e qualidade

### Critérios de aceitação por categoria

**Backend:**
- Cada rota tem JSON Schema para request AND response
- Zero stack traces em respostas 5xx de produção
- Rate limiting ativo e testado (retorna 429 após exceder limite)
- Health check retorna dados precisos de uptime e memória
- Graceful shutdown encerra conexões SSE antes de fechar
- Pino logging em JSON com headers sensíveis redigidos

**SSE:**
- Heartbeats observáveis a cada 15 segundos em conexão ativa
- Reconnection automática após desconexão com replay de eventos perdidos
- Zero perda de eventos durante reconnection verificada por testes
- Conexões stale removidas após 4.5 minutos
- Limite de conexões simultâneas respeitado

**Pipeline/Acurácia:**
- F1 >= 0.97 medido por golden file tests
- Precision >= 0.93 (no false positives para o usuário)
- Recall >= 1.00 (mantido — não perder nenhuma assinatura real)
- 500+ serviços na base com pelo menos 2 aliases cada
- Edge cases (boleto, Pix, valores variáveis) cobertos por golden files específicos

**Frontend:**
- Lighthouse Performance >= 90
- Lighthouse Accessibility >= 90
- Lighthouse Best Practices >= 90
- Lighthouse SEO >= 90
- Zero hydration errors em produção
- Dark mode visualmente consistente em todos os componentes
- `prefers-reduced-motion: reduce` desabilita animações de transform
- Error boundaries capturam e exibem erros em cada segmento de rota

**LGPD:**
- Consent registrado antes de qualquer processamento de dados
- CSVs/OFX deletados em <= 7 dias após processamento
- DSAR endpoint funcional com resposta em formato exportável
- Privacy policy em PT-BR acessível
- ROPA documentado e mantido

### Definition of Done (global)

Uma tarefa está **done** quando:
1. Código implementado e funcional
2. Testes relevantes passando (unit, integration, ou golden conforme aplicável)
3. TypeScript typecheck passa sem erros
4. Lint passa sem warnings
5. PR review aprovado (ou auto-review para tarefas menores)
6. Documentação atualizada (ARCHITECTURE.md, SCRATCHPAD.md conforme necessário)
7. CLAUDE.md/lessons.md atualizados se houve aprendizado

---

## 10. Impacto em arquivos e estrutura

### Arquivos a criar

| Arquivo | Fase | Propósito |
|---------|------|-----------|
| `turbo.json` | F1 | Configuração do Turborepo |
| `.github/workflows/ci.yml` | F1 | Pipeline de CI |
| `.github/workflows/deploy.yml` | F1 | Deploy seletivo Railway |
| `apps/backend/src/controllers/health.controller.ts` | F1 | Health check |
| `apps/backend/src/services/sse-manager.ts` | F2 | Gestão SSE production-grade |
| `apps/frontend/src/hooks/useSSE.ts` | F2 | Hook SSE com reconnection |
| `apps/frontend/src/components/ConnectionStatus.tsx` | F2 | UI de status SSE |
| `apps/backend/tests/sse/` (diretório + testes) | F2 | Testes de SSE |
| `apps/backend/src/services/consent.service.ts` | F3 | Consent management |
| `apps/backend/src/controllers/consent.controller.ts` | F3 | API de consentimento |
| `apps/backend/src/services/data-retention.service.ts` | F3 | Cleanup automático |
| `apps/frontend/src/app/privacy/page.tsx` | F3 | Página de privacidade |
| `docs/ROPA.md` | F3 | Records of Processing Activities |
| `apps/frontend/src/app/error.tsx` | F5 | Root error boundary |
| `apps/frontend/src/app/global-error.tsx` | F5 | Global error boundary |
| `apps/frontend/src/app/loading.tsx` | F5 | Root loading state |
| `apps/frontend/src/app/sitemap.ts` | F5 | Sitemap dinâmico |
| `apps/frontend/src/app/robots.ts` | F5 | Robots.txt |
| `apps/backend/src/adapters/open-finance.adapter.ts` | F6 | Adapter Open Finance |

### Arquivos a modificar

| Arquivo | Fase | Modificação |
|---------|------|-------------|
| `package.json` (root) | F1 | Adicionar turbo, scripts monorepo |
| `apps/backend/src/index.ts` | F1, F2 | Logging config, graceful shutdown, SSEManager |
| `apps/backend/src/config/` | F1, F3 | trustProxy, bodyLimit, security plugins |
| `apps/backend/src/known-services-data.ts` | F4 | Expandir para 500+ serviços |
| `apps/backend/src/pipeline/stages/` | F3, F4 | Data stripping, normalização |
| `apps/backend/src/pipeline/detector/` | F4 | Edge cases brasileiros |
| `apps/frontend/src/app/layout.tsx` | F5 | MotionConfig, metadata, error handling |
| `apps/frontend/tests/golden/` | F4 | Atualizar golden files |
| `CLAUDE.md` | Contínuo | Atualizar com lessons learned |
| `ARCHITECTURE.md` | Final | Atualizar com novas decisões |
| `SCRATCHPAD.md` | Contínuo | Tracking de progresso |

### Arquivos a deletar

Nenhum arquivo deve ser deletado nesta iteração. A arquitetura existente é preservada; as mudanças são aditivas ou de refatoração in-place.

---

## 11. Ordem recomendada de implementação

A ordem otimiza para: (1) unblock do máximo de trabalho paralelo, (2) estabilidade antes de features, (3) segurança antes de expansão.

```
SEMANA 1:
  Dia 1-2: T1 → T4, T5, T6 (em paralelo após T1)
  Dia 2-3: T2, T3 (CI/CD)
  Dia 3-4: T7, T8, T9 (SSEManager backend)
  Dia 4-5: T13, T14, T15, T16, T17, T18 (security — paralelo com T10, T11)

SEMANA 2:
  Dia 6-7: T10, T11, T12 (SSE frontend + testes)
  Dia 7-8: T19, T20, T21 (LGPD backend)
  Dia 8-9: T22, T23, T24 (LGPD docs + audit)
  Dia 9-10: T25, T26, T27 (base de serviços + normalização)

SEMANA 3:
  Dia 11-12: T28, T29, T30 (TF-IDF + categorias + edge cases)
  Dia 12-13: T31, T32, T33 (testes de acurácia)
  Dia 13-14: T34, T35, T36, T37, T38 (frontend — paralelo)
  Dia 14-15: T39, T40, T41 (performance audit)

SEMANA 4:
  Dia 16-17: T42, T43 (Open Finance avaliação + setup)
  Dia 18-19: T44, T45 (adapter + UI)
  Dia 20-21: T46, T47 (integração + testes E2E)
  Dia 22: Review final, atualizar docs, tag release
```

---

## 12. Riscos, assunções e decisões

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| **Railway 5-min timeout causa perda de dados** | Alta | Alto | Implementar reconnection com Last-Event-ID antes de qualquer outra feature (Fase 2) |
| **Expansão para 500+ serviços introduz falsos positivos** | Média | Médio | Threshold tuning por categoria + golden file regression gate no CI |
| **LGPD enforcement em dados financeiros** | Média | Muito Alto | Implementar compliance completo na Fase 3, antes de qualquer expansão de features |
| **Agregador Open Finance muda API** | Média | Médio | Camada de adapter (T44) isola pipeline do agregador; trocar agregador requer apenas novo adapter |
| **Fastify CVE de bypass de validação** | Alta se não atualizado | Alto | Verificar versão do Fastify é >= 5.3.2 na T14, atualizar se necessário |
| **Golden files ficam stale com mudanças de pipeline** | Média | Médio | Processo de review obrigatório para qualquer mudança de golden file; atualização deve passar por PR |
| **Bundle size cresce com novos componentes/features** | Baixa | Médio | Bundle analysis contínua (T40), LazyMotion strict mode (T41) |

### Assunções

1. **O repositório usa pnpm** como package manager (inferido do contexto de monorepo TypeScript)
2. **Fastify v4.x ou v5.x** está em uso (verificar versão exata e atualizar se necessário)
3. **Next.js 14 com App Router** está configurado (não Pages Router)
4. **Vitest** é o test runner (mencionado property-based tests com fast-check)
5. **Railway free/hobby tier** — limitações de timeout e resources aplicam
6. **Não há banco de dados persistente** atualmente — o sistema processa CSVs/OFX stateless (verificar se há Postgres/Redis)
7. **O pipeline completa tipicamente em < 5 minutos** — se não, a estratégia de reconnection precisa ser mais agressiva
8. **Não há autenticação de usuário** implementada atualmente — consent management LGPD requer pelo menos sessão/identificação

### Decisões a validar

| Decisão | Alternativas | Critério de decisão |
|---------|-------------|-------------------|
| **Turborepo vs. Nx** | Turborepo (recomendado): mais simples, suficiente para monorepo pequeno. Nx: mais features, mais complexo | Se o monorepo tem < 10 packages, Turborepo. Se > 10 ou precisa de generators, Nx |
| **Pluggy vs. Belvo** para Open Finance | Pluggy: brasileiro, BCB-autorizado, SDKs em PT-BR. Belvo: mais maduro, maior cobertura LATAM | Avaliar: cobertura de bancos brasileiros, pricing, qualidade de normalização de transações |
| **Persistir dados ou stateless** | Stateless (atual): simples, LGPD-friendly. Persistente: permite histórico, análise longitudinal | Se o roadmap inclui tracking de assinaturas ao longo do tempo, persistência é necessária |
| **SCC ou adapter pattern** para Open Finance | Adapter pattern (recomendado): isola pipeline do agregador. SCC: mais rápido, menos flexível | Adapter pattern permite trocar agregador sem tocar no pipeline core |
| **Domination domAnimation vs. domMax** | domAnimation (~15kb): animações, variants, exit. domMax (~25kb): adiciona drag e layout | Se não usa drag/layout animations, domAnimation é suficiente |

---

## 13. Instruções finais para modo de execução

### Preparação do ambiente Claude Code

1. **Atualizar CLAUDE.md** com as informações deste plano — seção de Quick Commands, Coding Standards, e Task Management
2. **Criar `tasks/master-plan.md`** com este documento completo para referência durante execução
3. **Criar `tasks/lessons.md`** vazio — será populado durante execução com aprendizados
4. **Criar `tasks/progress.md`** com checklist das 47 tarefas

### Fluxo de execução por tarefa

```
Para cada tarefa Tn:
1. Entrar em Plan Mode (Shift+Tab 2x)
2. Ler a descrição da tarefa em tasks/master-plan.md
3. Identificar arquivos afetados e ler cada um
4. Escrever plano detalhado em tasks/todo.md
5. Sair de Plan Mode, executar implementação
6. Rodar testes relevantes: `turbo test --filter=<package>`
7. Rodar typecheck: `turbo typecheck`
8. Commitar com mensagem descritiva: `feat(scope): description [Tn]`
9. Marcar tarefa como completa em tasks/progress.md
10. Se houve correção/aprendizado, atualizar tasks/lessons.md
11. /clear se contexto > 60k tokens
```

### Comandos essenciais

```bash
# Desenvolvimento
pnpm dev                              # Start all apps
pnpm build                            # Build all packages
turbo test                            # Run all tests
turbo typecheck                       # TypeScript checks
turbo lint                            # Lint all packages

# Testes específicos
turbo test --filter=backend           # Só backend
turbo test --filter=frontend          # Só frontend
pnpm --filter backend test:golden     # Golden file tests
pnpm --filter backend test:accuracy   # Accuracy benchmark

# Análise
ANALYZE=true pnpm --filter frontend build  # Bundle analysis
```

### Regras para agents Claude Code

Incluir no CLAUDE.md ou em arquivo `.claude/agents/` por role:

```markdown
## Agent Rules
- NEVER commit code that fails typecheck
- ALWAYS run tests after implementation
- NEVER expose stack traces in production error responses
- ALWAYS validate inputs with JSON Schema (additionalProperties: false)
- ALWAYS add event IDs to SSE events (sequential integers)
- NEVER use `origin: true` in @fastify/cors
- ALWAYS use 'use client' only at leaf components
- NEVER animate width, height, top, left — only transform and opacity
- ALWAYS respect prefers-reduced-motion
- ALWAYS write Portuguese for user-facing text
- ALWAYS document decisions in ARCHITECTURE.md
- If a golden test fails, investigate before updating golden file
```

### Uso dos skills disponíveis

| Skill | Quando usar |
|-------|------------|
| **senior-backend** | T7-T9 (SSEManager), T14 (validation), T19-T20 (consent/retention) |
| **pdf-processing / pdf-processing-pro** | Se futuro suporte a PDF de extratos bancários for adicionado |
| **mobile-design** | T39 (Lighthouse mobile audit), T21 (performance mobile) |
| **ui-ux-pro-max** | T38 (dark mode audit), T11 (connection status UI), T45 (consent UI) |
| **seo-optimizer** | T36 (metadata, sitemap, robots) |
| **xlsx** | Se futuro suporte a XLSX de extratos bancários for adicionado |

### Uso dos commands disponíveis

| Command | Quando usar |
|---------|------------|
| **code-review** | Após cada checkpoint (CP1-CP6), rodar code-review no diff acumulado |
| **design-database-schema** | Se decisão de adicionar persistência for tomada (ver Decisões a validar) |

### Critério de conclusão do plano completo

O plano está **100% executado** quando:

- Todos os 6 checkpoints passam
- CI pipeline green com todos os testes
- F1 >= 0.97 nos golden tests
- Lighthouse 90+ em todas as métricas
- ROPA documentado e privacy policy publicada
- SSE sobrevive 30 minutos sem perda de eventos
- Deploy automático funcional para ambos serviços
- `tasks/progress.md` mostra todas as 47 tarefas completadas
- `ARCHITECTURE.md` reflete o estado atual do sistema
- `tasks/lessons.md` contém aprendizados acumulados