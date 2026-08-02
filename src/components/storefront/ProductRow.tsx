import type { ProductCardData } from "@/lib/storefront";
import { ProductCard } from "./ProductCard";
import { useStorefront } from "./StoreContext";
import { useStorefrontCustomizations } from "./StorefrontCustomizer";
import { useColorGroups, dedupeByGroup } from "@/lib/color-groups";
import { cn } from "@/lib/utils";

const MOBILE_GRID: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-2",
  mixed: "grid-cols-2",
};
const DESKTOP_GRID: Record<string, string> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-3 lg:grid-cols-4",
  "5": "md:grid-cols-4 lg:grid-cols-5",
};

export function ProductRow({ title, products }: { title: string; products: ProductCardData[] }) {
  const { store } = useStorefront();
  const { data: cust } = useStorefrontCustomizations(store.id);
  const { map: groupMap } = useColorGroups(store.id);
  const mob = MOBILE_GRID[cust?.productList?.mobilePerRow ?? "2"] ?? "grid-cols-2";
  const desk = DESKTOP_GRID[cust?.productList?.desktopPerRow ?? "4"] ?? "md:grid-cols-3 lg:grid-cols-4";
  const list = dedupeByGroup(products, groupMap);

  if (list.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-5 font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>

      {/* Mobile */}
      <div className={cn("grid gap-2.5 md:hidden", mob)}>
        {products.slice(0, 6).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>

      {/* Desktop */}
      <div className={cn("hidden gap-5 md:grid", desk)}>
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
