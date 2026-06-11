import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackStoreVisit } from "@/lib/visits";

export function VisitTracker({ storeId }: { storeId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!storeId || !pathname) return;
    // fire-and-forget; productId comes from product pages via their own effect
    trackStoreVisit({ storeId, path: pathname });
  }, [storeId, pathname]);

  return null;
}
