import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { searchProductsLive } from "@/lib/storefront";
import { useStorefront } from "@/components/storefront/StoreContext";
import { effectivePrice, formatBRL } from "@/lib/format";

const schema = z.object({ q: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/loja/$slug/busca")({
  validateSearch: zodValidator(schema),
  component: SearchPage,
});

function SearchPage() {
  const { store } = useStorefront();
  const { q } = Route.useSearch();

  const query = useQuery({
    queryKey: ["search", store.id, q],
    queryFn: () => searchProductsLive(store.id, q, 24),
    enabled: q.length >= 2,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Resultados para "{q}"</h1>
      <p className="mb-6 text-sm text-muted-foreground">{query.data?.length ?? 0} produtos encontrados</p>

      {q.length < 2 ? (
        <p className="text-muted-foreground">Digite ao menos 2 caracteres para buscar.</p>
      ) : query.isLoading ? (
        <p>Buscando...</p>
      ) : !query.data?.length ? (
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {query.data.map((r) => {
            const price = effectivePrice(r.price, r.promo_price);
            return (
              <Link
                key={r.id}
                to="/loja/$slug/produto/$productSlug"
                params={{ slug: store.slug, productSlug: r.slug }}
                className="group block"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                  {r.image && <img src={r.image} alt={r.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />}
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-medium">{r.title}</h3>
                <p className="text-sm font-semibold text-accent">{formatBRL(price)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
