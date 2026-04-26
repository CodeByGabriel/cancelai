# plan.md — Integração Visual: Paper Shaders + AIDesigner MCP

> **Escopo:** Elevar a estética do Cancelai com shaders GPU no hero e processing state,
> glass morphism nos cards, confetti no success, e configurar os 2 MCPs no projeto.
> **Budget:** Max +50KB JS. 60fps no Galaxy A15/Moto G24.
> **Tempo estimado:** 3-4 sessões no Claude Code (~8-12h total).

---

## Contexto Técnico

### O que é cada MCP

**Shaders MCP (shaders.com/mcp)** — MCP remoto que dá ao Claude acesso a 90+ componentes
de shader e 400+ presets. Precisa de conta Pro. Ajuda o Claude a encontrar e configurar
presets de shader. O output é código React pronto pra colar.

**AIDesigner MCP (api.aidesigner.ai)** — MCP remoto que gera designs completos em HTML+Tailwind
baseado no contexto do seu repo (detecta Next.js, Tailwind, shadcn). Output é HTML que
precisa ser portado pra JSX. Forte pra layout, hierarquia, tipografia.

**@paper-design/shaders-react** — Pacote npm (NÃO é MCP). Componentes React de shader
zero-dependency, WebGL2. É o que roda em runtime. ~25-30KB total, ~5-7KB por shader.

### Stack atual do Cancelai frontend
- Next.js 14 App Router
- Tailwind CSS 3.4
- Motion (LazyMotion + domAnimation + m.*)
- next-themes (dark mode)
- react-countup (contadores)
- Deploy: Railway

### Regras de Performance (INVIOLÁVEIS)
1. MAX 1 shader animado visível por vez
2. Canvas DPR = 1.0 em mobile (devicePixelRatio capped)
3. Shader pausa quando offscreen (IntersectionObserver)
4. Shader pausa quando tab inativa (visibilitychange)
5. useReducedMotion() desativa TODOS os shaders → fallback CSS
6. Dynamic import com fallback CSS durante carregamento
7. NUNCA usar three.js, @react-three/fiber, ou shadergradient (150-250KB, over budget)

---

## FASE 1: Setup dos MCPs + Dependências (30min)

```
Use @devops-engineer e @frontend-developer.

Leia CLAUDE.md e SCRATCHPAD.md para contexto.

OBJETIVO: Configurar os 2 MCPs no projeto e instalar as dependências de runtime.

### T1: Configurar MCP servers no projeto

Crie (ou atualize) .mcp.json na raiz do projeto com os 2 MCPs:

{
  "mcpServers": {
    "aidesigner": {
      "type": "http",
      "url": "https://api.aidesigner.ai/api/v1/mcp"
    },
    "shaders": {
      "type": "http",
      "url": "https://shaders.com/mcp"
    }
  }
}

NOTA: O AIDesigner usa OAuth — ao conectar pela primeira vez no Claude Code,
ele vai pedir pra autenticar via browser. O Shaders MCP precisa de conta Pro.
Se o usuário não tiver conta Pro no shaders.com, o MCP do shaders é opcional —
os presets podem ser configurados manualmente via documentação.

CRITÉRIO: .mcp.json existe na raiz com ambos os servidores.

### T2: Instalar dependências de runtime no frontend

cd apps/frontend
npm install @paper-design/shaders-react
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti

Verifique que foram adicionadas ao package.json:
  grep "shaders-react\|canvas-confetti" apps/frontend/package.json

NÃO instale:
- three / @react-three/fiber (150KB+ — over budget)
- shadergradient (puxa three.js inteiro)
- @shaders/core ou qualquer pacote do shaders.com (é MCP, não runtime)

CRITÉRIO: npm install sem erros. Build compila: turbo build.

### T3: Verificar compatibilidade com LazyMotion

Confirme que LazyMotion strict está ativo (Fase anterior):
  grep -r "LazyMotion" apps/frontend/src/

Os shaders NÃO usam Motion — eles rodam em canvas WebGL separado.
A coordenação é via useReducedMotion() que já existe no projeto.
Confirme:
  grep -r "useReducedMotion\|reducedMotion" apps/frontend/src/

Se useReducedMotion NÃO existir como hook importado, adicione no componente
que vai usar shaders. Import: import { useReducedMotion } from "motion/react";

CRITÉRIO: LazyMotion strict ativo. useReducedMotion disponível.

Atualize SCRATCHPAD.md: "Fase 1 MCP+Shaders: setup completo"
```

