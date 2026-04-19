

## Tarefas
1. Verificar `/loja/demo` na URL publicada (`shopbox.lovable.app`) após republicação
2. Migrar a landing `/` para o design escuro do `/preview-dark`

## Etapa 1 — Validar produção

- `browser--navigate_to_url` → `https://shopbox.lovable.app/loja/demo`
- `browser--screenshot` + `browser--read_console_logs` → confirmar sem erro #185
- Reportar ao usuário com screenshot

## Etapa 2 — Migrar landing para dark

### 2.1 Análise do que existe hoje

- **`/preview-dark`** (`src/routes/preview-dark.tsx`) — design escuro premium completo com hero centralizado, mockup WhatsApp, ticker animado, dashboard mock, métricas, pricing, FAQ acordeão, CTA final. Todo escopado dentro de `.pdark` para isolar do resto.
- **`/`** (`src/routes/index.tsx`) — landing clara atual usando `MarketingHeader` + `HeroMockup` + `PricingCards` + `FaqAccordion` + `MarketingFooter`.

### 2.2 Estratégia de migração

**Não mexer nos componentes compartilhados** (`MarketingHeader`, `MarketingFooter`, `PricingCards`, etc.) porque eles são usados em outras rotas (`/precos`, `/funcionalidades`, `/temas`, etc). Em vez disso:

1. **Substituir `src/routes/index.tsx`** pelo conteúdo de `preview-dark.tsx` (sem o escopo `.pdark` — agora vira o tema da landing inteira) **mas mantendo `MarketingHeader` e `MarketingFooter`** já existentes para consistência com outras páginas marketing.

2. **Adaptar o header/footer compartilhado pra ficarem bem em fundo escuro**:
   - `MarketingHeader.tsx` — adicionar variant ou usar tokens que respeitem fundo escuro. Mais simples: deixar header com fundo `bg-background/95 backdrop-blur` que já é responsivo via tokens. Mas como o `--background` é branco no `:root`, precisamos forçar dark na landing.
   - Solução pragmática: na `index.tsx` envolver tudo em `<div className="dark bg-background text-foreground">` para ativar tokens dark globais (que devem existir em `styles.css` no bloco `.dark`).

3. **Fonts**: já está Geist global, ok.

4. **Logo no header em dark**: a logo PNG `shopbox-logo.png` é preta. No fundo escuro precisa do filtro invert. Vou verificar como o `MarketingHeader` renderiza e adicionar suporte a dark mode (usando `dark:invert` na img).

5. **Footer**: já tem `filter: invert(1) brightness(2)` aplicado — vai ficar correto em fundo escuro.

### 2.3 Plano de arquivos

**Arquivos a editar/criar:**

```
src/routes/index.tsx                          ← REESCRITO (conteúdo do preview-dark, com MarketingHeader/Footer)
src/components/marketing/MarketingHeader.tsx  ← adicionar dark:invert na logo + fundo respeitando dark
src/components/marketing/PricingCards.tsx     ← variant dark (passar prop ou ler de contexto)
src/components/marketing/FaqAccordion.tsx     ← variant dark
src/styles.css                                ← garantir que `.dark` tem tokens corretos (já tem provavelmente)
```

**Decisão**: para minimizar risco e tempo, vou:
- Reescrever `index.tsx` inline, **incluindo header/footer próprios escuros** (sem usar os Marketing*), porque o preview-dark já tem header/footer completos no design escuro. Isso evita ter que fazer variants em 3 componentes.
- Manter os componentes `MarketingHeader`/`MarketingFooter` intactos para que outras rotas marketing (`/precos`, `/funcionalidades`, etc.) continuem funcionando.
- **Trade-off**: agora `/` fica desconectado visualmente de `/precos` e `/funcionalidades`. O usuário precisa decidir se quer migrar essas também — pergunto no final.

### 2.4 Conteúdo final de `index.tsx`

Cópia do `preview-dark.tsx` removendo o wrapper `.pdark` (vira global na rota), mantendo:
- Hero centralizado com pílula verde "Loja em 5 minutos"
- Mockup conversa WhatsApp
- Ticker animado
- Dashboard mock
- Strip métricas (12k+, 3x, 30min, 4.9★)
- Pricing 3 cards (com plano destacado)
- FAQ acordeão
- CTA final
- Footer escuro

Adicionar `head()` da landing original (titles SEO).

### 2.5 Limpeza

- Manter `/preview-dark` por enquanto como referência. Não deletar até o usuário confirmar que gostou.

## Riscos
- **Outras rotas marketing** (`/precos`, `/funcionalidades`, `/temas`) ficam claras enquanto `/` fica escura — inconsistência. Vou avisar e oferecer migrar depois.
- **Logo no header escuro**: usar versão branca via `filter: invert(1) brightness(2)` — testado no footer.
- **SEO**: preservar `head()` da landing original.

