# Benchmark de Acuracia — Fase 4

## Metricas Atuais (pos-Fase 4)

| Metrica    | Antes (Fase 3) | Depois (Fase 4) | Delta  |
|------------|----------------|------------------|--------|
| F1         | 0.966          | **1.000**        | +0.034 |
| Recall     | 1.000          | **1.000**        | 0.000  |
| Precision  | 0.933          | **1.000**        | +0.067 |
| F2         | 0.986          | **1.000**        | +0.014 |

## Resultados por Fixture

| Fixture                    | TP | FN | FP | Precision | Recall | F1   |
|----------------------------|----|----|-----|-----------|--------|------|
| nubank-3months.csv         | 7  | 0  | 0   | 1.00      | 1.00   | 1.00 |
| itau-credit-2months.csv    | 6  | 0  | 0   | 1.00      | 1.00   | 1.00 |
| bradesco-checking-1month.csv| 5  | 0  | 0   | 1.00      | 1.00   | 1.00 |
| inter-credit-3months.csv   | 5  | 0  | 0   | 1.00      | 1.00   | 1.00 |
| generic-csv-2months.csv    | 5  | 0  | 0   | 1.00      | 1.00   | 1.00 |
| **AGGREGATE**              | 28 | 0  | 0   | 1.00      | 1.00   | 1.00 |

## Analise de Erros

### False Positives Eliminados (Fase 4)

| FP Anterior      | Fixture          | Causa           | Solucao                    |
|------------------|------------------|-----------------|----------------------------|
| Raia Farma       | itau-credit      | Varejo recorrente| RETAIL_EXCLUSION list      |
| Renner Roupas    | generic-csv      | Varejo recorrente| RETAIL_EXCLUSION list      |

### False Negatives

Nenhum. Recall = 1.000 mantido.

## Mudancas que Contribuiram

1. **RETAIL_EXCLUSION** (T30): Lista de exclusao de varejo (Renner, Raia Farma, Drogasil, etc.) eliminou 2 FP historicos
2. **UTILITIES_EXCLUSION** (T30): Lista de exclusao de concessionarias (CPFL, Sabesp, etc.) previne FP futuros
3. **Normalizacao aprimorada** (T27): 14 novos prefixos de gateway + stop words + trailing reference numbers
4. **TF-IDF scorer** (T28): Scorer secundario para zona ambigua JW 0.6-0.85 (contribuicao preventiva)
5. **Debito automatico detection** (T30): Bonus para "DA", "DEB.AUT" patterns

## Estatisticas da Base

| Metrica          | Antes | Depois |
|------------------|-------|--------|
| Servicos         | 352   | 503    |
| Categorias       | 16    | 16     |
| Testes totais    | 88    | 94     |
| Property tests   | 5     | 11     |

## Recomendacoes para F1 Futuro

1. **Mais fixtures**: Adicionar extratos reais de mais bancos (Santander, BB, Caixa) para testar cobertura
2. **Valores variaveis**: Testar com utilities reais (agua, luz) que aparecem recorrentemente — a exclusion list deve filtra-los
3. **Pix recorrente**: Implementar deteccao completa de PIX como assinatura (atualmente filtrado) quando ha recorrencia confirmada
4. **Debito automatico**: Coletar mais exemplos reais de DA para validar o boost
5. **Assinaturas anuais**: Adicionar fixture com transacao anual para testar deteccao
