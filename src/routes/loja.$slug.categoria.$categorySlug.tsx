import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useStorefront } from "@/components/storefront/StoreContext";
import { fetchProductsForCategory } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const searchSchema = z.object({
  sort: fallback(z.enum(["relevance", "price_asc", "price_desc", "newest", "ofertas"]).optional(), "relevance").default("relevance"),
  minPrice: fallback(z.number().optional(), undefined).optional(),
  maxPrice: fallback(z.number().optional(), undefined).optional(),
  inStock: fallback(z.boolean().optional(), undefined).optional(),
  page: fallback(z.number().int().min(1).optional(), 1).default(1),
});

export const Route = createFileRoute("/loja/$slug/categoria/$categorySlug")({
  validateSearch: zodValidator(searchSchema),
  component: CategoryPage,
});

const PAGE_SIZE = 12;

function CategoryPage() {
  const { store, categories } = useStorefront();
  const { categorySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const cat = categories.find((c) => c.slug === categorySlug);
  const subIds = categories.filter((c) => c.parent_id === cat?.id).map((c) => c.id);
  const ids = cat ? [cat.id, ...subIds] : null;

  const offset = (search.page - 1) * PAGE_SIZE;

  const q = useQuery({
    queryKey: ["category-products", store.id, categorySlug, search.sort, search.minPrice, search.maxPrice, search.inStock, search.page],
    queryFn: () =>
      fetchProductsForCategory(store.id, ids, {
        limit: PAGE_SIZE,
        offset,
        sort: search.sort,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        inStock: search.inStock,
      }),
    enabled: !!cat,
    staleTime: 30_000,
  });

  const setSearch = (patch: any) =>
    navigate({ to: "/loja/$slug/categoria/$categorySlug", params: { slug: store.slug, categorySlug }, search: (prev: any) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  const [priceRange, setPriceRange] = useState<[number, number]>([
    search.minPrice ?? 0,
    search.maxPrice ?? 1000,
  ]);

  if (!cat) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Categoria não encontrada</h1>
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="mt-4 inline-block text-accent">
          Voltar à loja
        </Link>
      </div>
    );
  }

  const products = q.data?.products ?? [];
  const total = q.data?.total ?? 0;
  const hasMore = offset + products.length < total;

  const activeFilters = [
    search.minPrice != null && { label: `Min ${search.minPrice}`, clear: () => setSearch({ minPrice: undefined }) },
    search.maxPrice != null && { label: `Max ${search.maxPrice}`, clear: () => setSearch({ maxPrice: undefined }) },
    search.inStock && { label: "Em estoque", clear: () => setSearch({ inStock: undefined }) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-accent">Início</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{cat.name}</h1>
          <p className="text-sm text-muted-foreground">{total} produto{total !== 1 ? "s" : ""}</p>
        </div>
        <select
          value={search.sort}
          onChange={(e) => setSearch({ sort: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="relevance">Relevância</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="newest">Mais novos</option>
          <option value="ofertas">Ofertas</option>
        </select>
      </header>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Faixa de preço</h3>
            <Slider
              min={0}
              max={1000}
              step={10}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              onValueCommit={(v) => setSearch({ minPrice: v[0] || undefined, maxPrice: v[1] < 1000 ? v[1] : undefined })}
            />
            <p className="mt-2 text-xs text-muted-foreground">R$ {priceRange[0]} — R$ {priceRange[1]}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!search.inStock}
              onChange={(e) => setSearch({ inStock: e.target.checked || undefined })}
              className="h-4 w-4"
            />
            Apenas em estoque
          </label>
        </aside>

        <div>
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map((f, i) => (
                <button
                  key={i}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70"
                >
                  {f.label} ×
                </button>
              ))}
            </div>
          )}

          {q.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Nenhum produto encontrado</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={() => setSearch({ page: search.page + 1 })}>
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
