# plan.md — Cancelai Visual Fix: Reverter, Depois Melhorar Com Cuidado

> **O que deu errado:** Tentamos mudar 15 coisas de uma vez. Quando a paleta
> deu errado, TUDO ficou feio. A abordagem correta é INCREMENTAL — uma mudança
> por vez, verificação visual entre cada, reverter se ficou pior.
>
> **Regra:** Cada task muda UMA coisa. Teste visual ANTES da próxima task.
> Se ficou pior, REVERTA imediatamente (git checkout -- arquivo).
>
> **Ferramentas:** Figma MCP pra validar designs. Frontend skills pra implementar.
> **Execução:** 5 fases. Cada task é PEQUENA. `/clear` entre fases.

---

## FASE 0: REVERTER PRO ESTADO LIMPO (15min)

```
Use @frontend-developer.

OBJETIVO: Desfazer TODAS as mudanças visuais do redesign que ficaram feias.
Voltar pro estado visual que estava BOM antes das tentativas de redesign.

### T0: Identificar e reverter mudanças ruins

Rode: git log --oneline -20

Encontre os commits do redesign visual (provavelmente os últimos 1-3 commits
com mensagens sobre "premium redesign", "shader fix", "warm-dark hero", etc.)

OPÇÃO A — Se os commits são recentes e isolados:
  git revert <commit-hash> --no-edit
  (para cada commit de redesign, do mais recente pro mais antigo)

OPÇÃO B — Se os commits estão misturados com outras mudanças:
  Reverta manualmente os arquivos visuais afetados:
  git checkout HEAD~3 -- apps/frontend/src/components/HomeContent.tsx
  git checkout HEAD~3 -- apps/frontend/src/components/HeroBackground.tsx
  git checkout HEAD~3 -- apps/frontend/src/components/ShaderMesh.tsx
  git checkout HEAD~3 -- apps/frontend/src/components/CssMeshFallback.tsx
  git checkout HEAD~3 -- apps/frontend/src/components/Features.tsx
  git checkout HEAD~3 -- apps/frontend/src/app/globals.css
  git checkout HEAD~3 -- apps/frontend/src/app/layout.tsx
  git checkout HEAD~3 -- apps/frontend/tailwind.config.ts
  (ajuste HEAD~3 pro número de commits correto)

OPÇÃO C — Se não sabe quais arquivos reverter:
  Leia o git diff dos últimos commits e reverta APENAS mudanças visuais.
  NÃO reverta mudanças de backend, testes, ou infra.

Após reverter:
  turbo build
  Verifique que o site voltou pro visual limpo anterior (branco, verde, simples).

Se a OPÇÃO C é necessária mas complexa demais, faça /clear e peça ao usuário
para fornecer o hash do último commit "bom" antes do redesign.

CRITÉRIO: Site voltou pro visual limpo que tinha antes das tentativas de redesign.
Commit: git commit -m "revert: undo broken visual redesign attempts"
git push
```

---

## FASE 1: DESIGN NO FIGMA PRIMEIRO, CÓDIGO DEPOIS (1h)

