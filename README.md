# Shopbox

Build a complete professional e-commerce platform with two distinct areas:

a public storefront and a private admin panel.

The experience should feel exactly like a real e-commerce store (NuvemShop / Shopify quality),

but the checkout is finalized via WhatsApp.

---

## 🛍️ PUBLIC STOREFRONT

### Header (Sticky, fully responsive)

- Left: Store logo (uploaded via admin panel — fallback to store name as text)

- Center: Search bar — real-time search across product names, descriptions, and categories.

  Show a dropdown with instant results (product image thumbnail + name + price) as the user types.

  Pressing Enter or clicking a result navigates to the product or filtered listing page.

- Right: Cart icon with animated item count badge

- Below header on mobile: collapsible search bar (icon toggles it open)

### Navigation Menu

- Horizontal menu on desktop with top-level categories

- Hamburger menu on mobile opening a full-screen slide-in drawer

- Categories display subcategories on hover (desktop) or expand on tap (mobile)

### Sidebar Filter (on category/listing pages)

- Fixed left sidebar on desktop, collapsible drawer on mobile (triggered by "Filtrar" button)

- Filter options:

  - Categories (top-level with subcategory expand)

  - Size (checkboxes — e.g., PP, P, M, G, GG or numeric sizes like 1, 2, 4, 6, 8...)

  - Price range (dual-handle slider with min/max inputs)

  - Brand/Marca (checkboxes, dynamically populated from products)

  - Color (visual color swatches as checkboxes)

  - Tags: Destaques, Lançamentos, Ofertas

- "Limpar filtros" button to reset all

- Filters apply instantly (no page reload)

- Active filter chips shown above the product grid so users can remove individual filters

### Homepage

- Hero section: full-width responsive banner carousel (separate images for desktop and mobile,

  editable in admin). Smooth auto-slide with dot navigation and pause on hover.

- Product sections by tag:

  - "Destaques" — horizontal scrollable row on mobile, grid on desktop

  - "Lançamentos" — same layout

  - "Ofertas" — same layout, show original price crossed out + discount badge

  - "Principal" — featured section with larger cards

- Category grid: visual tiles with category image and name

### Category / Listing Pages

- URL structure: /categoria/[slug] and /categoria/[slug]/[subcategoria]

- Page title showing current category/subcategory name and product count

- Sort bar (top-right): options — Mais Relevantes, Menor Preço, Maior Preço, Mais Novo, Ofertas

- Left sidebar with all filters (described above)

- Responsive product grid (2 columns mobile, 3-4 desktop)

- Infinite scroll or "Ver mais" pagination

- When entering a category (e.g., "Meninos"), show ALL products from that category

  AND all its subcategories combined, with filters to narrow down

### Product Cards

- Product image (hover shows second image if available)

- Product name

- Brand/Marca

- Price (and promotional price if set, with % discount badge)

- Color swatches preview (up to 4, then "+N more")

- Quick-add to cart button on hover

### Product Detail Page

- Breadcrumb navigation (Home > Category > Subcategory > Product)

- Image gallery: main image + thumbnail strip, with zoom on hover/tap

- Product title, brand, SKU

- Price block: promotional price + original crossed out + savings badge

- Color selector: visual swatches (show available colors, gray out unavailable)

- Size selector: button grid — gray out sizes unavailable for selected color

- Stock indicator: "Em estoque", "Últimas unidades" (≤5), "Esgotado"

- Quantity selector

- "Adicionar ao Carrinho" button (disabled if out of stock)

- "Comprar agora pelo WhatsApp" secondary button (bypasses cart, opens WhatsApp directly)

- Full product description (expandable)

- Related products section at bottom

### Shopping Cart (slide-in drawer from right)

- Item list: image, name, selected color + size, quantity stepper, unit price, remove button

- Subtotal

- Shipping note: "Frete combinado via WhatsApp"

