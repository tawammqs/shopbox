import type { ProductCardData } from "@/lib/storefront";
import { ProductCard } from "./ProductCard";

export function ProductRow({ title, products }: { title: string; products: ProductCardData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-5 font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h2>

      {/* Mobile: horizontal scroll */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-[60vw] max-w-[220px] shrink-0 snap-start">
            <ProductCard p={p} />
          </div>
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