```
Use @ui-ux-designer.
Use Figma MCP (Figma:create_new_file, Figma:use_figma).

CONTEXTO: O erro anterior foi implementar direto sem validar visualmente.
Agora vamos DESENHAR no Figma primeiro, aprovar, depois implementar.

### T1: Criar arquivo Figma pro redesign

Use Figma:whoami pra pegar o planKey do usuário.
Depois:

Figma:create_new_file({
  editorType: "design",
  fileName: "Cancelai — Redesign v2",
  planKey: "<planKey do usuário>"
})

Guarde o fileKey retornado — vai usar em todas as tasks seguintes.

### T2: Criar mockup do Hero no Figma

Use Figma:use_figma pra criar um frame de hero (1440x900):

Descreva: "Create a hero section mockup for Cancelai fintech landing page"

O hero deve ter:
- Frame 1440x900, background #09090b (zinc-950)
- Um retângulo com radial gradient verde (#22c55e) a 12% opacity no centro,
  blur 120, atrás do texto (simula glow spot)
- Texto "Você está" em branco, 64px, font Inter Semi Bold
- Texto "perdendo dinheiro" em #4ade80 (green-400), 64px, font Inter Semi Bold
- Texto "com assinaturas que esqueceu de cancelar" em #a1a1aa (zinc-400), 20px
- 3 blocos de stats: "15+" / "BANCOS", "500+" / "SERVIÇOS", "0" / "DADOS GUARDADOS"
  Números em branco 48px mono, labels em #71717a (zinc-500) 10px uppercase
- Botão "Analisar meu extrato" em #22c55e, rounded-full, padding 12x32
- Trust text: "🔒 Sem login bancário · Sem cadastro · Arquivo apagado · LGPD"
  em #71717a 12px

### T3: Criar mockup dos Feature Cards no Figma

Adicione na mesma página, abaixo do hero:
- Frame 1440x400, background #ffffff
- Título "Por que usar o Cancelaí?" em #18181b (zinc-900), 36px, center
- 4 cards em grid 4 colunas:
  Cada card: 280x200, bg #fafafa, border 1px #e4e4e7, rounded-16
  Ícone em círculo bg #f0fdf4 (green-50), cor #22c55e
  Título em #18181b 16px semi bold
  Descrição em #71717a 14px regular

### T4: Criar mockup do Recibo de Resultados no Figma

Adicione na mesma página:
- Frame 420x600, background #FDFCFA (creme ultra sutil)
- Borda tracejada #d4d4d8 no topo e bottom
- "RECIBO DO DINHEIRO ESQUECIDO" em #18181b 12px uppercase tracking-wide
- "R$ 1.847,90 /ano" em #22c55e 42px mono bold
- "em assinaturas esquecidas" em #71717a 14px
- 4 linhas de exemplo:
  "Netflix  R$ 55,90/mês" com separador tracejado entre cada
  "Spotify  R$ 21,90/mês"
  "iCloud   R$ 12,90/mês"
  "Gympass  R$ 149,90/mês"
- Total: "R$ 240,60/mês" em #18181b bold
- "Analisado por Cancelaí" em #a1a1aa 11px (watermark)

### T5: Gerar screenshot e validar

Use Figma:get_screenshot pra cada frame criado.
Mostre pro usuário (envie o link do Figma).

PARE AQUI. Espere o usuário aprovar os mockups antes de implementar.
Se o usuário pedir mudanças, ajuste no Figma primeiro.

CRITÉRIO: Mockups aprovados pelo usuário no Figma.
```

---

## FASE 2: IMPLEMENTAR HERO — UMA MUDANÇA POR VEZ (1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

PRÉ-REQUISITO: Mockups da Fase 1 aprovados pelo usuário.
Se não foram aprovados, NÃO prossiga.

REGRA ABSOLUTA: Cada task muda UMA coisa. Rode turbo build e verifique
visualmente ANTES de passar pra próxima. Se ficou pior, git checkout -- <arquivo>.

### T6: APENAS mudar o hero pra dark

Mude SOMENTE o background do hero section pra #09090b.
Mude SOMENTE os textos dentro do hero pra branco/zinc.
NÃO mude nada fora do hero. NÃO adicione shaders. NÃO mude fontes.

  <section style={{ backgroundColor: '#09090b' }} className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">

Textos dentro:
  H1 → text-white
  Subtítulo → text-zinc-400
  Stats números → text-white
  Stats labels → text-zinc-500

PARE. Build. Verifique visual. Está ok? Próxima task.

### T7: APENAS adicionar UM glow spot

Adicione UMA div com glow verde atrás do título. Nada mais.

  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[500px] h-[350px] rounded-full pointer-events-none"
       style={{
         background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
         filter: 'blur(80px)'
       }}
       aria-hidden="true" />

Opacity 0.12. Se parecer forte demais, reduza pra 0.08.
Se parecer nada, está CERTO — premium é quase invisível.

PARE. Build. Verifique visual. Está ok? Próxima task.

### T8: APENAS colorir "perdendo dinheiro" de verde

Mude SOMENTE as palavras "perdendo dinheiro" pra text-green-400.
Resto do H1 continua text-white. Cor SÓLIDA, sem gradient text.

PARE. Build. Verifique visual.

### T9: APENAS adicionar trust microcopy

DEPOIS dos stats (ou do CTA), adicione uma linha:

  <p className="text-zinc-500 text-xs mt-6 flex items-center justify-center gap-1.5 flex-wrap">
    <span>🔒</span>
    <span>Sem login bancário</span>
    <span className="text-zinc-700">·</span>
    <span>Sem cadastro</span>
    <span className="text-zinc-700">·</span>
    <span>Arquivo apagado após análise</span>
    <span className="text-zinc-700">·</span>
    <span>LGPD</span>
  </p>

