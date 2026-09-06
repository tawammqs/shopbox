import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useStorefront, useIsMioTheme } from "@/components/storefront/StoreContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductsGrid } from "@/components/storefront/the-shoes/HomepageSectionRenderers";
import { fetchProductsByHomepageSection, type ProductCardData } from "@/lib/storefront";
import { useColorGroups, dedupeByGroup } from "@/lib/color-groups";
import { PRODUCT_SECTION_ITEMS, type ProductSectionKey } from "@/lib/product-sections";

const searchSchema = z.object({
  tag: fallback(z.string(), "destaque").default("destaque"),
});

export const Route = createFileRoute("/loja/$slug/produtos")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Produtos — Loja online" },
      { name: "description", content: "Veja todos os produtos desta seleção." },
      { property: "og:title", content: "Produtos" },
      { property: "og:description", content: "Veja todos os produtos desta seleção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductsByTagPage,
});

/** Maps any tag alias (destaque, destaques, lancamento, lançamentos...) to a canonical section. */
export function resolveSectionKey(tag: string): ProductSectionKey {
  const t = tag.trim().toLowerCase();
  if (["lancamento", "lançamento", "lancamentos", "lançamentos", "novos", "new"].includes(t)) return "lancamento";
  if (["promocao", "promoção", "promocoes", "oferta", "ofertas", "sale"].includes(t)) return "promocao";
  if (["mais_vendido", "mais_vendidos", "mais-vendidos", "mais vendidos", "best_seller"].includes(t)) return "mais_vendido";
  return "destaque";
}

function ProductsByTagPage() {
  const { store } = useStorefront();
  const { tag } = Route.useSearch();
  const isMio = useIsMioTheme();
  const sectionKey = resolveSectionKey(tag);
  const label = PRODUCT_SECTION_ITEMS.find((s) => s.key === sectionKey)?.label ?? "Produtos";
  const { map: groupMap } = useColorGroups(store.id);

  const q = useQuery({
    queryKey: ["products-section-all", store.id, sectionKey],
    queryFn: () => fetchProductsByHomepageSection(store.id, sectionKey, 500),
    staleTime: 60_000,
  });
  const products = (q.data ?? []) as ProductCardData[];

  return (
    <section className={isMio ? "ts-section" : "mx-auto max-w-7xl px-4 py-10"}>
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:underline">Início</Link>
        <span className="mx-1">/</span>
        <span>{label}</span>
      </nav>
      <h1 className={isMio ? "ts-section-title mb-6" : "mb-5 font-display text-2xl font-bold text-foreground md:text-3xl"}>
        {label}
      </h1>
      {q.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando produtos…</p>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum produto nesta seleção no momento.</p>
      ) : isMio ? (
        <ProductsGrid products={products} />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {dedupeByGroup(products, groupMap).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}
