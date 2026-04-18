
# Plano: Plataforma SaaS E-commerce Multi-Loja

Transformação completa do projeto: de loja única para SaaS multi-tenant com landing page, signup, planos pagos via Stripe e todas as features avançadas (cupons, promoções, wishlist, reviews, etc).

## ⚠️ Avisos importantes antes de começar

1. **Escopo gigante**: Isso são ~40+ features. Vou construir tudo, mas espere precisar de iterações de polimento depois — é normal em builds desta escala.
2. **Stripe real exige plano Pro do Lovable**. Quando eu chamar `enable_stripe_payments`, se você não estiver no Pro, vai bloquear. Se isso acontecer, podemos cair para "mock UI" temporariamente.
3. **Wipe de dados**: Tudo que existe hoje (loja "Minha Loja", produtos demo, admin tawam.mqs@outlook.com) será **apagado** e recriado num esquema multi-tenant. Você poderá criar um novo signup como qualquer usuário.
4. **Subdomínios**: vou usar `/loja/<slug>` (path-based) — funciona imediatamente em qualquer URL.

## 🗄️ Novo schema multi-tenant

**Tabelas core (todas com `store_id` + RLS por loja):**
- `stores` — id, owner_user_id, name, slug (único, vira `/loja/<slug>`), segment, logo_url, favicon_url, accent_color, tagline, whatsapp, social URLs, trust_badges (JSONB), shipping_rates (JSONB), seo_meta, welcome_popup (JSONB), plan_id, subscription_status, stripe_customer_id, stripe_subscription_id, created_at
- `plans` — id, name (Básico/Profissional/Premium), price_cents, stripe_price_id, max_products, features (JSONB)
- `categories` — `+ store_id`
- `products` — `+ store_id`, `low_stock_threshold`, `meta_title`, `meta_description`, `size_guide_url`
- `product_images`, `product_colors`, `product_sizes`, `product_stock` (mantém por relacionamento via product)
- `product_video_testimonials` — id, product_id, video_url, kind (youtube|mp4), customer_name, rating, quote, position
- `product_reviews` — id, product_id, customer_name, rating, text, status (pending|approved|rejected), created_at
- `banners` — `+ store_id`
- `static_pages` — id, store_id, slug (sobre/politicas/contato), title, content_md
- `coupons` — id, store_id, code, type (fixed|percent), value, min_cart, max_uses, max_uses_per_customer, expires_at, scope_type, scope_ids (JSONB), first_purchase_only, active
- `coupon_uses` — id, coupon_id, customer_whatsapp, used_at
- `promotions` — id, store_id, name, badge_label, type (percent|fixed), value, scope_type, scope_ids, starts_at, ends_at, active
- `combo_promotions` — id, store_id, name, badge_label, scope_type, scope_ids, min_quantity, discount_kind (fixed_total|percent|free_n), discount_value, active
- `stock_notify_requests` — id, product_id, color_id, size_id, customer_whatsapp, notified
- `subscription_events` — id, store_id, stripe_event_id, type, payload (audit log)

**Funções/triggers:**
- `is_store_owner(_store_id)` — security definer para RLS
- `has_role(...)` mantido (admin global da plataforma para suporte)
- Trigger: ao criar `store`, criar categorias/configs default

**RLS:** SELECT público em produtos/categorias/banners/reviews aprovadas/etc (apenas onde a loja está ativa). INSERT/UPDATE/DELETE só para `is_store_owner` ou `has_role('admin')`.

## 🌐 LAYER 1 — Landing SaaS (rotas públicas raiz)

- `/` — Landing: hero, features, pricing (3 planos), depoimentos, FAQ, footer
- `/cadastro` — Wizard 3 passos: dados+loja → plano → checkout Stripe
- `/login` — login dono de loja
- `/recuperar-senha` + `/reset-password`
- Após signup → cria `store` + redireciona para `/painel` com checklist de onboarding

## 🏪 LAYER 2 — Storefront por loja: `/loja/$slug/*`

- `/loja/$slug/` — home (banners, seções por tag, grid categorias, popup boas-vindas)
- `/loja/$slug/categoria/$cat` e `/.../$cat/$sub`
- `/loja/$slug/produto/$produto` — galeria zoom, variações, vídeos depoimento, reviews, relacionados, "notificar quando disponível"
- `/loja/$slug/favoritos` — wishlist (localStorage por loja)
- `/loja/$slug/sobre`, `/politicas`, `/contato` — páginas estáticas editáveis
- Header: logo, busca real-time, wishlist, carrinho, menu mobile drawer
- Sidebar filtros: categorias, tamanho, preço (slider), marca, cor, tags, em estoque
- Carrinho drawer: cupom input, breakdown desconto, CEP/frete, CTA WhatsApp formatado

## 🔐 LAYER 3 — Painel do dono: `/painel/*`

- `/painel` — dashboard com checklist onboarding, stats, mais vistos/wishlistados
- `/painel/produtos` — tabela com **bulk actions** (preço, categoria, tag, ativar/desativar/excluir) + barra flutuante
- `/painel/produtos/$id` — form completo: rich text, mídia drag-drop, vídeos depoimento, matriz de estoque cor×tamanho, SEO, badges
- `/painel/categorias` — tree view drag-drop
- `/painel/banners` — desktop+mobile separados, preview
- `/painel/descontos` — 4 tabs: Cupons, Promoções, Combos, Pop-up boas-vindas
- `/painel/reviews` — moderar (aprovar/rejeitar)
- `/painel/paginas` — editar sobre/políticas/contato
- `/painel/configuracoes` — geral, WhatsApp, redes, frete, badges, SEO, cor de destaque
- `/painel/plano` — plano atual, uso, upgrade/downgrade (Stripe Customer Portal), histórico

## 💳 Pagamentos Stripe

- `enable_stripe_payments` (Lovable built-in)
- Criar 3 produtos/preços (Básico/Profissional/Premium mensais)
- Server route `/api/stripe/checkout` — cria Checkout Session
- Server route `/api/stripe/webhook` — escuta `checkout.session.completed`, `customer.subscription.updated/deleted`, atualiza `stores.subscription_status`
- Server route `/api/stripe/portal` — abre Customer Portal
- Guard: `/painel/*` exige assinatura ativa (senão redireciona para `/painel/plano`)

## 🛠️ Stack adicional necessário

- React Hook Form + Zod (forms)
- DnD kit (drag-drop reorder)
- Tiptap ou similar (rich text editor)
- Loja: Zustand para wishlist + cart isolados por `storeSlug`

## 📋 Ordem de execução

1. Migration: wipe + novo schema multi-tenant + RLS + planos seed
2. Habilitar Stripe + criar produtos/preços + server routes (checkout/webhook/portal)
3. Landing + signup wizard + login/reset (rotas raiz)
4. Refatorar storefront atual para `/loja/$slug/*` com `store_id` em todas queries
5. Refatorar admin atual para `/painel/*` escopado por loja
6. Adicionar features novas: wishlist, popup, share, cupom no carrinho, CEP/frete
7. Página produto avançada: vídeos depoimento, reviews, notify-stock, badges trust
8. Promoções engine: cupons + promoções categoria + combos + aplicação no carrinho
9. Bulk actions de produtos + reviews moderação + páginas estáticas
10. Polimento: animações, mobile, SEO meta tags por rota

Após aprovar, vou começar com a migration (passo 1) e Stripe (passo 2). Se Stripe travar por falta de plano Pro, eu aviso e seguimos com mock UI no checkout.
