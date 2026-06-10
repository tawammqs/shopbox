
# The Shoes — refinements (slug `the-shoes` only)

All changes are scoped to the-shoes storefront. No other store, no admin, no checkout logic changes.

---

## 1. Mobile coupon tab → pulsing gift icon

File: `src/components/storefront/the-shoes/TheShoesCouponTab.tsx`

- Desktop (≥768px): keep the existing vertical "5% NA PRIMEIRA COMPRA" left-side tab.
- Mobile (<768px): replace the tab with a floating circular button anchored bottom-left (above WhatsApp button if present, otherwise bottom: 24px, left: 24px).
  - 56×56 circle, bg `#111`, white gift icon (lucide `Gift`, 26px).
  - Continuous pulse animation: outer ring scale 1→1.6 opacity 0.6→0, 1.6s infinite (same vibe as WhatsApp float).
  - Inner icon: subtle scale 1→1.05 pulse 1s infinite.
  - onClick opens the same coupon modal (STATE 1 or STATE 2 depending on saved coupon).
- Keep modal unchanged.

---

## 2. Ofertas Secretas grid background color

File: `src/components/storefront/the-shoes/TheShoesHomepage.tsx` (and `TheShoesExtras.tsx` if duplicated)

- In the inline "Ofertas Secretas" card, change the 4-up product/grid background from current pattern/color to solid `#f3f3f3`.
- Card container stays `#dfdac8`; only the inner grid tile background becomes `#f3f3f3`.

---

## 3. Cart drawer fixes

File: `src/components/storefront/the-shoes/TheShoesCartDrawer.tsx`

- Suggested products ("você também pode gostar") section: change red accents (price, badges, buttons) to `#111` / black. Keep layout.
- Free-shipping progress bar:
  - Threshold: `R$ 599,99`.
  - Compute subtotal from `useCart` items (`sum(unitPrice * quantity)`).
  - Progress = `min(subtotal / 599.99, 1) * 100%`.
  - While `subtotal < 599.99`: show "Faltam **R$ X,XX** para o frete grátis" with truck icon moving along progress.
  - When `subtotal ≥ 599.99`: show "🎉 Você ganhou FRETE GRÁTIS!" and full bar.
  - Bar fill color `#111`, track `#eee`.

---

## 4. Product page redesign (the-shoes only)

File: `src/routes/loja.$slug.produto.$productSlug.tsx`

Currently this route renders one generic layout for all stores. Refactor: when `store.slug === 'the-shoes'`, render a new dedicated component `TheShoesProductPage` (new file `src/components/storefront/the-shoes/TheShoesProductPage.tsx`). Other stores keep current layout untouched.

### Typography & design
- DM Sans throughout (already injected via `TheShoesGlobalStyles`).
- Headings 800/900, letter-spacing -0.5px, color `#111`. Matches existing the-shoes design system.

### Layout (desktop 2-col, mobile stack)
1. Breadcrumb (13px #aaa).
2. Gallery (left) + Info column (right): title, price block, color swatches, size pills, qty + Add to cart (#111 button) + Buy on WhatsApp (#25D366).
3. **Info accordion** (matches attached image-14): below info or full-width below gallery on mobile.
   - Items, each with small lucide icon + uppercase label + `+` toggle:
     - DESCRIÇÃO (uses `product.description`)
     - GUIA DE TAMANHOS (static placeholder text editable later)
     - GARANTIA E DEVOLUÇÃO (static text)
     - CONDIÇÕES DE ENVIO (static text)
     - MÉTODOS DE PAGAMENTO (static text)
   - Styling: 1px solid #e5e5e5 dividers, 48px row height, DM Sans 14px 700.
4. **"Descubra cada detalhe em vídeo"** circular-thumb carousel (above accordion, matching image-14 top):
   - Title DM Sans 18px 800 #111, mb 16.
   - Horizontal scroll row of 64px circular video thumbnails (cover image of each `product_video_testimonials`).
   - Click opens a full-screen vertical video modal (9:16) with prev/next.
5. **Product video carousel** (NEW separate section): below info section, full-width.
   - Title "Veja em vídeo" DM Sans 22px 800.
   - Horizontal carousel of product videos (from `product_video_testimonials`, kind=youtube|upload) — 9:16 cards, snap scroll, arrow buttons on desktop.
   - Reuse existing data; no new admin/schema work.
6. **Related products** row (existing `ProductRow` with the-shoes card styling).
7. **Reviews + Questions tabs section** (matches attached image-15):
   - Tabs: "Avaliações" | "Perguntas" (Perguntas is empty-state for now).
   - Header block: big rating number (e.g. `4.9`) DM Sans 48px 800, gold stars, `baseado em N avaliações`.
   - Title "Avaliações do produto" 40px 900 centered.
   - Left dark pill button "Faça uma avaliação" (opens existing review submit flow if available, otherwise no-op placeholder).
   - Right "Mais relevantes ▾" sort dropdown (sort by rating desc / date desc — client-side only).
   - 3-column responsive grid of review cards (1 col mobile, 2 col tablet, 3 col desktop):
     - Gold stars row, text 14px #111, customer name + "X dias" #999 12px.
     - "👍 Recomendo este produto" pill `#eef6ff` text `#1d6bd6`.
     - "✅ Compra verificada" pill `#eafaf0` text `#1aa055`.
     - Optional customer photo thumbnail (uses existing review data; skip if absent).

### Other stores
- The current `ProductInner` component remains the default fallback. Only `the-shoes` gets the new component. No data model changes.

---

## Files touched

- edit `src/components/storefront/the-shoes/TheShoesCouponTab.tsx`
- edit `src/components/storefront/the-shoes/TheShoesHomepage.tsx`
- edit `src/components/storefront/the-shoes/TheShoesCartDrawer.tsx`
- edit `src/routes/loja.$slug.produto.$productSlug.tsx` (slug branch only)
- new `src/components/storefront/the-shoes/TheShoesProductPage.tsx`

No DB migrations, no admin changes, no other store affected.