PARE. Build. Verifique visual.

### T10: APENAS adicionar fade transition hero → conteúdo

DEPOIS do hero section, ANTES do conteúdo:

  <div className="h-24 bg-gradient-to-b from-[#09090b] to-white dark:to-zinc-950" />

PARE. Build. Verifique visual.

### T11: APENAS mudar o CTA pra pill shape

Mude o botão principal de rounded-xl pra rounded-full.
Adicione padding maior: px-8 py-3.
NENHUM glow, NENHUM shadow extra. Só a shape.

PARE. Build. Verifique visual.

Se TODAS as tasks passaram verificação visual:
  git add -A
  git commit -m "feat(frontend): dark hero with green glow, loss-framed copy, trust stack"
  git push

Atualize SCRATCHPAD.md.
```

---

## FASE 3: MICRO-INTERAÇÕES — UMA POR VEZ (1h)

```
Use @frontend-developer.
Aplique skills: frontend-design.

MESMA REGRA: Uma mudança por vez. Verificação visual entre cada.

### T12: APENAS adicionar scroll reveal nas seções

Crie um wrapper ScrollReveal reutilizável:

  'use client';
  import { m } from 'motion/react';

  export function ScrollReveal({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {children}
      </m.div>
    );
  }

Wrap as seções: Features, Como Funciona, FAQ.
NÃO wrap o hero (já está visível).

PARE. Build. Verifique visual (scroll e veja as seções aparecerem).

### T13: APENAS adicionar hover lift nos feature cards

Nos 4 cards de features, adicione:
  className="... transition-transform duration-300 hover:-translate-y-1"

Translate de 4px. Nada mais. Sem shadow, sem glow, sem border change.

PARE. Build. Verifique visual (hover nos cards).

### T14: APENAS adicionar hover nos FAQ items

No header de cada FAQ item:
  className="... hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"

No chevron:
  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}

PARE. Build. Verifique visual.

### T15: APENAS melhorar a dropzone border no drag

Quando isDragActive, mude a borda de dashed gray pra dashed green:
  className={isDragActive
    ? 'border-2 border-dashed border-green-500 bg-green-50/50 dark:bg-green-950/20'
    : 'border-2 border-dashed border-zinc-300 dark:border-zinc-700'}

Sem shader, sem conic-gradient, sem animação. Só a COR muda.

PARE. Build. Verifique visual.

Se TUDO passou:
  git commit -m "feat(frontend): scroll reveals, hover lifts, FAQ animation, dropzone feedback"
  git push

Atualize SCRATCHPAD.md.
```

---

## FASE 4: RECIBO DO DINHEIRO ESQUECIDO (1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

CONTEXTO: Este é o componente viral. Implemente baseado no mockup
aprovado no Figma (Fase 1, T4). Se o mockup não foi feito,
use a descrição abaixo como referência.

### T16: Criar ReciboResultado.tsx

Crie apps/frontend/src/components/ReciboResultado.tsx

O componente recebe: subscriptions[], totalMonthly, totalAnnual

Visual — SIMPLES e limpo:
- max-w-md mx-auto
- bg-white dark:bg-zinc-900
- border border-zinc-200 dark:border-zinc-800
- rounded-2xl
- p-6 md:p-8
- shadow-xl

TOPO:
  "RECIBO DO DINHEIRO ESQUECIDO"
  text-[11px] uppercase tracking-[0.2em] text-zinc-400 text-center

NÚMERO GRANDE:
  R$ {totalAnnual}
  text-3xl md:text-4xl font-mono font-bold text-green-500 text-center
  (green-500, NÃO green-400 — precisa de contraste em bg-white)

SUBTÍTULO:
  "em assinaturas esquecidas por ano"
  text-sm text-zinc-500 text-center

SEPARADOR:
  <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 my-4" />

LISTA DE ASSINATURAS:
  {subscriptions.map(sub => (
    <div className="flex justify-between items-center py-2.5
                    border-b border-dashed border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-900 dark:text-zinc-100">{sub.name}</span>
      <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
        R$ {sub.amount}/mês
      </span>
    </div>
  ))}

RODAPÉ:
  <div className="flex justify-between items-center pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-700">
    <span className="text-sm font-semibold">Total mensal</span>
    <span className="font-mono font-semibold tabular-nums">R$ {totalMonthly}</span>
  </div>

WATERMARK:
  <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-700 mt-6">
    Analisado por Cancelaí · cancelai.com.br
  </p>

NENHUM efeito especial. NENHUM glass morphism. NENHUM glow.
Card simples, limpo, informativo. A força está nos DADOS, não na decoração.

### T17: Adicionar botão de compartilhar

Abaixo do recibo:
  <button onClick={handleShare}
    className="mt-4 mx-auto flex items-center gap-2 text-sm text-zinc-500
               hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
    <ShareIcon className="w-4 h-4" />
    Compartilhar resultado
  </button>

handleShare:
  if (navigator.share) {
    navigator.share({ title: 'Meu recibo Cancelaí', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    // mostrar toast "Link copiado!"
  }

### T18: Animação de entrada do recibo

Quando state === 'complete', o recibo aparece com:
  <m.div
    initial={{ opacity: 0, y: 16, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  >
    <ReciboResultado ... />
  </m.div>

SIMPLES. Um fade+slide+scale sutil. Sem stagger, sem counter, sem drama.
Se quiser stagger nas linhas DEPOIS, faça em uma task SEPARADA.

### T19: Integrar no fluxo de resultados

No HomeContent.tsx, quando state === 'complete':
- Renderize <ReciboResultado /> ACIMA dos SubscriptionCards existentes
- Recibo é a primeira coisa que o usuário vê
- Cards detalhados ficam abaixo

PARE. Build. Verifique visual.

  git commit -m "feat(frontend): add Recibo do Dinheiro Esquecido viral component"
  git push

Atualize SCRATCHPAD.md.
```

