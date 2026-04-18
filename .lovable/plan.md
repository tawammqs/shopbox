
# Plano: E-commerce com Checkout via WhatsApp

Loja completa em pt-BR com vitrine pública e painel admin protegido. Estilo premium (branco, charcoal #1a1a1a, verde esmeralda #1a6b4a), Playfair Display + DM Sans.

## 🗄️ Backend (Lovable Cloud / Supabase)

**Tabelas:**
- `categories` — id, name, slug, parent_id (subcategorias), image_url, display_order
- `products` — id, title, brand, description, sku, price, promo_price, promo_starts_at, promo_ends_at, category_id, subcategory_id, tags[], active, created_at
- `product_images` — id, product_id, url, position
- `product_colors` — id, product_id, name, hex
- `product_sizes` — id, product_id, label
- `product_stock` — product_id, color_id, size_id, quantity (matriz cor × tamanho)
- `banners` — id, title, subtitle, button_label, button_link, desktop_url, mobile_url, display_order, active
- `store_settings` — singleton: name, logo_url, whatsapp, instagram, facebook, tiktok, youtube
- `user_roles` — gerenciamento de admin (tabela separada com enum + função `has_role`)

**Storage:** buckets públicos `products`, `categories`, `banners`, `logo`

**Auth:** admin único pré-criado via seed. Sem signup público. Rotas `/admin/*` protegidas via guard.

**Seed:** ~10 produtos de exemplo, categorias Meninos/Meninas/Bebê com subcategorias, 1 banner, 1 admin.

## 🛍️ Vitrine Pública

**Layout global:**
- Header sticky: logo · busca em tempo real (dropdown com thumb + nome + preço) · ícone carrinho com badge animado
- Mobile: busca colapsável, menu hamburger em drawer full-screen
- Menu de categorias com submenu (hover desktop / expand mobile)
- Footer com logo, redes sociais, links rápidos

**Páginas:**
- `/` — Hero carousel (banners desktop/mobile separados, auto-slide), seções por tag (Destaques, Lançamentos, Ofertas, Principal), grid de categorias
- `/categoria/$slug` e `/categoria/$slug/$sub` — sidebar de filtros (categoria, tamanho, preço com slider, marca, cor swatches, tags), barra de ordenação, grid responsivo (2/3/4 cols), chips de filtros ativos, "Ver mais"
- `/produto/$slug` — galeria com zoom, breadcrumb, seletor de cor (swatches), seletor de tamanho (combinações sem estoque acinzentadas), indicador de estoque, qty, "Adicionar ao Carrinho", "Comprar agora pelo WhatsApp", relacionados
- Carrinho — drawer lateral, persistido em localStorage, CTA "Finalizar pelo WhatsApp" abre `wa.me/<numero>` com mensagem formatada (itens, cor, tamanho, qtd, total)

**Comportamentos:**
- Filtros refletidos na URL (search params) — compartilháveis
- Busca cobre nome, descrição, marca, categoria
- Preço promocional: original riscado + badge de % de desconto
- Lazy-load de imagens, animações sutis (hover lift, fade, drawer)

## 🔐 Painel Admin (`/admin`)

- Login email + senha
- Dashboard: cards de resumo (produtos, categorias, alertas de estoque baixo, banners ativos)
- **Produtos** — CRUD completo, upload de imagem principal + galeria (até 6, drag-reorder), variações de cor (nome + color picker hex), tamanhos (texto livre), matriz visual de estoque cor × tamanho
- **Categorias** — CRUD, subcategorias, imagem, slug auto, drag-reorder
- **Banners** — upload separado desktop/mobile, preview, ordem, on/off
- **Configurações** — nome da loja, logo, WhatsApp, URLs de redes sociais

## 🎨 Design

- Tailwind tokens semânticos (esmeralda como `--accent`)
- Playfair Display (headings) + DM Sans (body) via Google Fonts
- Mobile-first, tap targets ≥44px, drawers no mobile
- Microanimações: card hover lift, drawer slide, fade do banner, reveal escalonado do grid

## ⚠️ Observação importante

WhatsApp Web tem limite prático de ~2000 caracteres na URL `wa.me`. Para carrinhos grandes, vou truncar a mensagem com aviso "...e mais X itens" se ultrapassar — o atendente verá o pedido completo se você também quiser que eu salve o pedido no banco antes de abrir o WhatsApp (posso adicionar isso depois se quiser histórico de pedidos).

Após aprovação, vou pedir o **email do admin** para criar a conta inicial.
