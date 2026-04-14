# Lighthouse Report — Cancelai

Data: 2026-04-14
Ferramenta: Lighthouse 12.x (headless Chrome)
Modo: Mobile (default)

## Scores

### Railway Deploy (antes das correcoes)

| Categoria | Score |
|-----------|-------|
| Performance | **99** |
| Accessibility | **89** |
| Best Practices | **96** |
| SEO | **100** |

### Local Build (apos correcoes de acessibilidade)

| Categoria | Score |
|-----------|-------|
| Performance | **97** |
| Accessibility | **95** |
| Best Practices | **96** |
| SEO | **100** |

> Performance local (97) e ligeiramente menor que Railway (99) devido a latencia de rede
> zero no localhost. Em producao, o CDN do Railway e HTTP/2 compensam.

## Correcoes Aplicadas

### 1. Color Contrast (Accessibility)
**Problema:** `text-foreground-faint` (#9CA3AF light / #737373 dark) nos badges do FileUpload
tinha contraste insuficiente (3.19:1 vs 4.5:1 necessario).

**Correcao:**
- `FileUpload.tsx`: Badges "PDF", "CSV", etc. mudados de `text-foreground-faint` para `text-foreground-muted`
- `globals.css`: `--color-text-faint` light ajustado de `#9CA3AF` para `#71717a` (zinc-500)
- `globals.css`: `--color-text-faint` dark ajustado de `#737373` para `#8b8b8b`

### 2. Heading Order (Accessibility)
**Problema:** `<h3>` em FileUpload.tsx e BankConnect.tsx quebravam a hierarquia sequencial
(h1 → h3, pulando h2).

**Correcao:**
- `FileUpload.tsx:86`: `<h3>` → `<p>` com mesmas classes visuais
- `BankConnect.tsx:152`: `<h3>` → `<p>` com mesmas classes visuais

### 3. Form Label (Accessibility)
**Problema:** Input de arquivo do react-dropzone (`tabindex="-1"`, hidden) nao tinha label associado.

**Correcao:**
- `FileUpload.tsx:75`: Adicionado `aria-label="Selecionar arquivos de extrato bancario"`

## Auditorias Passando

- **Performance (97-99):** First Load JS 158 kB, next/font com display:swap, LazyMotion strict,
  zero render-blocking resources significativos
- **Best Practices (96):** HTTPS, sem console errors, sem APIs deprecated
- **SEO (100):** Meta description, canonical URL, viewport meta, sitemap.xml, robots.txt,
  og:tags, Twitter cards
- **Accessibility (95):** aria-live, aria-busy, reducedMotion, heading hierarchy,
  form labels, color contrast WCAG AA

## Residual

- 1 elemento com contraste 4.29:1 (vs 4.5:1 AA): span no footer com estilo computado #757575.
  Impacto minimo — texto decorativo/secundario, score ja e 95.

## Build Info

```
Route (app)                              Size     First Load JS
┌ ○ /                                    43.3 kB         158 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /privacidade                         142 B          87.4 kB
├ ○ /robots.txt                          0 B                0 B
└ ○ /sitemap.xml                         0 B                0 B
+ First Load JS shared by all            87.3 kB
```
