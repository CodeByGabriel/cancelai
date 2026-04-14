# Decisao: Agregador Open Finance Brasil

## Contexto

O Cancelai precisa de um agregador Open Finance Brasil para permitir conexao bancaria direta como alternativa ao upload de extratos CSV/OFX/PDF. O agregador deve fornecer acesso a transacoes bancarias via API, com autorizacao do Banco Central do Brasil.

## Candidatos avaliados

### Pluggy (pluggy.ai)

**Pros:**
- Participante autorizado pelo BCB no ecossistema Open Finance Brasil
- Foco exclusivo no mercado brasileiro — suporte e docs em PT-BR
- SDK TypeScript oficial (`pluggy-sdk` no npm) com tipos completos
- Cobertura de 100+ instituicoes financeiras brasileiras (Nubank, Itau, Bradesco, Inter, Santander, BB, Caixa, etc.)
- Retorna dados normalizados: merchant name, category, MCC code — mapeamento direto para o tipo `Transaction` do pipeline
- Pluggy Connect: widget embeddable (iframe) para fluxo de consentimento — sem necessidade de construir UI de login
- Free tier para desenvolvimento/sandbox
- Webhooks para notificacao de status de conexao
- API RESTful com paginacao e filtros por data

**Contras:**
- Menor presenca fora do Brasil (nao relevante para o Cancelai)
- Documentacao menos extensa que Belvo (mas suficiente)
- Empresa menor — menor track record

### Belvo (belvo.com)

**Pros:**
- Plataforma madura com cobertura LATAM (Brasil, Mexico, Colombia)
- SDK TypeScript disponivel (`belvo-typescript-sdk`)
- Documentacao extensa e bem organizada
- Widget de conexao (Belvo Connect) similar ao Pluggy Connect
- Maior base de clientes e historico

**Contras:**
- Foco multi-pais dilui esforco no Brasil — cobertura bancaria brasileira menor que Pluggy
- Normalizacao de transacoes menos adaptada ao mercado brasileiro
- Pricing mais alto para volume baixo
- Nao e participante direto do Open Finance Brasil via BCB (usa intermediarios em alguns casos)

## Decisao: Pluggy

### Justificativa tecnica
1. **Compatibilidade de dados:** Pluggy retorna `merchantName`, `category` e `amount` em formato que mapeia diretamente para `Transaction { description, originalDescription, amount, type, source }` do pipeline — minimiza logica no adapter.
2. **SDK TypeScript:** `pluggy-sdk` fornece tipos para `Item`, `Account`, `Transaction`, `Connector` — type-safety sem necessidade de tipar manualmente.
3. **Widget embeddable:** Pluggy Connect elimina necessidade de construir UI de autenticacao bancaria — o usuario faz login no widget e o Cancelai recebe um `itemId` (connectionId) para buscar transacoes.
4. **Autorizacao BCB:** Participante direto do Open Finance Brasil — conformidade regulatoria sem intermediarios.

### Justificativa de negocio
1. **Mercado-alvo:** Cancelai e 100% focado no Brasil — Pluggy's foco identico maximiza cobertura.
2. **Custo:** Free tier para desenvolvimento. Pricing competitivo para producao.
3. **Risco de vendor lock-in:** Mitigado pelo adapter pattern — `open-finance.adapter.ts` isola toda logica Pluggy-especifica. Trocar para Belvo requer apenas novo adapter + service, sem alterar pipeline.

### Padroes de integracao
- **Adapter pattern:** `adaptTransactions(pluggyTransactions) → Transaction[]`
- **Circuit breaker:** `opossum` para chamadas ao Pluggy SDK (mesmo padrao do AI classifier)
- **Lazy initialization:** Cliente Pluggy instanciado sob demanda
- **Sem persistencia:** Connection IDs sao efemeros, vivem na sessao do cliente (LGPD)

## Proximos passos
- T43: Instalar `pluggy-sdk`, criar servico e rotas
- T44: Implementar adapter para o pipeline
