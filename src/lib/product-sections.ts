export type ProductSectionKey = "destaque" | "lancamento" | "mais_vendido" | "promocao";
export type ProductListFilterKey = "todos" | ProductSectionKey | "marca";

export const PRODUCT_SECTION_ITEMS: { key: ProductSectionKey; label: string }[] = [
  { key: "destaque", label: "⭐ Destaque" },
  { key: "lancamento", label: "🆕 Lançamento" },
  { key: "mais_vendido", label: "🔥 Mais vendido" },
  { key: "promocao", label: "🎯 Promoção" },
];

export const PRODUCT_LIST_FILTERS: { key: ProductListFilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  ...PRODUCT_SECTION_ITEMS.filter((item) => item.key !== "promocao"),
  { key: "marca", label: "🏷️ Marca" },
  PRODUCT_SECTION_ITEMS.find((item) => item.key === "promocao")!,
];

export const PRODUCT_SECTION_ALIASES: Record<ProductSectionKey, string[]> = {
  destaque: ["destaque", "destaques", "featured"],
  lancamento: ["lancamento", "lançamento", "lancamentos", "lançamentos", "new", "novos"],
  mais_vendido: ["mais_vendido", "mais_vendidos", "mais vendido", "mais vendidos", "best_seller"],
  promocao: ["promocao", "promoção", "oferta", "ofertas", "sale"],
};

function norm(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function values(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.map(norm).filter(Boolean) : [];
}

export function hasProductSection(raw: unknown, key: ProductSectionKey): boolean {
  const set = new Set(values(raw));
  return PRODUCT_SECTION_ALIASES[key].some((alias) => set.has(norm(alias)));
}

export function toggleProductSection(raw: unknown, key: ProductSectionKey, checked?: boolean): string[] {
  const current = Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
  const aliases = new Set(PRODUCT_SECTION_ALIASES[key].map(norm));
  const nextChecked = checked ?? !hasProductSection(current, key);
  const cleaned = current.filter((item) => !aliases.has(norm(item)));
  return nextChecked ? [...cleaned, key] : cleaned;
}

export function normalizeProductSections(raw: unknown): string[] {
  const current = Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
  const aliasEntries = Object.entries(PRODUCT_SECTION_ALIASES).flatMap(([key, aliases]) =>
    aliases.map((alias) => [norm(alias), key] as const),
  );
  const canonicalByAlias = new Map(aliasEntries);
  const normalized = current
    .map((item) => canonicalByAlias.get(norm(item)) ?? item)
    .filter((item, index, list) => list.findIndex((x) => norm(x) === norm(item)) === index);
  for (const key of PRODUCT_SECTION_ITEMS.map((item) => item.key)) {
    if (hasProductSection(current, key) && !hasProductSection(normalized, key)) normalized.push(key);
  }
  return normalized;
}

export function productHasBrand(product: any): boolean {
  return !!String(product?.brand_name ?? product?.brand ?? "").trim();
}

export function productIsInSection(product: any, key: ProductSectionKey): boolean {
  // STRICT: only featured_sections (the admin checkbox) is the source of truth.
  // Legacy tag values were migrated into featured_sections via a one-time backfill.
  return hasProductSection(product?.featured_sections, key);
}

export function productMatchesListFilter(product: any, filter: ProductListFilterKey): boolean {
  if (filter === "todos") return true;
  if (filter === "marca") return productHasBrand(product);
  return productIsInSection(product, filter);
}