- CTA button: "Finalizar Compra pelo WhatsApp" — opens wa.me link with pre-filled message:

  "Olá! Gostaria de finalizar meu pedido: 😊

  🛒 *Meu Pedido:*

  • [Nome do Produto] - Cor: [Cor] - Tamanho: [Tam] - Qtd: [N] - R$ [preço]

  • [...]

  💰 *Total: R$ [valor total]*

  Aguardo o retorno para confirmar pagamento e entrega! 🙏"

- Cart persists in localStorage across sessions

- Empty cart state with illustration and "Ver Produtos" CTA

### Footer

- Store logo

- Social media icons linking to: Instagram, Facebook, TikTok, YouTube, WhatsApp

  (all URLs configured in admin)

- Quick links: categories, policies

- Copyright

---

## 🔐 ADMIN PANEL (/admin — login protected)

### Authentication

- Clean login page with email + password

- Protected routes with redirect

- Supabase Auth

### Dashboard

- Summary cards: total products, total categories, low stock alerts, active banners

- Quick access links to main sections

### Product Management

- Full CRUD for products

- Fields:

  - Title, Brand/Marca, Description (rich text), SKU

  - Price, Promotional price (with date range optional)

  - Category + Subcategory (dropdown)

  - Tags (multi-select): Destaques, Lançamentos, Ofertas, Principal

  - Active / Inactive toggle

- Image management:

  - Main image upload

  - Gallery images (up to 6, drag to reorder)

  - Images stored in Supabase Storage

- Variations:

  - Add colors: color name + hex color picker

  - Add sizes: text input (supports both letter sizes PP/P/M/G/GG and numeric 1/2/4/6/8...)

  - Stock grid: for each color × size combination, set stock quantity

  - Visual matrix table for easy stock management

### Category Management

- Create / Edit / Delete categories and subcategories

- Category image upload (used in homepage category grid)

- Slug auto-generated from name (editable)

- Drag-and-drop reorder

### Banner Management

- Upload desktop banner (recommended 1920×600px) and mobile banner (recommended 800×1000px) separately

- Fields: title, subtitle, button label, button link, display order

- Enable / disable toggle

- Live preview of how it looks

### Store Settings

- Store name

- Logo upload (shown in header and footer)

- WhatsApp number (used in all checkout links)

- Social media URLs: Instagram, Facebook, TikTok, YouTube, WhatsApp

- Custom domain (informational field)

---

## 🎨 DESIGN DIRECTION

- Style: Clean, modern, premium — like a well-designed Brazilian kids/fashion e-commerce

- Color palette: White base (#ffffff), dark charcoal (#1a1a1a), accent color deep emerald (#1a6b4a)

  — use accent for CTAs, badges, hover states, and active filters

- Typography: Playfair Display for headings, DM Sans for body and UI elements

- Micro-animations: smooth cart drawer, product card hover lifts, filter transition,

  banner fade, staggered product grid reveal on load

- Mobile-first: all pages touch-optimized, sidebar becomes bottom drawer on mobile,

  tap targets minimum 44px

---

## 🗄️ TECH STACK

- React + TypeScript

- Tailwind CSS

- Supabase (Auth + Database + Storage)

- Zustand for cart state (persisted to localStorage)

- React Query for data fetching

---

## ✅ KEY BEHAVIORS

- Search: works across product name, description, brand, category — shows results in real time

- Filters: all client-side for instant feedback, URL params updated for shareable filtered URLs

- Out-of-stock combinations: grayed out and unselectable

- Promotional prices: always show original crossed out with % saved badge

- WhatsApp number must be configurable in admin — no hardcoded values

- All storefront content (banners, products, categories, social links, logo) must be

  editable exclusively through the admin panel

- Lazy-load all product images for performance

- SEO-friendly URLs: /categoria/meninos, /produto/nome-do-produto

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shopbox.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d9db69c-12ec-4819-b6e4-e5cc6a15c463).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
