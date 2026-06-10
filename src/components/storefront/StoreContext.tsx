import { createContext, useContext, type ReactNode } from "react";
import type { StoreRow } from "@/lib/storefront";

type Ctx = {
  store: StoreRow;
  categories: { id: string; name: string; slug: string; parent_id: string | null; image_url: string | null; display_order: number }[];
  activeThemeSlug: string | null;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ value, children }: { value: Ctx; children: ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStorefront() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStorefront must be used within StoreProvider");
  return ctx;
}

/**
 * Returns true when the store has the Mio-style premium theme active.
 * Falls back to the legacy `the-shoes` slug check so existing stores
 * without a configured theme keep their current look.
 */
export function useIsMioTheme() {
  const { store, activeThemeSlug } = useStorefront();
  return activeThemeSlug === "mio-style" || store.slug === "the-shoes";
}
