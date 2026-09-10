export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const slugify = (text: string) =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const discountPct = (price: number, promo: number | null | undefined) => {
  if (!promo || promo >= price) return 0;
  return Math.round(((price - promo) / price) * 100);
};

export const effectivePrice = (price: number, promo: number | null | undefined) =>
  promo && promo < price ? promo : price;

/**
 * Preço riscado ("De") + percentual de desconto.
 * Usa original_price quando o produto tiver, senão o preço cheio.
 */
export const comparePrice = (
  product: { price: number; original_price?: number | null },
  current: number,
) => {
  const orig = product.original_price != null ? Number(product.original_price) : null;
  const base = Number(product.price);
  const struck = orig && orig > current ? orig : base > current ? base : null;
  return { struck, pct: struck ? Math.round(((struck - current) / struck) * 100) : 0 };
};