---

## FASE 5: DARK MODE POLISH + VERIFICAÇÃO (30min)

```
Use @frontend-developer e @ui-ux-designer.

### T20: Verificar dark mode em CADA componente

Toggle dark mode e verifique CADA seção:
1. Header: logo e links legíveis?
2. Hero: já é dark, não deve mudar
3. Fade zone: from-[#09090b] to-white → from-[#09090b] to-zinc-950
4. Upload section: bg-white → bg-zinc-950, bordas visíveis?
5. Feature cards: bg-fafafa → bg-zinc-900, texto legível?
6. Como funciona: texto e ícones visíveis?
7. FAQ: bordas e texto visíveis?
8. Recibo: bg-white → bg-zinc-900, tracejados visíveis?
9. Footer: legível?

Para CADA problema encontrado, corrija INDIVIDUALMENTE com dark: variant.
NÃO use CSS custom properties/variáveis — use Tailwind dark: diretamente.
É mais simples e mais previsível.

### T21: Verificar mobile

Chrome DevTools → Device mode → iPhone 14 e Galaxy S21:
1. Hero texto: legível, não overflow?
2. Stats: 3 números cabem na tela?
3. Trust stack: wraps bonito?
4. Upload zone: acessível?
5. Feature cards: 1 coluna em mobile?
6. Recibo: max-w-md funciona em tela pequena?
7. FAQ: toque funciona?

### T22: Build final

  turbo build
  turbo test
  turbo typecheck

  git add -A
  git commit -m "fix(frontend): dark mode polish and mobile fixes"
  git push

Atualize SCRATCHPAD.md: "Visual redesign v2 completo — incremental approach"
```

---

## REGRAS ABSOLUTAS

1. **UMA mudança por task.** Nunca mude 2 coisas ao mesmo tempo.
2. **Build e verificação visual ENTRE cada task.** Se ficou pior, reverta.
3. **Sem dependências novas.** Tudo com Tailwind + Motion que já existem.
4. **Sem CSS custom properties pro tema.** Use dark: do Tailwind direto.
5. **Sem glass morphism.** Cards com bg sólido, border sutil, hover simples.
6. **Sem gradient text.** Cor sólida no accent. Simples > fancy.
7. **Sem shader no hero.** CSS gradient glow spot com opacity 0.12 MAX.
8. **Sem counter animation no número pessoal.** Número aparece estático.
9. **Se o efeito é visível demais, está errado.** Reduza opacity/duração.
10. **Na dúvida, NÃO adicione.** Menos é mais. Sempre.

## Agents por fase

| Fase | Agents | Skills |
|------|--------|--------|
| 0 | @frontend-developer | — |
| 1 | @ui-ux-designer | ui-ux-pro-max (Figma MCP) |
| 2 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max, frontend-design |
| 3 | @frontend-developer | frontend-design |
| 4 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max, frontend-design |
| 5 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max |