---

## FASE 2: Hero Shader — MeshGradient (1.5-2h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, mobile-design, frontend-design.

Leia apps/frontend/src/app/page.tsx e apps/frontend/src/components/HomeContent.tsx.
Leia apps/frontend/src/app/layout.tsx para ver o ThemeProvider.

OBJETIVO: Adicionar um MeshGradient animado como background do hero section,
com fallback CSS, dark mode awareness, e performance mobile otimizada.

### T4: Criar componente ShaderMesh (o shader real)

Crie apps/frontend/src/components/ShaderMesh.tsx:

'use client';
- Importa MeshGradient de @paper-design/shaders-react
- Recebe props: palette (array de 4 cores), className
- Configura o MeshGradient:
  - speed: 0.15 (lento, calmo — fintech, não gaming)
  - distortion: 1.0
  - swirl: 0.6
  - colors: usa a palette recebida via props
  - style: position absolute, inset 0, zIndex -1
- Implementa DPR cap:
  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio, 1.5)  // 1.0 em mobile, 1.5 em desktop
    : 1;
  Passa pixelDensity={dpr} se o componente suportar, senão aplica via CSS
  transform: scale() no canvas
- Implementa IntersectionObserver para pausar quando offscreen:
  useEffect com IntersectionObserver no container ref
  Quando !isIntersecting → setar speed para 0 ou desmontar
- Implementa visibilitychange listener:
  useEffect com document.addEventListener('visibilitychange')
  Quando document.hidden → pausar shader

PALETA DE CORES (alinhada com design system do Cancelai):
  Light mode: ['#f8fafc', '#dcfce7', '#bbf7d0', '#22c55e']  // slate-50 → green-500
  Dark mode:  ['#020617', '#052e16', '#14532d', '#22c55e']  // slate-950 → green-500

CRITÉRIO: Shader renderiza, anima suavemente, respeita dark mode.

### T5: Criar componente CssMeshFallback (fallback sem WebGL)

Crie apps/frontend/src/components/CssMeshFallback.tsx:

