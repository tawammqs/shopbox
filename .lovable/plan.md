
Vou montar um plano focado. O escopo total já existe quase todo (storefront, admin, marketplace, temas). O que falta de fato é a **Layer 1 (Landing NuvemShop-style + Signup multi-step com bug do plano)**. Vou priorizar isso e listar o que mantenho como está.

## O que já existe (NÃO refazer)
- Storefront completo (`/loja/$slug/*`) — header, busca, carrinho, wishlist, produto, categoria
- Admin completo (`/admin/*`) — produtos, categorias, banners, descontos, reviews, configurações, plano
- Theme Marketplace (`/temas`, `/temas/$slug`, `/admin/temas`, `/superadmin/temas`)
- Schema Supabase (stores, products, plans, themes, etc.) com RLS
- Stripe checkout embutido + webhook
- Auth (login, recuperar senha, reset)

## O que vou construir nesta entrega

### 1. Landing Page nova (`src/routes/index.tsx`) — estilo NuvemShop
- Header sticky branco: logo "ShopBox" · nav (Funcionalidades, Temas, Preços, Blog) · "Entrar" + "Criar loja grátis" (pill teal)
- Hero: tag + headline grande + subtítulo + 2 CTAs pill + linha de confiança · mockup de loja à direita com badge flutuante "Compra finalizada pelo WhatsApp"
- Trust bar: "Mais de 1.200 lojistas..." + ícones
- Features: grid 6 cards (Lucide icons)
- Como funciona: 3 passos horizontais
- Temas preview: strip horizontal scrollable com cards lendo `themes` do banco
- Pricing: 3 cards lendo `plans` do banco, "Profissional" destacado com borda teal + badge "Mais Popular"
- Testimonials: fundo cinza claro, 3 quote cards
- FAQ: accordion (shadcn) com 7 perguntas
- CTA final: faixa teal full-width
- Footer: dark `#111827`, 4 colunas + redes sociais

### 2. Tokens de design (`src/styles.css`)
- Adicionar variáveis CSS para landing: `--brand-teal: #00b7a8`, `--brand-ink: #111827`, `--brand-soft: #f7f8fa`
- Importar Google Fonts: Plus Jakarta Sans (700/800) + Inter (400/500/600)
- Classe utilitária `.font-display` para headings da landing/marketplace (NÃO altera storefront que usa Playfair via theme tokens)

### 3. Refatorar Signup (`src/routes/cadastro.tsx`) — corrigir bug do plano
Atual: estado local OK, mas o plano não é selecionado antes do checkout (clica direto no card e dispara tudo). Vou converter para fluxo linear de 3 passos com validação Zod e seleção persistente.

**Step 1 — Conta:**
- React Hook Form + Zod
- Campos: nome, email, senha (toggle olho), confirmar senha, nome da loja, segmento
- Segmento: `<Select>` shadcn com **SelectGroup** para todas as 15 categorias e ~100 segmentos da spec
- Slug auto-gerado a partir do nome da loja, com check de unicidade ao avançar
- Botão "Próximo" desabilitado até validação passar

**Step 2 — Plano:**
- 3 cards lado a lado (mobile: empilhados)
- Clique apenas **seleciona** (borda teal + checkmark), NÃO avança
- Estado `selectedPlanId` mantido no objeto de form
- "Próximo" só habilita com plano selecionado · "Voltar" preserva tudo

**Step 3 — Pagamento:**
- Resumo: nome do plano + R$/mês
- Nota "PIX também disponível em breve"
- Botão "Criar minha loja" executa atomicamente:
  1. `supabase.auth.signUp` + signIn
  2. `INSERT stores` com `plan_id`, `subscription_status='trialing'`
  3. `createCheckoutSession` (Stripe Embedded já existente)
  4. Mostra `<EmbeddedCheckout>` inline
- "Voltar" preserva plano e dados
- Tratamento de erros inline (email duplicado, slug em uso, falha Stripe)

**Stepper visual:** 3 bolinhas com labels "Conta · Plano · Pagamento", barra teal entre etapas concluídas

### 4. Rotas auxiliares
- `src/routes/funcionalidades.tsx` — página de features expandida
- `src/routes/precos.tsx` — só a seção pricing + FAQ

Cada uma com `head()` próprio (title, description, og:title, og:description).

## O que NÃO vou tocar
- Storefront (`/loja/*`) — já funciona, tema é theme-driven
- Admin (`/admin/*`) — já está completo
- Marketplace (`/temas/*`, `/superadmin/*`)
- Schema Supabase, RLS, edge functions, Stripe webhook
- `src/integrations/supabase/*`, `src/styles.css` (só adições, sem reescrever)

## Detalhes técnicos
- Dependências: tudo já instalado (`react-hook-form`, `zod`, `@hookform/resolvers`, shadcn `Select`/`Accordion`/`Form`, `lucide-react`)
- Fontes via `<link>` no `__root.tsx` head
- Mockup do hero: SVG/Tailwind compondo um "frame" de loja (sem dependência externa)
- Validação de slug: query `stores` antes de avançar do Step 1
- Plans/themes lidos com `useQuery` do banco (já há tabelas `plans` e `themes`)

## Estrutura de arquivos
```text
src/routes/
  index.tsx              ← REESCRITO (landing NuvemShop)
  cadastro.tsx           ← REESCRITO (3 steps + Zod + dropdown completo)
  funcionalidades.tsx    ← NOVO
  precos.tsx             ← NOVO
src/components/marketing/
  MarketingHeader.tsx    ← NOVO (header branco sticky)
  MarketingFooter.tsx    ← NOVO (footer dark)
  HeroMockup.tsx         ← NOVO (SVG mockup loja)
  PricingCards.tsx       ← NOVO (compartilhado index/precos)
  FaqAccordion.tsx       ← NOVO
src/lib/
  segments.ts            ← NOVO (lista agrupada de segmentos)
src/styles.css           ← + tokens marketing + import fonts
src/routes/__root.tsx    ← + <link> Plus Jakarta Sans / Inter
```

## Riscos e mitigação
- **Risco:** seed `plans` no banco pode não ter os 3 slugs (`inicial`/`profissional`/`premium`) com `stripe_price_id`. **Mitigação:** verifico antes de implementar; se faltar, faço uma migration de seed.
- **Risco:** quebrar storefront ao mexer em `styles.css`. **Mitigação:** só adicionar variáveis novas (`--brand-*`), não tocar em tokens de tema existentes.
