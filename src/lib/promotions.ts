import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PromotionRow = {
  id: string;
  store_id: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  scope_type: "all" | "category" | "subcategory" | "tag" | "products";
  scope_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  timer_label: string | null;
};

export type ActivePromotion = {
  promotion: PromotionRow;
  /** null = applies to every product; otherwise the set of eligible product ids */
  productIds: Set<string> | null;
};

export function promotionStatus(p: { active: boolean; starts_at: string | null; ends_at: string | null }) {
  if (!p.active) return "inactive" as const;
  const now = Date.now();
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return "scheduled" as const;
  if (p.ends_at && new Date(p.ends_at).getTime() < now) return "ended" as const;
  return "active" as const;
}

/** Newest promotion that is active right now (with a defined end date) + eligible product ids. */
export async function fetchActivePromotion(storeId: string): Promise<ActivePromotion | null> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("store_id", storeId)
    .eq("active", true)
    .not("ends_at", "is", null)
    .gte("ends_at", now)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const promotion: PromotionRow = {
    ...(data as any),
    value: Number(data.value),
    scope_ids: Array.isArray(data.scope_ids) ? (data.scope_ids as string[]) : [],
  };

  let productIds: Set<string> | null = null;
  if (promotion.scope_type === "products") {
    productIds = new Set(promotion.scope_ids);
  } else if (promotion.scope_type === "category" || promotion.scope_type === "subcategory") {
    const ids = promotion.scope_ids;
    productIds = new Set<string>();
    if (ids.length > 0) {
      const [direct, linked] = await Promise.all([
        supabase.from("products").select("id").eq("store_id", storeId).or(`category_id.in.(${ids.join(",")}),subcategory_id.in.(${ids.join(",")})`),
        supabase.from("product_categories").select("product_id").in("category_id", ids),
      ]);
      for (const r of direct.data ?? []) productIds.add(r.id);
      for (const r of linked.data ?? []) productIds.add(r.product_id);
    }
  }
  return { promotion, productIds };
}

export function calculatePromoPrice(
  product: { id: string; price: number },
  ap: ActivePromotion | null | undefined,
): number | null {
  if (!ap) return null;
  const { promotion, productIds } = ap;
  if (!promotion.active) return null;
  const now = Date.now();
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) return null;
  if (!promotion.ends_at || new Date(promotion.ends_at).getTime() <= now) return null;
  if (productIds && !productIds.has(product.id)) return null;
  const base = Number(product.price);
  const discounted = promotion.type === "percent" ? base * (1 - promotion.value / 100) : base - promotion.value;
  const result = Math.max(0, Math.round(discounted * 100) / 100);
  return result < base ? result : null;
}

export function promoBadgeLabel(p: PromotionRow) {
  return p.type === "percent" ? `-${p.value}%` : `-R$${p.value}`;
}

export function useActivePromotion(storeId: string | undefined) {
  return useQuery({
    queryKey: ["active-promotion", storeId],
    enabled: !!storeId,
    queryFn: () => fetchActivePromotion(storeId!),
    staleTime: 60_000,
  });
}

/**
 * Resolves the effective price for a product considering both its own promo_price
 * and the store-wide timed promotion (the lowest price wins).
 */
export function useProductPromo(storeId: string, product: { id: string; price: number; promo_price?: number | null }) {
  const { data } = useActivePromotion(storeId);
  const qc = useQueryClient();
  const base = Number(product.price);
  const own = product.promo_price != null && Number(product.promo_price) < base ? Number(product.promo_price) : null;
  const timed = calculatePromoPrice(product, data);
  const useTimed = timed != null && (own == null || timed <= own);
  const onExpire = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["active-promotion", storeId] });
  }, [qc, storeId]);
  return {
    price: useTimed ? timed! : own ?? base,
    original: base,
    promotion: useTimed ? data!.promotion : null,
    hasTimedPromo: useTimed,
    onExpire,
  };
}