- Div com gradient CSS que simula o mesh:
  Light: background: radial-gradient(ellipse at 30% 20%, #dcfce7 0%, #f8fafc 50%, #bbf7d0 100%)
  Dark: background: radial-gradient(ellipse at 30% 20%, #052e16 0%, #020617 50%, #14532d 100%)
- Animação CSS sutil: @keyframes drift que move o background-position lentamente
  @keyframes drift {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  animation: drift 20s ease-in-out infinite
- Usa motion-reduce: para desativar animação
- Classe: motion-reduce:animate-none

PORQUÊ: Este fallback renderiza DURANTE o carregamento do shader (dynamic import)
e PERMANENTEMENTE para usuários com prefers-reduced-motion.

CRITÉRIO: Fallback visível, gradient bonito, sem animação com reduced-motion.

### T6: Criar componente Hero wrapper com dynamic import

Crie apps/frontend/src/components/HeroBackground.tsx:

'use client';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { CssMeshFallback } from './CssMeshFallback';

const ShaderMesh = dynamic(() => import('./ShaderMesh'), {
  ssr: false,
  loading: () => <CssMeshFallback />,
});

const PALETTE = {
  light: ['#f8fafc', '#dcfce7', '#bbf7d0', '#22c55e'],
  dark:  ['#020617', '#052e16', '#14532d', '#22c55e'],
};

export function HeroBackground() {
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const palette = PALETTE[resolvedTheme === 'dark' ? 'dark' : 'light'];

  if (reduceMotion) return <CssMeshFallback theme={resolvedTheme} />;
  return <ShaderMesh palette={palette} />;
}

NOTA: ssr: false é OBRIGATÓRIO — WebGL não existe no server.
O loading fallback garante que o FCP não é um flash branco.

CRITÉRIO: Shader carrega lazy. CSS fallback aparece primeiro. Reduced motion usa fallback.

### T7: Integrar HeroBackground no HomeContent

No HomeContent.tsx (ou no componente que renderiza o hero):
- Adicione <HeroBackground /> como PRIMEIRO filho do container do hero
- O container do hero precisa ter position: relative e overflow: hidden
- O conteúdo (título, stats, CTA) fica por cima com position: relative z-10
- Adicione uma overlay sutil entre shader e conteúdo para legibilidade:
  <div className="absolute inset-0 bg-white/60 dark:bg-black/50 z-[1]" />
  (ajuste opacidade conforme necessário pra legibilidade do texto)

Estrutura final:
  <section className="relative overflow-hidden min-h-[60vh]">
    <HeroBackground />                                    {/* z-0 */}
    <div className="absolute inset-0 bg-white/60 dark:bg-black/50 z-[1]" />  {/* overlay */}
    <div className="relative z-10">                       {/* conteúdo */}
      <h1>Descubra assinaturas esquecidas</h1>
      {/* stats, CTA, etc. */}
    </div>
  </section>

CRITÉRIO: Texto 100% legível sobre o shader em ambos os modos. Sem layout shift.

### T8: Testar performance mobile

- Chrome DevTools → Performance → CPU throttle 6x (simula Galaxy A15)
- Verifique que o shader roda a 60fps (ou pelo menos 30fps estável)
- Se < 30fps: reduza distortion para 0.5, speed para 0.1
- Verifique que o shader PAUSA quando você scrolla pra baixo (offscreen)
- Verifique que o shader PAUSA quando muda de tab
- Verifique com Rendering → prefers-reduced-motion: reduce → fallback CSS aparece
- Verifique dark mode toggle: paleta muda suavemente

CRITÉRIO: 60fps no desktop, 30fps+ no throttle 6x. Pausa offscreen. Pausa em tab inativa.

Atualize SCRATCHPAD.md: "Fase 2: Hero MeshGradient implementado"
```

---

## FASE 3: Processing State Shader + Confetti de Sucesso (1.5-2h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, mobile-design.

Leia apps/frontend/src/components/AnalysisProgress.tsx (progress atual).
Leia apps/frontend/src/components/HomeContent.tsx (state machine).

OBJETIVO: Adicionar shader "AI pensando" durante processamento e confetti
quando a análise revela economia significativa.

### T9: Criar componente ProcessingShader

Crie apps/frontend/src/components/ProcessingShader.tsx:

'use client';
- Importa Metaballs (ou SmokeRing) de @paper-design/shaders-react
- Configuração:
  - speed: 0.3 (um pouco mais rápido que o hero — indica "trabalhando")
  - scale: 1.2
  - colors: verde do Cancelai + cinza neutro
    Light: ['#22c55e', '#6ee7b7', '#d1d5db']
    Dark: ['#4ade80', '#34d399', '#374151']
- Dimensões: 200x200px (não fullscreen — fica ao lado do progress text)
- Bordas arredondadas: borderRadius: '50%' (circular)
- Mesmas defesas de performance do hero:
  - useReducedMotion() → se true, mostra ícone SVG animado simples
  - visibilitychange → pausa
  - NÃO precisa de IntersectionObserver (está no viewport enquanto visível)

IMPORTANTE: Este shader é MONTADO quando state === 'processing' ou 'streaming'
e DESMONTADO quando state === 'complete' ou 'error'. O unmount libera o contexto WebGL.

CRITÉRIO: Shader aparece durante processamento, desmonta ao completar.

### T10: Integrar ProcessingShader no AnalysisProgress

No AnalysisProgress.tsx:
- Quando o estado é 'processing' ou 'streaming', renderize o ProcessingShader
  ao lado do texto de progresso
- Layout: flex row, shader à esquerda (200x200), texto à direita
- Em mobile: shader menor (120x120) acima do texto, flex col
- Transição de entrada: m.div com opacity 0→1, scale 0.8→1
- Transição de saída: opacity 1→0 (rápido, 200ms)

CRITÉRIO: Shader visível durante análise. Layout responsivo. Desmonta ao completar.

### T11: Implementar confetti de sucesso

Crie apps/frontend/src/components/SuccessConfetti.tsx:

'use client';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';

interface Props {
  trigger: boolean;
  annualSavings: number;
}

export function SuccessConfetti({ trigger, annualSavings }: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!trigger || reduceMotion) return;

    // Só dispara confetti se economia >= R$100/ano (impacto significativo)
    if (annualSavings < 100) return;

    // Confetti burst do centro
    confetti({
      particleCount: annualSavings > 500 ? 150 : 80,  // mais confetti = mais economia
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
      disableForReducedMotion: true,  // built-in do canvas-confetti
    });
  }, [trigger, annualSavings, reduceMotion]);

  return null;  // canvas-confetti cria seu próprio canvas overlay
}

NOTA: canvas-confetti é ~3KB, cria canvas efêmero que se auto-destrói.
disableForReducedMotion é built-in — respeita prefers-reduced-motion automaticamente.

### T12: Integrar confetti no fluxo de resultados

No HomeContent.tsx (ou Results.tsx):
- Renderize <SuccessConfetti trigger={state === 'complete'} annualSavings={totalAnual} />
- O trigger dispara UMA VEZ quando o estado muda pra 'complete'
- annualSavings vem do summary.totalAnnualAmount (ou cálculo equivalente)
- Se economia < R$100/ano: sem confetti (não é impactante o suficiente)
- Se economia R$100-500: confetti moderado (80 partículas)
- Se economia > R$500: confetti intenso (150 partículas)

CRITÉRIO: Confetti dispara no complete com economia significativa. Não dispara com reduced motion.

Atualize SCRATCHPAD.md: "Fase 3: Processing shader + confetti implementados"
```

---

## FASE 4: Glass Morphism nos Cards + CSS Enhancements (1-1.5h)

```
Use @frontend-developer e @ui-ux-designer.
Aplique skills: ui-ux-pro-max, frontend-design.

Leia apps/frontend/src/components/SubscriptionCard.tsx.
Leia apps/frontend/src/components/Features.tsx.
Leia apps/frontend/src/app/globals.css.

OBJETIVO: Adicionar glass morphism nos cards de resultado e features,
border glow no CTA, e shimmer na dropzone — tudo via CSS puro (zero shaders).

### T13: Glass morphism nos SubscriptionCards

No SubscriptionCard.tsx, atualize as classes do card container:

DE (provavelmente algo como):
  "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl"

PARA:
  "backdrop-blur-md bg-white/70 dark:bg-white/5
   border border-white/20 dark:border-white/10
   rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20
   hover:bg-white/80 dark:hover:bg-white/10
   hover:shadow-xl hover:shadow-green-500/5 dark:hover:shadow-green-500/10
   transition-all duration-300"

NOTA: backdrop-blur-md funciona em todos os browsers modernos (Chrome 76+, Safari 9+).
Em Android antigo sem suporte, o fallback natural é o bg-white/70 que fica opaco.

Adicione hover scale sutil:
  "hover:scale-[1.01] active:scale-[0.99]"
  (Já existia algo similar? Mantenha consistente)

CRITÉRIO: Cards têm efeito glass visível. Hover tem feedback visual. Dark mode ok.

### T14: Glass morphism nos Feature cards

No Features.tsx, aplique o mesmo pattern de glass nos 4 cards de features
(Seguro, Rápido, Transparente, Sem rastros):

  "backdrop-blur-sm bg-white/50 dark:bg-white/5
   border border-white/30 dark:border-white/10
   rounded-2xl p-6
   hover:bg-white/70 dark:hover:bg-white/10
   transition-all duration-300"

Os ícones (shield, zap, eye, trash) devem ter um glow sutil no hover:
  "group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]
   transition-all duration-300"

CRITÉRIO: Feature cards com glass. Ícones com glow verde no hover.

### T15: Border glow no botão CTA principal

No botão "Analisar" (ou equivalente CTA primário):

Adicione border glow animado via CSS:

Em globals.css, adicione:
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,0.4), 0 0 20px rgba(34,197,94,0.1); }
    50% { box-shadow: 0 0 10px rgba(34,197,94,0.6), 0 0 30px rgba(34,197,94,0.2); }
  }

  .btn-glow {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn-glow {
      animation: none;
      box-shadow: 0 0 5px rgba(34,197,94,0.4);  /* glow estático */
    }
  }

No botão: adicione className="btn-glow" além das classes existentes.

CRITÉRIO: Botão pulsa com glow verde. Glow estático com reduced-motion.

### T16: Shimmer border na dropzone durante drag

No FileUpload.tsx (ou componente de dropzone):

Quando isDragActive (do react-dropzone), adicione borda animada:

Em globals.css:
  @keyframes border-rotate {
    0% { --angle: 0deg; }
    100% { --angle: 360deg; }
  }

  .dropzone-active {
    border: 2px solid transparent;
    background: linear-gradient(var(--bg), var(--bg)) padding-box,
                conic-gradient(from var(--angle), #22c55e, #3b82f6, #22c55e) border-box;
    animation: border-rotate 3s linear infinite;
  }

  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

NOTA: @property é suportado em Chrome 85+ e Safari 15.4+.
Fallback: border-color: #22c55e (borda verde sólida).

No componente:
  className={isDragActive ? 'dropzone-active' : 'border-dashed border-2 border-gray-300'}

CRITÉRIO: Borda rotativa colorida aparece ao arrastar arquivo. Fallback sólido em browsers antigos.

### T17: Stats números com glow hover

Nos stats (15+ Bancos, 500+ Serviços, 0 Dados):

Adicione hover effect nos números:
  "hover:text-green-500 dark:hover:text-green-400
   hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]
   transition-all duration-300 cursor-default"

CRITÉRIO: Números ganham glow verde ao hover. Transição suave.

### T18: Melhorar FAQ accordion com animação

No componente de FAQ (accordion):
- Adicione animação de height com m.div (já usa LazyMotion):
  <m.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
- Ícone de chevron rotaciona 180° quando aberto:
  className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}

CRITÉRIO: FAQ abre/fecha com animação suave. Chevron rotaciona.

Rode turbo build para garantir que tudo compila.
Teste dark mode em todos os componentes modificados.
Teste em Chrome DevTools mobile (Galaxy A15).

Atualize SCRATCHPAD.md: "Fase 4: Glass morphism + CSS enhancements completos"
```

---

## FASE 5: AIDesigner MCP — Design Refresh (1-1.5h)

```
Use @ui-ux-designer e @frontend-developer.
Aplique skills: ui-ux-pro-max, mobile-design, frontend-design.

NOTA: Esta fase usa o AIDesigner MCP. Se o usuário NÃO tiver conta Pro ($25/mo),
pule esta fase — as melhorias das fases 1-4 já são significativas.

OBJETIVO: Usar AIDesigner MCP para gerar layout refresh do hero e results,
depois portar o design pra React/Tailwind mantendo os shaders já implementados.

### T19: Gerar design do hero via AIDesigner

No Claude Code, use o MCP AIDesigner (se disponível):

Prompt sugerido para o AIDesigner:
  "Design a hero section for Cancelai, a Brazilian SaaS that detects forgotten
   subscriptions from bank statements. Dark mode first. Stats: 15+ Banks, 500+ Services,
   0 Data stored. Two CTAs: 'Upload de extrato' and 'Conectar banco' as tabs.
   Animated mesh gradient background (already implemented separately).
   Typography: bold headline 'Descubra assinaturas esquecidas', green accent on
   'esquecidas'. Modern fintech aesthetic like Mercury or Stripe. Mobile-first.
   Use Tailwind CSS dark: variants. Green primary #22c55e."

Se AIDesigner não estiver disponível, PULE para T21.

O output será salvo em .aidesigner/runs/<id>/design.html + preview.png.

CRITÉRIO: Design gerado e salvo. Preview visual disponível.

### T20: Portar design AIDesigner para React

O AIDesigner gera HTML puro com Tailwind classes.
Porte para os componentes React existentes:

- Extraia as classes Tailwind relevantes do HTML gerado
- Aplique no HomeContent.tsx hero section
- Mantenha: HeroBackground shader, m.div animations, react-countup
- Incorpore: novas classes de tipografia, spacing, hierarquia
- NÃO substitua componentes inteiros — aplique melhorias incrementais
- Garanta que o shader background continua funcionando por trás do novo layout

CRITÉRIO: Hero atualizado com melhor hierarquia visual. Shader continua funcionando.

### T21: Refinamentos manuais de tipografia e spacing

Se AIDesigner não foi usado (T19-T20 puladas), faça estes refinamentos manualmente:

1. Título "Descubra assinaturas esquecidas":
   - Aumente pra text-5xl md:text-7xl (atualmente provavelmente text-4xl md:text-6xl)
   - "esquecidas" em text-green-500 com font-italic pra dar mais ênfase
   - Adicione tracking-tight pro título ficar mais compacto e moderno

2. Subtítulo:
   - text-lg md:text-xl text-gray-600 dark:text-gray-400
   - max-w-2xl mx-auto (centralizar e limitar largura pra legibilidade)

3. Stats (15+, 500+, 0):
   - text-3xl md:text-4xl font-bold (números maiores)
   - Labels: text-xs uppercase tracking-widest text-gray-500
   - Gap entre stats: gap-8 md:gap-12

4. Método selector tabs:
   - Borda arredondada mais pronunciada: rounded-full
   - Active tab: bg-green-500 text-white shadow-lg
   - Inactive tab: bg-transparent text-gray-600 hover:text-gray-900

5. Espaçamento geral:
   - Hero: py-20 md:py-32 (mais breathing room)
   - Seções: py-16 md:py-24 com separator sutil entre elas

CRITÉRIO: Tipografia mais impactante. Hierarquia visual clara. Mobile responsivo.

### T22: Dark mode shader integration polish

Verifique que TODOS os componentes modificados nas fases 1-4 funcionam
perfeitamente quando o dark mode alterna:

1. Shader MeshGradient: paleta muda de light → dark e vice-versa
   (pode precisar de um useEffect que recria o shader ou muda as colors em tempo real)
2. Glass morphism cards: bg-white/70 → bg-white/5 (suficientemente contrastante?)
3. Overlay do hero: bg-white/60 → bg-black/50 (texto legível em ambos?)
4. Glow effects: intensidade adequada em ambos os modos?
5. Confetti: cores ficam visíveis tanto em light quanto dark?
6. Dropzone shimmer: gradiente conic visível em ambos?

Corrija qualquer inconsistência encontrada.

CRITÉRIO: Toggle dark/light 10x sem glitches visuais.

Rode turbo build.
Teste mobile.
Atualize SCRATCHPAD.md: "Fase 5: Design refresh completo"
```

---

## FASE 6: Verificação Final + Performance Audit (30-45min)

```
Use @code-reviewer, @test-engineer e @frontend-developer.
Aplique skill mobile-design.

OBJETIVO: Garantir que tudo funciona, performa bem, e não quebrou nada.

### T23: Bundle size audit

Rode: ANALYZE=true npm run build --filter=frontend 2>&1 | tail -30

Verifique:
1. First Load JS ainda < 200KB (era 158KB, budget é +50KB = 208KB max)
2. @paper-design/shaders-react aparece como chunk separado (dynamic import)
3. canvas-confetti aparece como chunk separado
4. Nenhuma dependência inesperada foi puxada (three.js, etc.)

Se over budget:
- Verifique se ShaderMesh é realmente dynamic imported (ssr: false)
- Verifique que canvas-confetti é importado apenas no SuccessConfetti
- Considere remover o shader do processing state (T9-T10) se necessário

CRITÉRIO: First Load JS < 208KB. Shaders em chunks separados.

### T24: Performance test mobile

Chrome DevTools, CPU throttle 6x, device mode Galaxy A15:

1. Carregue a página → FCP deve ser < 2s (CSS fallback renderiza primeiro)
2. Shader aparece → deve ser smooth (sem jank)
3. Scroll pra baixo → shader PAUSA (verificar no Performance tab)
4. Scroll de volta → shader RETOMA
5. Mude de tab → shader PAUSA
6. Volte → shader RETOMA
7. Ative reduced-motion → fallback CSS aparece, zero canvas
8. Inicie uma análise → processing shader aparece
9. Complete análise com economia > R$100 → confetti dispara
10. Toggle dark mode → paleta do shader muda corretamente

Se FPS < 30 em qualquer momento:
- Reduza speed do MeshGradient pra 0.1
- Reduza distortion pra 0.5
- Cap DPR pra 1.0 (em vez de 1.5)
- Como último recurso: desabilite shader em mobile (só CSS fallback)

CRITÉRIO: Todos os 10 cenários passam. FPS >= 30 com throttle 6x.

### T25: Accessibility check

1. Tab navigation funciona em todos os elementos interativos?
2. Screen reader anuncia conteúdo corretamente sobre o shader?
3. Contrast ratio do texto sobre o shader overlay é >= 4.5:1?
   Use Chrome DevTools → Elements → inspect text → ver contrast ratio
   Se < 4.5:1: aumente opacidade do overlay
4. aria-hidden="true" no canvas do shader? (é decorativo)
5. Confetti não causa seizure risk? (canvas-confetti tem built-in protection)
6. motion-reduce:hidden no container do shader canvas?

CRITÉRIO: WCAG AA compliance em todos os textos sobre shader.

### T26: Build, testes, e deploy

```bash
# Build completo
turbo build

# Testes (nenhum teste deveria quebrar — shaders são frontend-only)
turbo test

# TypeScript
turbo typecheck

# Lint
turbo lint

# Se tudo passa:
git add -A
git commit -m "feat(frontend): add Paper Shaders hero + processing effects + glass morphism + confetti

- MeshGradient shader no hero com paleta light/dark
- CSS fallback para reduced-motion e SSR
- Metaballs shader durante processing state
- canvas-confetti no success com economia > R$100
- Glass morphism nos subscription cards e feature cards
- Border glow no CTA, shimmer na dropzone
- Performance: DPR capped, IntersectionObserver pause, visibilitychange pause
- Bundle impact: +~35KB em chunks lazy-loaded"

git push origin main
```

CRITÉRIO: CI green. Deploy automático no Railway funciona.

Atualize SCRATCHPAD.md: "Shaders integration completa. Bundle: XKB. FPS: X@mobile"
Atualize ARCHITECTURE.md seção Frontend: adicione Paper Shaders nas dependências
e documente o pattern de shader lazy loading + CSS fallback.
```

---

## Resumo de Execução

```
Fase 1 (30min):   Setup MCPs + dependências
  /clear
Fase 2 (1.5-2h):  Hero MeshGradient shader
  /clear
Fase 3 (1.5-2h):  Processing shader + confetti sucesso
  /clear
Fase 4 (1-1.5h):  Glass morphism + CSS enhancements
  /clear
Fase 5 (1-1.5h):  AIDesigner design refresh (opcional se sem conta Pro)
  /clear
Fase 6 (30-45min): Verificação + performance audit

Total: ~6-9 horas em 6 sessões
```

### Agents por fase:
| Fase | Agents | Skills |
|------|--------|--------|
| 1 | @devops-engineer, @frontend-developer | — |
| 2 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max, mobile-design, frontend-design |
| 3 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max, mobile-design |
| 4 | @frontend-developer, @ui-ux-designer | ui-ux-pro-max, frontend-design |
| 5 | @ui-ux-designer, @frontend-developer | ui-ux-pro-max, mobile-design, frontend-design |
| 6 | @code-reviewer, @test-engineer, @frontend-developer | mobile-design |

### O que NÃO fazer:
- NÃO instale three.js, @react-three/fiber, ou shadergradient (150KB+)
- NÃO rode 2 shaders animados ao mesmo tempo (1 max)
- NÃO use shaders pra efeitos que CSS faz melhor (glass, glow, shimmer)
- NÃO esqueça de pausar shaders offscreen (IntersectionObserver)
- NÃO esqueça useReducedMotion() em CADA componente com shader
- NÃO anime propriedades de layout (width/height) sobre o canvas do shader
- NÃO coloque aria-live no canvas (é decorativo, use aria-hidden="true")

### Métricas de sucesso:
- [ ] Hero com MeshGradient animado (light + dark)
- [ ] CSS fallback para reduced-motion
- [ ] Processing state com shader Metaballs
- [ ] Confetti no success com economia > R$100
- [ ] Glass morphism em subscription cards e feature cards
- [ ] Border glow no CTA principal
- [ ] Shimmer border na dropzone ao arrastar
- [ ] First Load JS < 208KB
- [ ] 30fps+ no Galaxy A15 (CPU throttle 6x)
- [ ] WCAG AA contrast em texto sobre shader
- [ ] Zero referências a three.js no bundle
- [ ] Testes passando (turbo test)
- [ ] Build ok (turbo build)
- [ ] Deploy Railway funcionando
