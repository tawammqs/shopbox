import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useColorGroups, getColorHex, isLightSwatch, type ColorGroup } from "@/lib/color-groups";
import type { ProductCardData } from "@/lib/storefront";
import { cn } from "@/lib/utils";

/** Shared state for a listing card that belongs to a color group (model with several colors). */
export function useCardVariant(storeId: string, p: ProductCardData) {
  const { map } = useColorGroups(storeId);
  const group: ColorGroup | undefined = map[p.id];
  const [variantIdx, setVariantIdx] = useState(() => Math.max(0, group?.product_ids?.indexOf(p.id) ?? 0));
  const idx = group ? Math.min(variantIdx, (group.product_ids?.length ?? 1) - 1) : 0;
  const isBase = !group || group.product_ids[idx] === p.id;
  const targetSlug = group ? (group.product_slugs?.[idx] ?? p.slug) : p.slug;
  const groupImage = group ? group.first_images?.[idx] || "" : "";
  const img1 = (isBase ? p.images[0]?.url : groupImage) || groupImage || p.images[0]?.url || "";
  const img2 = isBase ? (p.images[1]?.url ?? img1) : img1;
  const title = group ? group.model_name : p.title;
  return { group, idx, setVariantIdx, targetSlug, img1, img2, title };
}

/** Color circles under a listing card. Shows at most `max` swatches plus a "+N" counter. */
export function ColorSwatches({
  group, idx, onSelect, max = 3, className,
}: { group?: ColorGroup; idx: number; onSelect: (i: number) => void; max?: number; className?: string }) {
  if (!group || group.colors.length < 2) return null;
  const visible = group.colors.slice(0, max);
  const rest = group.colors.length - visible.length;
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {visible.map((color, i) => {
        const hex = getColorHex(color);
        const active = i === idx;
        return (
          <button
            key={group.product_ids[i]}
            type="button"
            title={color}
            aria-label={color}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(i); }}
            onMouseEnter={() => onSelect(i)}
            className={cn(
              "h-[18px] w-[18px] rounded-full border-2 transition-all",
              active ? "scale-110 border-[#111]" : "border-transparent hover:border-[#9ca3af]",
            )}
            style={{ backgroundColor: hex, boxShadow: isLightSwatch(hex) ? "inset 0 0 0 1px #e5e7eb" : "none" }}
          />
        );
      })}
      {rest > 0 && <span className="text-[11px] text-[#6b7280]">+{rest}</span>}
    </div>
  );
}

export type RatingSummary = { product_id: string; avg_rating: number; review_count: number };

export function useProductRatings(storeId: string | undefined) {
  const q = useQuery({
    queryKey: ["product-ratings", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_rating_summary")
        .select("product_id, avg_rating, review_count")
        .eq("store_id", storeId as string);
      if (error) return {} as Record<string, RatingSummary>;
      const map: Record<string, RatingSummary> = {};
      for (const r of data ?? []) {
        map[r.product_id as string] = {
          product_id: r.product_id as string,
          avg_rating: Number(r.avg_rating ?? 0),
          review_count: Number(r.review_count ?? 0),
        };
      }
      return map;
    },
    enabled: !!storeId,
    staleTime: 300_000,
  });
  return q.data ?? {};
}

/** "★ 4.8 (12)" line for a listing card; renders nothing when the product has no approved reviews. */
export function CardRating({ storeId, productId, className }: { storeId: string; productId: string; className?: string }) {
  const ratings = useProductRatings(storeId);
  const r = ratings[productId];
  if (!r || r.review_count === 0) return null;
  return (
    <div className={cn("flex items-center gap-1 text-[12px] text-[#6b7280]", className)} aria-label={`Avaliação ${r.avg_rating} de 5`}>
      <Star className="h-[13px] w-[13px] fill-amber-400 text-amber-400" />
      <span className="font-semibold text-[#111]">{r.avg_rating.toFixed(1)}</span>
      <span>({r.review_count})</span>
    </div>
  );
}
