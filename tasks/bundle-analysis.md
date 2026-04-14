# Bundle Analysis — Fase 5

## Build Output

| Rota         | Size   | First Load JS |
|-------------|--------|---------------|
| /           | 41 kB  | **156 kB**    |
| /privacidade| 142 B  | 87.4 kB       |
| /_not-found | 873 B  | 88.1 kB       |
| /robots.txt | 0 B    | 0 B           |
| /sitemap.xml| 0 B    | 0 B           |

## Shared Chunks

| Chunk                       | Size    | Conteudo provavel    |
|----------------------------|---------|---------------------|
| 1dd3208c-*.js              | 53.6 kB | React + Next.js runtime |
| 528-*.js                   | 31.7 kB | motion (LazyMotion domAnimation) |
| other shared               | 1.92 kB | next-themes, utils  |

## Analise

### First Load JS: 156 kB (< 170 kB target)

- **React + Next.js runtime:** ~53.6 kB (inevitavel)
- **Motion (domAnimation):** ~31.7 kB — LazyMotion com `domAnimation` carrega apenas o subset necessario. `strict` mode previne importacao acidental do bundle completo (~65 kB)
- **Page-specific:** ~41 kB — componentes HomeContent, FileUpload, Results, etc.
- **Shared utilities:** ~1.92 kB — next-themes, cn(), etc.

### Pacotes > 50 kB

Nenhum pacote individual excede 50 kB no client bundle.

### Duplicacoes

Nenhuma duplicacao detectada.

### Otimizacoes ja aplicadas

1. **LazyMotion strict** — carrega apenas `domAnimation` (~32 kB vs ~65 kB full)
2. **next/font** — DM Sans via CSS variable, sem render-blocking @import
3. **Server Components** — page.tsx e privacidade/page.tsx sao SC (0 JS)
4. **CSS custom properties** — dark mode sem duplicacao de styles
5. **Tailwind purge** — apenas classes usadas no bundle final

### Recomendacoes futuras

1. Se adicionar mais paginas, considerar code-splitting por rota
2. `react-countup` (6.5 kB) e `react-dropzone` (14 kB) poderiam ser lazy-loaded se necessario
3. `lucide-react` faz tree-shaking automatico — apenas icones importados entram no bundle
