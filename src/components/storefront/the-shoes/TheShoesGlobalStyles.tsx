/**
 * Global design system for The Shoes storefront.
 * Scoped via [data-theme="mio"] so it never leaks to other stores.
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
[data-theme="mio"],
[data-theme="mio"] * {
  font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif !important;
}

/* ===== Page background & content width ===== */
[data-theme="mio"] {
  background: #ffffff;
}
[data-theme="mio"] main {
  background: #ffffff;
}

/* Cart drawer font enforcement */
[data-theme="mio"] .ts-cart,
[data-theme="mio"] .ts-cart *,
[data-theme="mio"] .cart-drawer,
[data-theme="mio"] [class*="cart-drawer"],
[data-theme="mio"] [class*="cart-slide"] {
  font-family: 'DM Sans', 'Helvetica Neue', sans-serif !important;
}

/* ===== Product cards (target common storefront card classes) ===== */
[data-theme="mio"] .product-card,
[data-theme="mio"] [class*="product-card"],
[data-theme="mio"] [data-product-card] {
  border-radius: 12px !important;
  overflow: hidden !important;
  border: 1px solid #f0f0f0 !important;
  background: #ffffff !important;
}
[data-theme="mio"] .product-card img,
[data-theme="mio"] [class*="product-card"] img,
[data-theme="mio"] [data-product-card] img {
  border-radius: 0 !important;
  aspect-ratio: 4 / 5 !important;
  object-fit: cover !important;
  width: 100% !important;
}

/* Product grid card from ProductCard.tsx uses rounded-xl on inner image wrapper */
[data-theme="mio"] a.group .aspect-square,
[data-theme="mio"] a.group [class*="aspect-"] {
  aspect-ratio: 4 / 5 !important;
  border-radius: 12px 12px 0 0 !important;
  overflow: hidden;
}

/* ===== Headings ===== */
[data-theme="mio"] h1 {
  font-weight: 900;
  letter-spacing: -1px;
  color: #111;
}
[data-theme="mio"] h2,
[data-theme="mio"] h3 {
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
}

/* ===== Links ===== */
[data-theme="mio"] a {
  color: #111;
  text-decoration: none;
  transition: opacity 0.15s ease;
}
[data-theme="mio"] a:hover {
  opacity: 0.7;
}

/* ===== Buttons (general) ===== */
[data-theme="mio"] button {
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif !important;
}

/* ===== Form inputs ===== */
[data-theme="mio"] input:not([type="checkbox"]):not([type="radio"]),
[data-theme="mio"] textarea,
[data-theme="mio"] select {
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px !important;
  font-family: 'DM Sans', sans-serif !important;
  font-size: 15px !important;
  color: #111 !important;
  background: #ffffff !important;
}
[data-theme="mio"] input:not([type="checkbox"]):not([type="radio"]):focus,
[data-theme="mio"] textarea:focus,
[data-theme="mio"] select:focus {
  border-color: #111 !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.06) !important;
}
[data-theme="mio"] input::placeholder,
[data-theme="mio"] textarea::placeholder {
  color: #aaa !important;
}
[data-theme="mio"] label {
  font-family: 'DM Sans', sans-serif !important;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

/* ===== Breadcrumb (.breadcrumb container) ===== */
[data-theme="mio"] .breadcrumb,
[data-theme="mio"] nav[aria-label="breadcrumb"] {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 24px;
}
[data-theme="mio"] .breadcrumb a,
[data-theme="mio"] nav[aria-label="breadcrumb"] a {
  color: #aaa;
}

/* ===== Scrollbars ===== */
[data-theme="mio"] ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
[data-theme="mio"] ::-webkit-scrollbar-track {
  background: #f5f5f5;
}
[data-theme="mio"] ::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}
[data-theme="mio"] ::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* ===== WhatsApp green CTA accent ===== */
[data-theme="mio"] .bg-\\[\\#25d366\\],
[data-theme="mio"] .bg-\\[\\#25D366\\] {
  background-color: #25D366 !important;
}

/* ===== Page content wrapper ===== */
[data-theme="mio"] main > div,
[data-theme="mio"] main > section {
  font-family: 'DM Sans', sans-serif;
}
`;
