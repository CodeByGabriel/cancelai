# plan.md — Cancelai Premium Redesign: De Genérico Para Vivo

> **Filosofia:** Premium não é "mais efeitos". É restraint + 2 momentos extraordinários.
> Os 2 momentos do Cancelai: (1) hero warm-dark com "perdendo R$X" e (2) o Recibo viral.
> Tudo no site existe pra servir o arco emocional: curiosidade → choque → controle → alívio.
>
> **Regra de ouro:** Se não dá pra explicar POR QUE um efeito existe no arco emocional, delete-o.
>
> **Execução:** 7 fases, ~10-12h. Uma fase por conversa. `/clear` entre cada.
> **Budget:** Zero dependências novas além de fontes. Tudo CSS + Motion que já existe.

---

## FASE 1: Consertar o Shader — De Feio Para Invisível (1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

Leia apps/frontend/src/components/ShaderMesh.tsx (shader atual).
Leia apps/frontend/src/components/HeroBackground.tsx.
Leia apps/frontend/src/components/CssMeshFallback.tsx.
Leia apps/frontend/src/app/globals.css.

CONTEXTO: O shader atual está feio porque comete 4 erros clássicos:
1. Rápido demais (ciclo visível frame-a-frame)
2. Saturado demais (cores neon em vez de tons suaves)
3. Sem grain/noise (gradientes bandeiam em telas 8-bit)
4. Sem máscara (retângulo duro em vez de dissolução suave)

O Stripe leva 25-40 SEGUNDOS para completar 1 ciclo. Se você PERCEBE
o movimento frame-a-frame, está pelo menos 4x rápido demais.

### T1: Desacelerar e dessaturar o shader

No ShaderMesh.tsx, mude os parâmetros:

ANTES (provavelmente):
  speed: 0.15, distortion: 1.0, swirl: 0.6

DEPOIS:
  speed: 0.03      // 5x mais lento — ciclo de ~30 segundos
  distortion: 0.4   // sutil, não dramático
  swirl: 0.3        // ondulação gentil

Mude a paleta de cores para tons ANÁLOGOS (dentro de 60° no círculo cromático).
NUNCA use cores complementares (vermelho+verde, azul+laranja) — interpolam em marrom.

PALETA NOVA (warm, análoga, baixa saturação):
  Light: ['#FAF7F2', '#FEF3C7', '#FDE68A', '#22c55e']  // cream → amber → mint
  Dark:  ['#13110F', '#1C1815', '#2D1F0E', '#065F46']  // warm-black → amber-dark → deep-green

CRITÉRIO: Shader tão lento que parece quase estático. Cores suaves e quentes.

### T2: Adicionar noise overlay (SVG feTurbulence)

TODA gradient premium (Stripe, Vercel, Linear, Resend) tem noise por cima.
Sem noise, gradients bandeiam e parecem "CSS preset".

Em globals.css, adicione:

  .noise-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.06;
    mix-blend-mode: overlay;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

No HeroBackground.tsx, DEPOIS do shader e ANTES do conteúdo:
  <div className="noise-overlay" aria-hidden="true" />

CRITÉRIO: Gradient tem textura granulada sutil visível em zoom.

### T3: Mascarar bordas com radial fade

No container do shader, adicione CSS:
  mask-image: radial-gradient(ellipse 120% 100% at 50% 40%, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 120% 100% at 50% 40%, black 40%, transparent 100%);

CRITÉRIO: Shader dissolve naturalmente nas bordas. Sem retângulo duro.

### T4: Criar focal point

Faça UM blob mais brilhante que os outros (atrás do título).
Se o shader não permite, adicione radial-gradient CSS como fake focal:
  background: radial-gradient(ellipse 300px 200px at 50% 35%,
    rgba(254, 243, 199, 0.15) 0%, transparent 100%);

CRITÉRIO: O olho naturalmente vai pro centro do hero.

### T5: Repetir cores do gradient no UI

O gradient deve ecoar em 3+ elementos:
- Botão CTA: hover com tint amber sutil
- Ícones: drop-shadow com cor warm do gradient
- Hairline borders: rgba(255, 240, 220, 0.08)

