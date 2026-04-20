import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { PlanSlug } from "@/lib/plans";

export type MyStore = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  segment: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  accent_color: string;
  whatsapp: string;
  whatsapp_greeting: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  custom_domain: string | null;
  trust_badges: string[];
  shipping_rates: any;
  seo_meta: any;
  welcome_popup: any;
  notify_stock_enabled: boolean;
  active: boolean;
  plan_id: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  plan?: { id: string; slug: PlanSlug; name: string; max_products: number; price_cents: number; features: any } | null;
};

export function useMyStore() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  // Subscribe to realtime UPDATEs on the owner's store row so subscription_status
  // changes (driven by Stripe webhook) invalidate the cache instantly — no polling.
  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const suffix =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).slice(2, 10);
      channel = supabase.channel(`my-store-${user.id}-${suffix}`);
      channel
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "stores",
            filter: `owner_user_id=eq.${user.id}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["my-store-full", user.id] });
          },
        )
        .subscribe();
    } catch (err) {
      // Realtime is non-critical — never let it crash the admin UI
      console.warn("[useMyStore] realtime subscribe failed:", err);
    }

    return () => {
      if (!channel) return;
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn("[useMyStore] realtime cleanup failed:", err);
      }
    };
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-store-full", user?.id],
    enabled: !!user && !authLoading,
    staleTime: 10_000,
    queryFn: async (): Promise<MyStore | null> => {
      const { data, error } = await supabase
        .from("stores")
        .select(`
          id, name, slug, tagline, segment, logo_url, favicon_url, accent_color,
          whatsapp, whatsapp_greeting, instagram, facebook, tiktok, youtube,
          custom_domain, trust_badges, shipping_rates, seo_meta, welcome_popup,
          notify_stock_enabled, active, plan_id, subscription_status,
          trial_ends_at, current_period_end,
          plan:plans!stores_plan_id_fkey(id, slug, name, max_products, price_cents, features)
        `)
        .eq("owner_user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        trust_badges: Array.isArray(data.trust_badges) ? (data.trust_badges as string[]) : [],
        plan: data.plan as any,
      };
    },
  });
}
