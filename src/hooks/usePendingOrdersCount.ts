import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live count of orders with status="aguardando" for the given store.
 * Subscribes to realtime changes on the orders table so the badge updates
 * automatically when a new order comes in or status changes.
 */
export function usePendingOrdersCount(storeId: string | null | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!storeId) {
      setCount(0);
      return;
    }
    let cancelled = false;

    const refresh = async () => {
      const { count: c } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "aguardando");
      if (!cancelled) setCount(c ?? 0);
    };

    refresh();

    const channel = supabase
      .channel(`pending-orders-${storeId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
        () => refresh(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return count;
}
