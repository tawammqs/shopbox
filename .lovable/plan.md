# Menu Marketing + 5 Add-ons pagos

Implementação completa do menu Marketing com 5 funções vendidas como assinaturas Stripe separadas dos planos principais.

## 1. Banco de dados (uma migration)

- `store_addons` — controla status de cada add-on por loja (`addon_key`, `plan_tier`, `status`, `stripe_subscription_id`, `current_period_end`).
- `store_addon_configs` — config JSON genérico por addon (`grupo_vip`, `captura_leads`, `compre_junto`).
- `store_videos` — vídeos do Video Commerce (`placement: home_carousel | product_stories`, `product_id`, `position`, `views_count`).
- RLS + GRANTs em todas (owner do store para escrita; SELECT público em `store_addon_configs` e `store_videos` para o storefront ler).
- Bucket de Storage `store-videos` (público) para upload de vídeos.

## 2. Edge function `create-addon-checkout`

Cria Stripe Checkout `mode: subscription` com price ID por `addon_key` + `plan_tier`. Os 7 price IDs são lidos de secrets (`STRIPE_PRICE_VIDEO_INICIANTE`, etc.) — placeholder vazio se não configurado, com mensagem clara de erro. Success/cancel URLs retornam ao admin com `?addon_success=true`.

## 3. Webhook `payments-webhook` (extensão, não substituição)

Adicionar handlers para:
- `checkout.session.completed` com `metadata.addon_key` → upsert `store_addons` (status `active`).
- `customer.subscription.updated` / `.deleted` → atualiza `status` e `current_period_end` quando `stripe_subscription_id` bate em `store_addons`.

Lógica existente (assinaturas de planos, temas) permanece intocada.

## 4. Frontend — admin

**Sidebar (`AdminShell.tsx`):** novo grupo "MARKETING" abaixo de Produtos com 5 itens; badge de cadeado quando addon inativo. Remover "Perguntas e Avaliações" do grupo Clientes.

**Helpers/Hooks:**
- `src/lib/addons.ts` — `ADDON_INFO`, `getAddonStatus`, `useAddonStatus(storeId, key)`, `useAddonConfig(storeId, key)`.

**Componentes compartilhados:**
- `src/components/admin/marketing/AddonPaywall.tsx` — tela de venda com seletor de plano (Video Commerce) ou card único.
- `src/components/admin/marketing/AddonConfigForm.tsx` — formulários reusáveis (Grupo VIP, Captura Leads, Compre Junto).

**Rotas novas:**
- `admin.marketing.tsx` (layout com `<Outlet/>`)
- `admin.marketing.index.tsx` (redireciona para video-commerce)
- `admin.marketing.video-commerce.tsx` — paywall ou 2 abas (Carrossel home / Stories produto) + métricas se tier ≥ essencial.
- `admin.marketing.grupo-vip.tsx` — paywall ou config (link grupo, textos, toggle ativo).
- `admin.marketing.captura-leads.tsx` — paywall ou config (cupom, %, título, aniversário, delay).
- `admin.marketing.compre-junto.tsx` — paywall ou config (combos + faixas progressivas).
- `admin.marketing.perguntas-avaliacoes.tsx` — paywall ou tela existente movida (mantém `product_questions` / `product_reviews`).

**Remoção:** `admin.clientes.avaliacoes.tsx` deixa de aparecer no menu Clientes (o arquivo pode permanecer, mas o link sai da sidebar). Conteúdo reaproveitado na nova rota.

## 5. Storefront — leitura dos novos configs

Tema padrão (`themini`) passa a ler `store_addon_configs` no loader de `/loja/$slug` e renderizar quando `active = true`:
- `grupo_vip` → seção "Ofertas Secretas" + redirect para grupo após captura WhatsApp em `vip_group_leads`.
- `captura_leads` → popup de cupom (substitui o atual `WelcomePopup` quando o addon está ativo; senão segue legacy).
- `compre_junto` → CartDrawer aplica combos e desconto progressivo.
- `video_commerce` → `store_videos` no `home_carousel` (homepage) e `product_stories` (página de produto).

The Shoes (tema Mio) continua com sua lógica atual intocada.

## 6. Compatibilidade

- Nada do checkout WhatsApp, RLS existente, feed XML, Mio Style, ou storefront público de lojas existentes é alterado.
- Webhook existente é estendido, nunca substituído.
- "Perguntas e Avaliações" da The Shoes continua funcionando — apenas a configuração no admin migra de lugar.

## Detalhes técnicos

- Server functions com `createServerFn` + `requireSupabaseAuth` para criar checkout e ler `store_addons` no admin. Webhook continua em edge function (chamado externamente pelo Stripe).
- Price IDs do Stripe são placeholders — usuário precisa criar 7 produtos/preços recorrentes no painel Stripe e cadastrar como secrets (`STRIPE_PRICE_VIDEO_INICIANTE`, `STRIPE_PRICE_VIDEO_ESSENCIAL`, `STRIPE_PRICE_VIDEO_PROFISSIONAL`, `STRIPE_PRICE_VIDEO_ESCALA`, `STRIPE_PRICE_GRUPO_VIP`, `STRIPE_PRICE_CAPTURA_LEADS`, `STRIPE_PRICE_COMPRE_JUNTO`, `STRIPE_PRICE_PERGUNTAS_AVALIACOES`). Sem eles, o paywall mostra UI mas o "Ativar agora" retorna erro claro.

## Estimativa

~25 arquivos: 1 migration, 1 edge function nova, 1 edge function editada, ~10 rotas/componentes admin, ~5 edits no storefront, sidebar, helpers. Vai em um único turno.
