import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Counts = { orders: number; leads: number; questions: number };

/**
 * Live unread counts for the admin sidebar badges.
 * - orders: pedidos com status='aguardando' e viewed_at IS NULL
 * - leads: soma de coupon_leads + vip_group_leads + newsletter_leads com viewed_at IS NULL
 * - questions: perguntas + avaliações com viewed_at IS NULL (join via products.store_id)
 */
export function useUnreadCounts(storeId: string | null | undefined): Counts {
  const [counts, setCounts] = useState<Counts>({ orders: 0, leads: 0, questions: 0 });

  const load = useCallback(async () => {
    if (!storeId) {
      setCounts({ orders: 0, leads: 0, questions: 0 });
      return;
    }

    // Fetch product ids first to allow counting questions/reviews via product_id.
    const { data: prods } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId);
    const productIds = (prods ?? []).map((p) => p.id);

    const ordersP = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "aguardando")
      .is("viewed_at", null);
    const couponP = supabase
      .from("coupon_leads")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .is("viewed_at", null);
    const vipP = (supabase as any)
      .from("vip_group_leads")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .is("viewed_at", null);
    const newsP = supabase
      .from("newsletter_leads")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .is("viewed_at", null);

    const questionsP = productIds.length
      ? (supabase as any)
          .from("product_questions")
          .select("id", { count: "exact", head: true })
          .in("product_id", productIds)
          .is("viewed_at", null)
      : Promise.resolve({ count: 0 });
    const reviewsP = productIds.length
      ? (supabase as any)
          .from("product_reviews")
          .select("id", { count: "exact", head: true })
          .in("product_id", productIds)
          .is("viewed_at", null)
      : Promise.resolve({ count: 0 });

    const [orders, coupon, vip, news, questions, reviews] = await Promise.all([
      ordersP, couponP, vipP, newsP, questionsP, reviewsP,
    ]);

    setCounts({
      orders: (orders as any).count ?? 0,
      leads:
        ((coupon as any).count ?? 0) +
        ((vip as any).count ?? 0) +
        ((news as any).count ?? 0),
      questions: ((questions as any).count ?? 0) + ((reviews as any).count ?? 0),
    });
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    load();

    const suffix = Math.random().toString(36).slice(2, 8);
    const channels = [
      supabase.channel(`unread-orders-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
        () => load(),
      ).subscribe(),
      supabase.channel(`unread-coupon-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coupon_leads", filter: `store_id=eq.${storeId}` },
        () => load(),
      ).subscribe(),
      supabase.channel(`unread-vip-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vip_group_leads", filter: `store_id=eq.${storeId}` },
        () => load(),
      ).subscribe(),
      supabase.channel(`unread-news-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "newsletter_leads", filter: `store_id=eq.${storeId}` },
        () => load(),
      ).subscribe(),
      supabase.channel(`unread-questions-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_questions" },
        () => load(),
      ).subscribe(),
      supabase.channel(`unread-reviews-${storeId}-${suffix}`).on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_reviews" },
        () => load(),
      ).subscribe(),
    ];

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [storeId, load]);

  // Update browser tab title with total unread count.
  useEffect(() => {
    const total = counts.orders + counts.leads + counts.questions;
    const base = "ShopBox Admin";
    const original = document.title;
    document.title = total > 0 ? `(${total > 99 ? "99+" : total}) ${base}` : base;
    return () => {
      document.title = original;
    };
  }, [counts]);

  return counts;
}

/** Mark all unread orders (status=aguardando) as viewed. */
export async function markOrdersViewed(storeId: string) {
  await supabase
    .from("orders")
    .update({ viewed_at: new Date().toISOString() })
    .eq("store_id", storeId)
    .eq("status", "aguardando")
    .is("viewed_at", null);
}

/** Mark all unread leads (3 sources) as viewed. */
export async function markLeadsViewed(storeId: string) {
  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("coupon_leads").update({ viewed_at: now }).eq("store_id", storeId).is("viewed_at", null),
    (supabase as any).from("vip_group_leads").update({ viewed_at: now }).eq("store_id", storeId).is("viewed_at", null),
    supabase.from("newsletter_leads").update({ viewed_at: now }).eq("store_id", storeId).is("viewed_at", null),
  ]);
}

/** Mark all unread questions/reviews for the store as viewed. */
export async function markQuestionsReviewsViewed(storeId: string) {
  const { data: prods } = await supabase.from("products").select("id").eq("store_id", storeId);
  const ids = (prods ?? []).map((p) => p.id);
  if (!ids.length) return;
  const now = new Date().toISOString();
  await Promise.all([
    (supabase as any).from("product_questions").update({ viewed_at: now }).in("product_id", ids).is("viewed_at", null),
    (supabase as any).from("product_reviews").update({ viewed_at: now }).in("product_id", ids).is("viewed_at", null),
  ]);
}
