# ROPA — Registro de Atividades de Tratamento de Dados

**Controlador:** Cancelai (Cancel.AI)
**Data:** Abril 2026
**Base Legal:** LGPD — Lei 13.709/2018, Art. 37

---

## 1. Identificacao do Controlador

| Campo | Valor |
|-------|-------|
| Nome | Cancelai (Cancel.AI) |
| Tipo | Aplicacao web SaaS |
| Contato | Via repositorio GitHub |
| Encarregado (DPO) | A designar |

---

## 2. Atividades de Tratamento

### 2.1 Analise de Extratos Bancarios

| Campo | Descricao |
|-------|-----------|
| **Finalidade** | Identificar assinaturas recorrentes em extratos bancarios |
| **Base legal** | Execucao de contrato (Art. 7, V) e Consentimento (Art. 7, I) |
| **Categorias de dados** | Descricoes de transacoes, valores, datas, tipos (debito/credito) |
| **Categorias de titulares** | Usuarios que enviam extratos voluntariamente |
| **Periodo de retencao** | Zero — dados processados em memoria e descartados imediatamente |
| **Medidas de seguranca** | Processamento em memoria, zeragem de buffers, Helmet, rate limiting, CORS |

### 2.2 Classificacao por IA (Opcional)

| Campo | Descricao |
|-------|-----------|
| **Finalidade** | Classificar transacoes ambiguas como assinatura/parcelamento/avulsa |
| **Base legal** | Consentimento (Art. 7, I) |
| **Categorias de dados** | Descricoes normalizadas de transacoes (sem PII) |
| **Operador** | DeepSeek (API de IA) |
| **Transferencia internacional** | Sim — dados enviados para servidores da DeepSeek (China) |
| **Dados transferidos** | Apenas descricoes normalizadas (ex: "NETFLIX", "SPOTIFY") |
| **PII transferido** | Nenhum — descriscoes sao normalizadas e PII e removido antes do envio |
| **Periodo de retencao (operador)** | Conforme politica da DeepSeek |

---

## 3. Dados NAO Coletados

O Cancelai NAO coleta, processa ou armazena:

- Nome do titular
- CPF/CNPJ
- Numero de conta bancaria
- Saldo bancario
- Endereco
- Email
- Telefone
- Dados de cartao de credito (numero completo)
- Cookies ou identificadores persistentes
- Dados de geolocalizacao
- Historico de navegacao

---

## 4. Medidas Tecnicas de Seguranca

| Medida | Implementacao |
|--------|---------------|
| Processamento em memoria | Arquivos nunca salvos em disco |
| Zeragem de buffers | `Buffer.fill(0)` apos processamento |
| Zero persistencia | Sem banco de dados, sem cache, sem logs de dados financeiros |
| HTTPS | Certificado SSL/TLS via Railway |
| Headers de seguranca | Helmet (CSP, X-Frame-Options, X-Content-Type-Options, etc.) |
| Rate limiting | IP + User-Agent, byte-aware, por grupo de rota |
| CORS restritivo | Apenas origens autorizadas |
| Validacao de arquivos | Extensao + MIME type, tamanho maximo 10MB |
| Sanitizacao de entrada | Nomes de arquivo sanitizados, PII removido |
| Circuit breaker | Protecao contra falhas em cascata (AI) |
| Redacao de logs | Headers sensiveis (auth, cookie) nunca logados |

---

## 5. Direitos do Titular (LGPD Art. 18)

| Direito | Como exercer |
|---------|-------------|
| Confirmacao de tratamento | Resultado exibido imediatamente na tela |
| Acesso aos dados | Resultados visiveis na interface do usuario |
| Correcao | N/A — dados nao sao armazenados |
| Eliminacao | Automatica — dados descartados apos processamento |
| Portabilidade | Resultados podem ser copiados da tela |
| Revogacao de consentimento | Via DELETE /api/consent/:sessionId |
| Oposicao | Nao enviar extratos |

---

## 6. Transferencias Internacionais

| Destinatario | Pais | Dados | Base legal |
|-------------|------|-------|-----------|
| DeepSeek API | China | Descricoes normalizadas (sem PII) | Consentimento + medidas de seguranca (Art. 33) |

**Salvaguardas:**
- Apenas descricoes de merchant normalizadas sao enviadas (ex: "NETFLIX", "SPOTIFY")
- Dados pessoais e financeiros (valores, datas, contas) NAO sao transferidos
- Funcionalidade e opcional — desativada se API key nao configurada
- Circuit breaker protege contra falhas

---

## 7. Incidentes de Seguranca

**Historico de incidentes:** Nenhum registrado.

**Procedimento de notificacao (LGPD Art. 48):**
1. Identificar escopo e impacto do incidente
2. Notificar ANPD em prazo razoavel
3. Notificar titulares afetados se risco relevante
4. Documentar medidas corretivas

**Nota:** Dado que o sistema opera com zero persistencia, o impacto de um eventual incidente e limitado a dados em transito durante o processamento (segundos).

---

## 8. Revisao

Este documento deve ser revisado:
- A cada 6 meses
- Apos mudancas significativas no processamento de dados
- Apos incidentes de seguranca
- Quando houver mudancas na legislacao aplicavel
