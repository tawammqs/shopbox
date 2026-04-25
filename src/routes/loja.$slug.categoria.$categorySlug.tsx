import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { X } from "lucide-react";
import { useStorefront } from "@/components/storefront/StoreContext";
import { fetchProductsForCategory, fetchCategoryFacets } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const csv = z
  .string()
  .optional()
  .transform((v): string[] => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

const searchSchema = z.object({
  sort: fallback(
    z.enum(["mais_vendidos", "relevance", "price_asc", "price_desc", "newest", "ofertas"]).optional(),
    "relevance",
  ).default("relevance"),
  minPrice: fallback(z.number().optional(), undefined).optional(),
  maxPrice: fallback(z.number().optional(), undefined).optional(),
  inStock: fallback(z.boolean().optional(), undefined).optional(),
  tamanho: fallback(z.string().optional(), undefined).optional(),
  marca: fallback(z.string().optional(), undefined).optional(),
  page: fallback(z.number().int().min(1).optional(), 1).default(1),
});

const splitCsv = (s: string | undefined): string[] =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

export const Route = createFileRoute("/loja/$slug/categoria/$categorySlug")({
  validateSearch: zodValidator(searchSchema),
  component: CategoryPage,
});

const PAGE_SIZE = 12;

const SORT_LABELS: Record<string, string> = {
  mais_vendidos: "Mais vendidos",
  relevance: "Relevância",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  newest: "Mais novo",
  ofertas: "Ofertas",
};

function CategoryPage() {
  const { store, categories } = useStorefront();
  const { categorySlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const cat = categories.find((c) => c.slug === categorySlug);
  const subIds = categories.filter((c) => c.parent_id === cat?.id).map((c) => c.id);
  const ids = cat ? [cat.id, ...subIds] : null;

  const offset = (search.page - 1) * PAGE_SIZE;

  const facets = useQuery({
    queryKey: ["category-facets", store.id, categorySlug],
    queryFn: () => fetchCategoryFacets(store.id, ids),
    enabled: !!cat,
    staleTime: 60_000,
  });

  const tamanhoArr = splitCsv(search.tamanho);
  const marcaArr = splitCsv(search.marca);

  const q = useQuery({
    queryKey: [
      "category-products",
      store.id,
      categorySlug,
      search.sort,
      search.minPrice,
      search.maxPrice,
      search.inStock,
      tamanhoArr.join(","),
      marcaArr.join(","),
      search.page,
    ],
    queryFn: () =>
      fetchProductsForCategory(store.id, ids, {
        limit: PAGE_SIZE,
        offset,
        sort: search.sort,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        inStock: search.inStock,
        sizes: tamanhoArr,
        brands: marcaArr,
      }),
    enabled: !!cat,
    staleTime: 30_000,
  });

  const setSearch = (patch: any) =>
    navigate({
      to: "/loja/$slug/categoria/$categorySlug",
      params: { slug: store.slug, categorySlug },
      search: (prev: any) => {
        const next: any = { ...prev, ...patch };
        if (Array.isArray(next.tamanho)) next.tamanho = next.tamanho.length ? next.tamanho.join(",") : undefined;
        if (Array.isArray(next.marca)) next.marca = next.marca.length ? next.marca.join(",") : undefined;
        if (patch.page == null) next.page = 1;
        return next;
      },
    });

  const toggleArrayFilter = (key: "tamanho" | "marca", value: string) => {
    const current = key === "tamanho" ? tamanhoArr : marcaArr;
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setSearch({ [key]: next });
  };

  const priceMin = facets.data?.priceMin ?? 0;
  const priceMax = Math.max(facets.data?.priceMax ?? 1000, priceMin + 1);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    search.minPrice ?? priceMin,
    search.maxPrice ?? priceMax,
  ]);

  // Keep slider in sync when facets load
  useMemo(() => {
    setPriceRange([search.minPrice ?? priceMin, search.maxPrice ?? priceMax]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMin, priceMax]);

  const [showAllSizes, setShowAllSizes] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

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

  const allSizes = facets.data?.sizes ?? [];
  const allBrands = facets.data?.brands ?? [];
  const visibleSizes = showAllSizes ? allSizes : allSizes.slice(0, 8);
  const visibleBrands = showAllBrands ? allBrands : allBrands.slice(0, 6);

  const hasAnyFilter =
    search.tamanho.length > 0 ||
    search.marca.length > 0 ||
    search.minPrice != null ||
    search.maxPrice != null ||
    !!search.inStock;

  const clearAll = () =>
    setSearch({
      tamanho: [],
      marca: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });

  const chips: { label: string; clear: () => void }[] = [
    ...search.tamanho.map((t) => ({
      label: `Tamanho: ${t}`,
      clear: () => toggleArrayFilter("tamanho", t),
    })),
    ...search.marca.map((b) => ({
      label: `Marca: ${b}`,
      clear: () => toggleArrayFilter("marca", b),
    })),
    ...(search.minPrice != null
      ? [{ label: `Min R$ ${search.minPrice}`, clear: () => setSearch({ minPrice: undefined }) }]
      : []),
    ...(search.maxPrice != null
      ? [{ label: `Max R$ ${search.maxPrice}`, clear: () => setSearch({ maxPrice: undefined }) }]
      : []),
    ...(search.inStock
      ? [{ label: "Em estoque", clear: () => setSearch({ inStock: undefined }) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-accent">
          Início
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">{cat.name}</h1>
        <p className="text-sm text-muted-foreground">
          {total} produto{total !== 1 ? "s" : ""}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6 text-sm">
          {hasAnyFilter && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}

          <FilterSection label="Ordenar por">
            <select
              value={search.sort}
              onChange={(e) => setSearch({ sort: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(SORT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </FilterSection>

          {allSizes.length > 0 && (
            <FilterSection label="Tamanho">
              <ul className="space-y-2">
                {visibleSizes.map((s) => {
                  const checked = search.tamanho.includes(s.label);
                  return (
                    <li key={s.label} className="flex items-center gap-2">
                      <Checkbox
                        id={`size-${s.label}`}
                        checked={checked}
                        onCheckedChange={() => toggleArrayFilter("tamanho", s.label)}
                      />
                      <label
                        htmlFor={`size-${s.label}`}
                        className="flex flex-1 cursor-pointer items-center justify-between text-[13px] text-foreground/80"
                      >
                        <span>{s.label}</span>
                        <span className="text-muted-foreground">({s.count})</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {allSizes.length > 8 && (
                <button
                  onClick={() => setShowAllSizes((v) => !v)}
                  className="mt-3 text-[13px] text-muted-foreground underline hover:text-foreground"
                >
                  {showAllSizes ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </FilterSection>
          )}

          {allBrands.length > 0 && (
            <FilterSection label="Marca">
              <ul className="space-y-2">
                {visibleBrands.map((b) => {
                  const checked = search.marca.includes(b.name);
                  return (
                    <li key={b.name} className="flex items-center gap-2">
                      <Checkbox
                        id={`brand-${b.name}`}
                        checked={checked}
                        onCheckedChange={() => toggleArrayFilter("marca", b.name)}
                      />
                      <label
                        htmlFor={`brand-${b.name}`}
                        className="flex flex-1 cursor-pointer items-center justify-between text-[13px] text-foreground/80"
                      >
                        <span>{b.name}</span>
                        <span className="text-muted-foreground">({b.count})</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {allBrands.length > 6 && (
                <button
                  onClick={() => setShowAllBrands((v) => !v)}
                  className="mt-3 text-[13px] text-muted-foreground underline hover:text-foreground"
                >
                  {showAllBrands ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </FilterSection>
          )}

          <FilterSection label="Faixa de preço">
            <Slider
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.round((priceMax - priceMin) / 100))}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              onValueCommit={(v) =>
                setSearch({
                  minPrice: v[0] > priceMin ? v[0] : undefined,
                  maxPrice: v[1] < priceMax ? v[1] : undefined,
                })
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              R$ {priceRange[0]} — R$ {priceRange[1]}
            </p>
          </FilterSection>

          <FilterSection label="Disponibilidade">
            <label className="flex cursor-pointer items-center gap-2 text-[13px]">
              <Checkbox
                checked={!!search.inStock}
                onCheckedChange={(v) => setSearch({ inStock: v ? true : undefined })}
              />
              Apenas em estoque
            </label>
          </FilterSection>
        </aside>

        <div>
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {chips.map((f, i) => (
                <button
                  key={i}
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
                >
                  {f.label} <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70"
              >
                Limpar tudo
              </button>
            </div>
          )}

          {q.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum produto encontrado com esses filtros.</p>
              {hasAnyFilter && (
                <Button variant="outline" className="mt-4" onClick={clearAll}>
                  Limpar filtros
                </Button>
              )}
            </div>
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

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-foreground">{label}</h3>
      {children}
    </div>
  );
}
