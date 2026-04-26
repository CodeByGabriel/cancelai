# Cancelaí — SCRATCHPAD

## Fix parser Mercado Pago: encoding CMap + 6 assinaturas detectadas

**Data:** 2026-04-26

### Problema
PDFs de fatura do Cartão Mercado Pago (Dez/2025 – Fev/2026) extraíam texto garbled.  
Exemplo: `êPWóL3EUP$ESS` em vez de `MP*ALIEXPRESS`.  
Sistema retornava "Nenhuma assinatura encontrada".

### Causa Raiz
`pdf-parse v1.1.1` usa pdfjs interno de 2018 sem suporte adequado a tabelas ToUnicode/CMap.  
PDFs mais antigos do Mercado Pago usam fontes com encoding customizado que o pdfjs antigo não resolvia.

### Correção (4 mudanças)

1. **`parser-registry.ts`** — substituído `pdfParse` por `extractPDFText`  
2. **`pdf-extractor.ts`** (NOVO) — usa `pdfjs-dist@3.11.174` com `cMapUrl` + `cMapPacked: true`  
3. **`mercadopago.parser.ts`** — reescrito com:
   - `parseMercadoPagoDate`: resolve `DD/MM` sem ano (infere o ano pelo contexto)
   - Filtros: skip de pagamentos, juros, IOF, câmbio
   - Strip do prefixo "Compra internacional em" das descrições
4. **`known-services-data.ts`** — adicionado/atualizado:
   - Claude: `CLAUDE.AI SUBSCRIPTION`, `CLAUDE.AI` nos descriptors
   - MeliPlus: `MP*MELIMAIS`, `melimais` 
   - Hostinger: serviço novo (`DM*HOSTINGERCOMBR`)
   - X Corp: serviço novo (`X CORP. PAID FEATURES`)
   - AmazonPrimeBR: alias `amazonprimebr`

### Assinaturas detectadas após fix
✅ CLAUDE.AI SUBSCRIPTION  
✅ DM*hostingercombr (Hostinger)  
✅ X CORP. PAID FEATURES (Twitter/X)  
✅ MP*MELIMAIS (Meli+)  
✅ AmazonPrimeBR  
✅ RAILWAY  

### Métricas
127 testes passando | F1=1.000 | TypeScript clean | ESLint clean
