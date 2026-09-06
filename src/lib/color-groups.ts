import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ColorGroup = {
  store_id: string;
  brand: string | null;
  model_name: string;
  product_ids: string[];
  product_slugs: string[];
  colors: string[];
  first_images: string[];
  variant_count: number;
};

export function extractModelAndColor(productName: string): { model: string; color: string | null } {
  const norm = productName.replace(/\s+/g, " ");
  const m = norm.match(/^(.*?)\s*(?:\||\s-\s)\s*(.+)$/);
  if (!m) return { model: norm, color: null };
  return { model: m[1].trim(), color: m[2].trim() };
}

export const COLOR_MAP: Record<string, string> = {
  // Brancos e neutros
  branco: "#ffffff",
  white: "#ffffff",
  "off white": "#faf9f6",
  "off-white": "#faf9f6",
  creme: "#fffdd0",
  bege: "#d4b896",
  nude: "#e8c9a0",
  areia: "#c2b280",
  cru: "#f5f0e8",
  // Pretos e cinzas
  preto: "#1a1a1a",
  black: "#1a1a1a",
  cinza: "#9ca3af",
  gray: "#9ca3af",
  "cinza claro": "#d1d5db",
  "cinza escuro": "#4b5563",
  chumbo: "#374151",
  // Marrons
  marrom: "#795548",
  brown: "#795548",
  café: "#6f4e37",
  cafe: "#6f4e37",
  caramelo: "#c68642",
  chocolate: "#3d1c02",
  "dark coffee": "#2c1810",
  coffee: "#6f4e37",
  terra: "#8b4513",
  tabaco: "#9b7653",
  // Rosas e vermelhos
  rose: "#f9a8d4",
  rosa: "#f9a8d4",
  pink: "#ec4899",
  vermelho: "#ef4444",
  vinho: "#722f37",
  bordô: "#800020",
  bordo: "#800020",
  coral: "#ff6b6b",
  salmão: "#fa8072",
  salmao: "#fa8072",
  // Azuis
  azul: "#3b82f6",
  blue: "#3b82f6",
  "azul marinho": "#1e3a5f",
  navy: "#1e3a5f",
  "azul royal": "#4169e1",
  "azul claro": "#93c5fd",
  "azul celeste": "#87ceeb",
  celeste: "#87ceeb",
  índigo: "#4f46e5",
  indigo: "#4f46e5",
  // Verdes
  verde: "#22c55e",
  green: "#22c55e",
  "verde militar": "#4a5240",
  "verde oliva": "#708238",
  menta: "#98ff98",
  sage: "#87ae73",
  // Outros
  amarelo: "#eab308",
  laranja: "#f97316",
  roxo: "#a855f7",
  lilás: "#c8a2c8",
  lilas: "#c8a2c8",
  prata: "#c0c0c0",
  silver: "#c0c0c0",
  dourado: "#ffd700",
  gold: "#ffd700",
  tiffany: "#81d8d0",
};

export function getColorHex(colorName: string): string {
  const normalized = (colorName ?? "").toLowerCase().trim();
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];
  const firstColor = normalized.split(/[\/&,]/)[0].trim();
  if (COLOR_MAP[firstColor]) return COLOR_MAP[firstColor];
  return "#e5e7eb";
}

export function isLightSwatch(hex: string) {
  return ["#ffffff", "#faf9f6", "#fffdd0", "#f5f0e8"].includes(hex.toLowerCase());
}

/**
 * Extrai 1 ou 2 cores hex a partir do nome (ex.: "NK V2K Run - Off White & Rose" → ["#faf9f6", "#f9a8d4"]).
 * Aceita a parte de cor já isolada ("Off White & Rose") ou o nome completo do produto.
 * Suporta separadores " - ", "│", "|" e cores compostas com "&", "/" ou "e".
 */
export function parseColorsFromName(name: string): string[] {
  const norm = (name ?? "").replace(/[│|]/g, " - ").replace(/\s+/g, " ").trim();
  const parts = norm.split(/\s-\s/);
  const colorPart = (parts.length >= 2 ? parts[parts.length - 1] : norm).toLowerCase();

  const colorNames = colorPart
    .split(/\s*(?:&|\/)\s*|\s+e\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const hexes = colorNames
    .map((n) => {
      if (COLOR_MAP[n]) return COLOR_MAP[n];
      const found = Object.entries(COLOR_MAP).find(([key]) => n.includes(key) || key.includes(n));
      return found ? found[1] : null;
    })
    .filter((c): c is string => !!c);

  if (hexes.length === 0) return [getColorHex(colorPart)];
  return hexes.slice(0, 2);
}

export async function fetchColorGroups(storeId: string): Promise<ColorGroup[]> {
  const { data, error } = await supabase
    .from("product_color_groups" as any)
    .select("*")
    .eq("store_id", storeId);
  if (error) return [];
  return (data ?? []) as unknown as ColorGroup[];
}

export type ColorGroupMap = Record<string, ColorGroup>;

export function buildGroupMap(groups: ColorGroup[]): ColorGroupMap {
  const map: ColorGroupMap = {};
  for (const g of groups) {
    for (const id of g.product_ids ?? []) map[id] = g;
  }
  return map;
}

/** Keeps only the first product of each color group (1 card per model). */
export function dedupeByGroup<T extends { id: string }>(products: T[], map: ColorGroupMap): T[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const g = map[p.id];
    if (!g) return true;
    const key = `${g.store_id}_${g.brand ?? ""}_${g.model_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useColorGroups(storeId: string | undefined) {
  const q = useQuery({
    queryKey: ["color-groups", storeId],
    queryFn: () => fetchColorGroups(storeId as string),
    enabled: !!storeId,
    staleTime: 300_000,
  });
  const groups = q.data ?? [];
  return { groups, map: buildGroupMap(groups) };
}
