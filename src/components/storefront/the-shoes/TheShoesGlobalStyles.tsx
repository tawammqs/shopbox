/**
 * Global design system for The Shoes storefront.
 * Scoped via [data-store-slug="the-shoes"] so it never leaks to other stores.
 * Injected once at the layout level (loja.$slug.tsx) when slug === "the-shoes".
 */
export function TheShoesGlobalStyles() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap"
      />
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
/* ===== Typography ===== */
[data-store-slug="the-shoes"],
[data-store-slug="the-shoes"] * {
  font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif !important;
}

/* ===== Page background & content width ===== */
[data-store-slug="the-shoes"] {
  background: #ffffff;
}
[data-store-slug="the-shoes"] main {
  background: #ffffff;
}

/* Cart drawer font enforcement */
[data-store-slug="the-shoes"] .ts-cart,
[data-store-slug="the-shoes"] .ts-cart *,
[data-store-slug="the-shoes"] .cart-drawer,
[data-store-slug="the-shoes"] [class*="cart-drawer"],
[data-store-slug="the-shoes"] [class*="cart-slide"] {
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif !important;
}

/* ===== Product cards (target common storefront card classes) ===== */
[data-store-slug="the-shoes"] .product-card,
[data-store-slug="the-shoes"] [class*="product-card"],
[data-store-slug="the-shoes"] [data-product-card] {
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid #f0f0f0 !important;
  background: #ffffff !important;
}
[data-store-slug="the-shoes"] .product-card img,
[data-store-slug="the-shoes"] [class*="product-card"] img,
[data-store-slug="the-shoes"] [data-product-card] img {
  border-radius: 0 !important;
  aspect-ratio: 4 / 5 !important;
  object-fit: cover !important;
  width: 100% !important;
}

/* Product grid card from ProductCard.tsx uses rounded-xl on inner image wrapper */
[data-store-slug="the-shoes"] a.group .aspect-square,
[data-store-slug="the-shoes"] a.group [class*="aspect-"] {
  aspect-ratio: 4 / 5 !important;
  border-radius: 12px 12px 0 0 !important;
  overflow: hidden;
}

/* ===== Headings ===== */
[data-store-slug="the-shoes"] h1 {
  font-weight: 900;
  letter-spacing: -1px;
  color: #111;
}
[data-store-slug="the-shoes"] h2,
[data-store-slug="the-shoes"] h3 {
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
}

/* ===== Links ===== */
[data-store-slug="the-shoes"] a {
  color: #111;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
[data-store-slug="the-shoes"] a:hover {
  opacity: 0.7;
}

/* ===== Buttons (general) ===== */
[data-store-slug="the-shoes"] button {
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif !important;
}

/* ===== Form inputs ===== */
[data-store-slug="the-shoes"] input:not([type="checkbox"]):not([type="radio"]),
[data-store-slug="the-shoes"] textarea,
[data-store-slug="the-shoes"] select {
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 15px !important;
  color: #111 !important;
  background: #ffffff !important;
}
[data-store-slug="the-shoes"] input:not([type="checkbox"]):not([type="radio"]):focus,
[data-store-slug="the-shoes"] textarea:focus,
[data-store-slug="the-shoes"] select:focus {
  border-color: #111 !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.06) !important;
}
[data-store-slug="the-shoes"] input::placeholder,
[data-store-slug="the-shoes"] textarea::placeholder {
  color: #aaa !important;
}
[data-store-slug="the-shoes"] label {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

/* ===== Breadcrumb (.breadcrumb container) ===== */
[data-store-slug="the-shoes"] .breadcrumb,
[data-store-slug="the-shoes"] nav[aria-label="breadcrumb"] {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 24px;
}
[data-store-slug="the-shoes"] .breadcrumb a,
[data-store-slug="the-shoes"] nav[aria-label="breadcrumb"] a {
  color: #aaa;
}

/* ===== Scrollbars ===== */
[data-store-slug="the-shoes"] ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
[data-store-slug="the-shoes"] ::-webkit-scrollbar-track {
  background: #f5f5f5;
}
[data-store-slug="the-shoes"] ::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}
[data-store-slug="the-shoes"] ::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* ===== WhatsApp green CTA accent ===== */
[data-store-slug="the-shoes"] .bg-\\[\\#25d366\\],
[data-store-slug="the-shoes"] .bg-\\[\\#25D366\\] {
  background-color: #25D366 !important;
}

/* ===== Page content wrapper ===== */
[data-store-slug="the-shoes"] main > div,
[data-store-slug="the-shoes"] main > section {
  font-family: 'DM Sans', sans-serif;
}
`;
