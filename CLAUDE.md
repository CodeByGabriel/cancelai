# CLAUDE.md - Cancelai

## Comandos

```bash
npm install              # Instalar deps (raiz do monorepo)
npm run dev              # Frontend (3000) + Backend (3001)
npm run build            # Build completo (tsc + next build)
npm run test -- --run    # Testes (vitest, single run)
npm run lint             # ESLint
```

## 5 Regras Que Quebram Build

1. **Imports com `.js`** — `import { x } from './foo.js'` (nunca `./foo` ou `./foo.ts`)
   Motivo: `"module": "NodeNext"` no tsconfig exige extensao explicita

2. **Nunca `prop = undefined`** — Use `delete obj.prop` ou `...(val && { prop: val })`
   Motivo: `exactOptionalPropertyTypes: true` distingue "ausente" de "undefined"

3. **Array access e `T | undefined`** — `arr[0]` precisa de `!` ou null check
   Motivo: `noUncheckedIndexedAccess: true` no tsconfig

4. **`readonly` em tudo** — Toda interface backend usa `readonly` em cada propriedade
   Motivo: Imutabilidade. Types frontend NAO usam readonly

5. **`any` e proibido** — ESLint `@typescript-eslint/no-explicit-any: "error"`
   Motivo: Use `unknown` + type guard, ou tipo especifico

## NUNCA Faca

- Nunca use `any` — use `unknown`, generics, ou tipo especifico
- Nunca atribua `undefined` a prop opcional — use spread condicional ou `delete`
- Nunca crie arquivo fora de kebab-case — `analysis-service.ts`, nao `analysisService.ts`
- Nunca adicione dependencia sem necessidade — `zod` ja esta instalado e NUNCA foi importado
- Nunca importe sem `.js` no backend — build falha silenciosamente em runtime
- Nunca use `toBe()` para comparar floats — use `toBeCloseTo(val, 2)`
- Nunca adicione `'use client'` em `page.tsx` — e Server Component, estado fica em `HomeContent.tsx`
- Nunca logue dados financeiros — apenas metricas tecnicas (tempo, tamanho, quantidade)

## Gotchas Frequentes

```typescript
// .includes() com literal types precisa de cast
(config.allowedExts as readonly string[]).includes(ext)

// Regex com caracteres especiais precisa de escape
new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')

// Barrel exports: cada diretorio tem index.ts que re-exporta
// Testes: sufixo .test.ts no mesmo diretorio do modulo
```

## Thresholds Reais (pipeline ativo)

- **High confidence:** >= 0.85 (`config/index.ts:315`, `CONFIDENCE_THRESHOLDS_V2`)
- **Medium:** >= 0.60 | **Low:** >= 0.40
- **IA min confidence:** >= 0.75 para promover ambiguo (`ai-classifier.ts`)
- **NOTA:** `subscription-detector.ts` tem thresholds legados (0.80) mas NAO e usado pelo pipeline

## Variaveis de Ambiente

```env
DEEPSEEK_API_KEY=sk-xxx      # OPCIONAL — sem ela, IA desativa silenciosamente
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development          # "production" ativa rate limiting
AGGREGATOR_CLIENT_ID=xxx     # OPCIONAL — Pluggy Client ID (Open Finance)
AGGREGATOR_CLIENT_SECRET=xxx # OPCIONAL — Pluggy Client Secret (Open Finance)
```

## Referencia

Para pipeline, tipos, algoritmo, endpoints, bancos, UI e tudo mais: **ARCHITECTURE.md**
Para progresso entre sessoes: **SCRATCHPAD.md**