CRITÉRIO: Cores do gradient aparecem em 3+ outros elementos.

### T6: Atualizar CssMeshFallback com a nova paleta

Fallback CSS deve espelhar a nova paleta warm:
  Dark: bg-[#13110F] com radial-gradients em amber/green/teal muted
  Light: bg-[#FAF7F2] com radial-gradients em amber/green/cream

CRITÉRIO: Fallback visualmente similar ao shader.

Atualize SCRATCHPAD.md: "Fase 1: Shader consertado"
```

---

## FASE 2: Tipografia Premium (1h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

Leia apps/frontend/src/app/layout.tsx.
Leia apps/frontend/tailwind.config.ts.

CONTEXTO: Inter foi acessada 414 bilhões de vezes. É invisível em 2026.
Trocar a fonte é o single highest-impact change pra perceived quality.

### T7: Instalar fontes premium gratuitas

Via next/font/google:
  Space_Grotesk → H1, títulos display (font-display)
  Geist ou Plus_Jakarta_Sans → body text (font-body)
  Geist_Mono ou JetBrains_Mono → números financeiros (font-mono)

Configure CSS variables: --font-display, --font-body, --font-mono
No tailwind.config: fontFamily: { display, body, mono }

CRITÉRIO: 3 fontes carregando via next/font (zero FOIT).

### T8: Aplicar hierarquia tipográfica

- H1: font-display, weight 600, letter-spacing -0.035em, line-height 1.05
- H2: font-display, weight 600, letter-spacing -0.025em
- Body: font-body, weight 400 (NÃO 500 em dark — white text sangra)
- Números R$: font-mono, weight 500

REGRAS PT-BR:
- line-height mínimo 1.05 (não clipar ã/õ)
- R$ formatado como "R$ 1.847,90" (NUNCA formato americano)
- max-width H1: 14ch (PT é 30% mais longo que EN)

CRITÉRIO: Hierarquia visual clara. Peso 600 nos títulos. Tracking negativo.

### T9: tabular-nums em TODOS os valores financeiros

Aplique className="font-mono tabular-nums slashed-zero" em:
- Stats do hero (15+, 500+, 0)
- AnimatedCounter
- Valores nos SubscriptionCards
- Totais no recibo

CRITÉRIO: Números não tremem ao animar. Zero tem slash.

### T10: Gradient text na palavra "esquecidas" (ou equivalente)

  .gradient-text {
    background: linear-gradient(180deg, #FFFFFF 0%, oklch(0.78 0.04 30) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

Aplicar na palavra accent do título. White → warm-white, NÃO arco-íris.

CRITÉRIO: Gradient text sutil, restante do título sólido.

Atualize SCRATCHPAD.md: "Fase 2: Tipografia premium"
```

---

## FASE 3: Hero Warm-Dark + Loss Framing (1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design, mobile-design.

Leia apps/frontend/src/components/HomeContent.tsx.

CONTEXTO: Loss aversion (Kahneman) — dor de perda = 2x prazer de ganho.
"Perdendo" > "Economize". Hero always-dark porque números pop em fundo escuro
e dark sinaliza seriedade financeira (Nubank Ultravioleta, C6 Carbon).

### T11: Hero always-dark com fade pro conteúdo

Hero SEMPRE bg-[#13110F] text-white, independente do theme.
Após o hero, fade zone de 128-192px:
  from-[#13110F] to-white dark:to-[#0a0a0a]

#13110F é warm near-black (5° red hue). NUNCA #000000.

CRITÉRIO: Hero dark. Fade suave. Sem corte abrupto.

### T12: Copy loss-framed

H1: "Você está perdendo dinheiro"
Accent: "perdendo dinheiro" em gradient text amber→green
Sub: "com assinaturas que esqueceu de cancelar"

"Perdendo" aciona loss aversion. "Descubra" é neutro.

CRITÉRIO: Copy usa "perdendo". Aciona urgência emocional.

### T13: Trust microcopy stack

IMEDIATAMENTE abaixo do CTA:
  🔒 Sem login bancário · Sem cadastro · Arquivo apagado após análise · LGPD

4 claims curtas, separadas por dots, text-white/50.
Cada uma responde um medo: hack, spam, dados guardados, legalidade.

CRITÉRIO: Trust stack visível. 4 claims com dots.

### T14: Stats reformatados

Números: text-4xl md:text-5xl font-mono font-bold tabular-nums tracking-tight
Labels: text-[10px] uppercase tracking-[0.2em] text-white/40
Gap: gap-10 md:gap-16

CRITÉRIO: Stats impactantes, labels em caps espaçadas.

### T15: CTA pill com glow

  rounded-full px-8 py-3
  shadow-[0_0_20px_rgba(34,197,94,0.3),0_0_60px_rgba(34,197,94,0.1)]
  active:scale-[0.98]

Pill shape. 2 layers de glow. Press feedback.

CRITÉRIO: CTA com glow visível e pill shape.

Atualize SCRATCHPAD.md: "Fase 3: Hero warm-dark + loss framing"
```

---

## FASE 4: Recibo do Dinheiro Esquecido (2-3h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design, mobile-design.

Leia apps/frontend/src/components/SubscriptionCard.tsx.
Leia apps/frontend/src/components/HomeContent.tsx (state 'complete').

CONTEXTO: O recibo é a arma viral. É Spotify Wrapped pra finanças.
Rocket Money, Bobby, JustCancel provaram que a unidade viral de subscription
tools é uma lista formatada, NÃO um counter animado.

### T16: Criar ReciboResultado.tsx

Visual: recibo de papel — bg-[#FDFBF7] (creme), border-dashed, font-mono.

Estrutura:
  ✄ - - - - - - - - - - - - (borda tracejada)
  RECIBO DO DINHEIRO ESQUECIDO (caps, tracking-wide)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━
  R$ 1.847,90 /ano (display size, font-mono, green glow)
  em assinaturas esquecidas (muted)
  ─────────────────────────
  🟣 Netflix         R$ 55,90/mês
  🟢 Spotify         R$ 21,90/mês
  🔵 iCloud          R$ 12,90/mês
  ...
  ─────────────────────────
  Total mensal:     R$ 240,60
  Total anual:    R$ 2.887,20 (bold, accent)
  
  Analisado por Cancelaí (watermark)
  ✄ - - - - - - - - - - - -

Dark mode: bg-[#1C1815], mesma estrutura.
max-w-md, p-6 md:p-8, shadow-2xl.
Noise overlay a 3% pra textura de papel.

CRITÉRIO: Parece recibo real. Creme claro com tracejados.

### T17: Botão "Compartilhar este recibo"

Mobile: navigator.share() (Web Share API nativa)
Desktop: copia URL pro clipboard com toast "Link copiado!"

CRITÉRIO: Share funciona em mobile e desktop.

### T18: Animação de reveal

Sequência ao entrar em 'complete':
1. (200ms) Total fade-in com scale 0.95→1.0, cubic-bezier(0.16,1,0.3,1)
2. (700ms) Separador expande 0%→100% width
3. (1000ms) Linhas stagger a 80ms: opacity 0→1, y 8→0
4. (após linhas) Total mensal/anual fade-in
5. (último) Botão share fade-in

NÃO use counter animation no número pessoal.
O número aparece ESTÁTICO — drama vem do reveal, não do counting.

CRITÉRIO: Reveal dramático. Número estático. Stagger nas linhas.

### T19: Integrar no fluxo

Estado 'complete': recibo PRIMEIRO (above the fold).
SubscriptionCards detalhados ABAIXO (scroll pra ver mais).

CRITÉRIO: Recibo é a primeira coisa após completar.

Atualize SCRATCHPAD.md: "Fase 4: Recibo viral criado"
```

---

## FASE 5: Micro-interações (1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

Leia apps/frontend/src/components/Features.tsx.
Leia apps/frontend/src/components/SubscriptionCard.tsx.

CONTEXTO: Sites que parecem "vivos" (Linear, Stripe) NÃO são vivos
por shaders. São vivos por dezenas de MICRO-interações — hover states,
cursor tracking, scroll reveals. Premium é acumulação de detalhes.

### T20: Cursor spotlight nos feature cards (padrão Linear)

Um listener de mousemove no grid pai atualiza CSS variables
--mouse-x e --mouse-y em cada card. Radial-gradient no ::before
segue o cursor com glow verde a 8% opacity.

Apenas em @media (hover: hover) — desabilitar em mobile.

CRITÉRIO: Glow segue cursor nos cards. Desktop only.

### T21: Hover lift em cards interativos

  hover:-translate-y-1 hover:shadow-lg
  active:translate-y-0 active:shadow-md
  transition-all duration-300 ease-out

4px de lift. 300ms duration. Ease-out (matéria tem inércia).
Aplicar em: Feature cards, SubscriptionCards, FAQ items, Bank chips.

CRITÉRIO: Cards flutuam 4px no hover.

### T22: Border glow warm nos cards

  border-white/5 hover:border-white/15
  hover:shadow-[0_0_0_1px_rgba(255,240,220,0.05),0_2px_8px_rgba(0,0,0,0.3)]

2 layers: hairline definition + soft glow. Cor warm, não cool gray.

CRITÉRIO: Border glow warm no hover.

### T23: Ícones com glow no hover

  group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]
  group-hover:text-green-400

Wrap cards em <div className="group">.

CRITÉRIO: Ícones ganham glow verde no hover do pai.

### T24: FAQ com animação de height

AnimatePresence + m.div com height 0→auto, opacity 0→1.
Chevron rotaciona 180° com transition-transform.
Easing: cubic-bezier(0.16, 1, 0.3, 1).

CRITÉRIO: FAQ abre/fecha smooth. Chevron rotaciona.

### T25: Scroll reveal das seções

m.div com whileInView, opacity 0→1, y 24→0, once: true.
viewport margin -80px. Duration 600ms. Easing cubic-bezier(0.16,1,0.3,1).

Aplicar em: Features, Como funciona, FAQ, Footer.

CRITÉRIO: Seções aparecem com fade+slide. Apenas uma vez.

Atualize SCRATCHPAD.md: "Fase 5: Micro-interações"
```

---

## FASE 6: Dark Mode Palette System (1h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

CONTEXTO: Dark mode premium é um sistema de elevação com camadas.
Não é "inverter cores". É base→surface→elevated com borders warm.

### T26: CSS custom properties para palette

:root → surfaces white/gray, borders cool, text dark
.dark → surfaces warm-black (#0a0a09, #13110F, #1C1815),
        borders warm (rgba 255,240,220), text off-white (#E8E3DC)

NUNCA pure black. NUNCA pure white. Tudo warm.

### T27: Migrar 10-15 componentes principais

body, cards, textos, botões → usar CSS variables em vez de Tailwind hardcoded.

### T28: Verificação visual

Toggle 10x sem glitch. Texto off-white. Backgrounds warm. Borders warm.

Atualize SCRATCHPAD.md: "Fase 6: Palette system"
```

---

## FASE 7: Verificação Final (45min)

```
Use @frontend-developer, @code-reviewer, @test-engineer.
Aplique skill mobile-design.

### T29: Performance (CPU throttle 6x)
- FCP < 2s, shader 30fps+, scroll smooth, dark toggle sem delay

### T30: Acessibilidade
- prefers-reduced-motion: zero animações de transform
- Contrast >= 4.5:1 texto sobre hero
- aria-hidden no shader e noise
- Tab navigation funciona

### T31: Build final
  turbo build && turbo test && turbo typecheck && turbo lint
  First Load JS < 200KB

Commit e push.
Atualize SCRATCHPAD.md e ARCHITECTURE.md.
```

---

## Os 2 Momentos Extraordinários do Cancelai

1. ⭐ **Hero warm-dark** com "Você está perdendo dinheiro" + trust stack
2. ⭐ **Recibo do Dinheiro Esquecido** com share viral

Tudo o resto existe pra servir esses 2 momentos. Restraint + craft.
