import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  preto: "#1a1a1a",
  branco: "#ffffff",
  cinza: "#9ca3af",
  "cinza claro": "#d1d5db",
  "cinza escuro": "#4b5563",
  bege: "#d4b896",
  creme: "#fffdd0",
  marrom: "#795548",
  caramelo: "#c68642",
  azul: "#3b82f6",
  "azul marinho": "#1e3a5f",
  "azul royal": "#4169e1",
  "azul celeste": "#87ceeb",
  verde: "#22c55e",
  "verde militar": "#4a5240",
  "verde oliva": "#708238",
  vermelho: "#ef4444",
  laranja: "#f97316",
  amarelo: "#eab308",
  rosa: "#ec4899",
  roxo: "#a855f7",
  vinho: "#722f37",
  "bordô": "#800020",
  bordo: "#800020",
  "off white": "#faf9f6",
  cru: "#f5f0e8",
  prata: "#c0c0c0",
  dourado: "#ffd700",
  nude: "#e8c9a0",
  coral: "#ff6b6b",
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

// ---- Dominant color extracted from the product image (cached in memory) ----
const dominantCache = new Map<string, string>();

export function getDominantColor(imageUrl: string): Promise<string> {
  const cached = dominantCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const done = (c: string) => {
      dominantCache.set(imageUrl, c);
      resolve(c);
    };
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(
          Math.floor(img.width * 0.3),
          Math.floor(img.height * 0.3),
          Math.max(1, Math.floor(img.width * 0.4)),
          Math.max(1, Math.floor(img.height * 0.4)),
        ).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Ignora fundo branco e pixels muito escuros
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) continue;
          if (data[i] < 15 && data[i + 1] < 15 && data[i + 2] < 15) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        if (count === 0) { done("#e5e7eb"); return; }
        done(`rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`);
      } catch {
        done("#e5e7eb");
      }
    };
    img.onerror = () => done("#e5e7eb");
    img.src = imageUrl;
  });
}

/** Cor do círculo de variação: dominante da imagem do produto, com fallback no mapa de nomes. */
export function useDominantColor(imageUrl: string | undefined, colorName: string): string {
  const fallback = getColorHex(colorName);
  const [color, setColor] = useState(() => (imageUrl && dominantCache.get(imageUrl)) || fallback);
  useEffect(() => {
    if (!imageUrl) { setColor(fallback); return; }
    const cached = dominantCache.get(imageUrl);
    if (cached) { setColor(cached); return; }
    setColor(fallback);
    let live = true;
    void getDominantColor(imageUrl).then((c) => { if (live) setColor(c); });
    return () => { live = false; };
  }, [imageUrl, fallback]);
  return color;
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
