import type { ProductCardData } from "@/lib/storefront";
import { ProductCard } from "./ProductCard";

export function ProductRow({ title, products }: { title: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-5 font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>

      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-2.5 md:hidden">
        {products.slice(0, 6).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden grid-cols-3 gap-5 md:grid lg:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
