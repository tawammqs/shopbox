import { createContext, useContext, type ReactNode } from "react";
import type { StoreRow } from "@/lib/storefront";

type Ctx = {
  store: StoreRow;
  categories: { id: string; name: string; slug: string; parent_id: string | null; image_url: string | null; display_order: number }[];
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
