import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { searchProductsLive, type ProductCardData } from "@/lib/storefront";
import { useStorefront, useIsMioTheme } from "@/components/storefront/StoreContext";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductsGrid } from "@/components/storefront/the-shoes/HomepageSectionRenderers";
import { useColorGroups, dedupeByGroup } from "@/lib/color-groups";
import { trackSearch } from "@/lib/tracking";

const schema = z.object({ q: fallback(z.string().optional(), "").default("") });

export const Route = createFileRoute("/loja/$slug/busca")({
  validateSearch: zodValidator(schema),
  component: SearchPage,
});

function SearchPage() {
  const { store } = useStorefront();
  const { q } = Route.useSearch();
  const isMio = useIsMioTheme();
  const { map: groupMap } = useColorGroups(store.id);

  useEffect(() => {
    if (q && q.length >= 2) trackSearch(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["search", store.id, q],
    queryFn: () => searchProductsLive(store.id, q, 24),
    enabled: q.length >= 2,
  });
  const products = (query.data ?? []) as ProductCardData[];
  const visible = dedupeByGroup(products, groupMap);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Resultados para "{q}"</h1>
      <p className="mb-6 text-sm text-muted-foreground">{visible.length} produtos encontrados</p>

      {q.length < 2 ? (
        <p className="text-muted-foreground">Digite ao menos 2 caracteres para buscar.</p>
      ) : query.isLoading ? (
        <p>Buscando...</p>
      ) : !visible.length ? (
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      ) : isMio ? (
        <ProductsGrid products={visible} />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
