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
