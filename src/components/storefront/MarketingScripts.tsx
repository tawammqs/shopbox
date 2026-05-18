import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { initPixel, initGA, trackPageView, clearEventCache } from "@/lib/tracking";

export function MarketingScripts({
  pixelId,
  gaId,
}: {
  pixelId: string | null;
  gaId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    initPixel(pixelId);
    initGA(gaId);
  }, [pixelId, gaId]);

  // Fire PageView/page_view on route changes (SPA navigation).
  // Also clear the per-event dedup cache so the same product can re-track
  // ViewContent / AddToCart on a fresh page view.
  useEffect(() => {
    if (!pixelId && !gaId) return;
    const unsub = router.subscribe("onResolved", () => {
      clearEventCache();
      trackPageView();
      if (typeof window !== "undefined" && window.gtag && gaId) {
        try {
          window.gtag("config", gaId, { page_path: window.location.pathname });
        } catch {}
      }
    });
    return () => unsub();
  }, [router, pixelId, gaId]);

  return null;
}
