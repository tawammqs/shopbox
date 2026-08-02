import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { X, SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import { useStorefront } from "@/components/storefront/StoreContext";
import { fetchProductsForCategory, fetchCategoryFacets } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { trackViewCategory } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  cor: fallback(z.string().optional(), undefined).optional(),
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

  

  const facets = useQuery({
    queryKey: ["category-facets", store.id, categorySlug],
    queryFn: () => fetchCategoryFacets(store.id, ids),
    enabled: !!cat,
    staleTime: 60_000,
  });

  const tamanhoArr = splitCsv(search.tamanho);
  const marcaArr = splitCsv(search.marca);
  const corArr = splitCsv(search.cor);

  const q = useInfiniteQuery({
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
      corArr.join(","),
    ],
    queryFn: ({ pageParam = 0 }) =>
      fetchProductsForCategory(store.id, ids, {
        limit: PAGE_SIZE,
        offset: pageParam * PAGE_SIZE,
        sort: search.sort,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        inStock: search.inStock,
        sizes: tamanhoArr,
        brands: marcaArr,
        colorNames: corArr,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.products.length, 0);
      return loaded < (lastPage.total ?? 0) ? allPages.length : undefined;
    },
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
        if (Array.isArray(next.cor)) next.cor = next.cor.length ? next.cor.join(",") : undefined;
        if (patch.page == null) next.page = 1;
        return next;
      },
    });

  const toggleArrayFilter = (key: "tamanho" | "marca" | "cor", value: string) => {
    const current = key === "tamanho" ? tamanhoArr : key === "marca" ? marcaArr : corArr;
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  useEffect(() => {
    if (cat?.name) trackViewCategory(cat.name);
  }, [cat?.name]);

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

  const products = useMemo(
    () => (q.data?.pages ?? []).flatMap((p) => p.products),
    [q.data],
  );
  const total = q.data?.pages?.[0]?.total ?? 0;
  const hasMore = !!q.hasNextPage;

  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && q.hasNextPage && !q.isFetchingNextPage) {
          q.fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage]);

  const allSizes = facets.data?.sizes ?? [];
  const allBrands = facets.data?.brands ?? [];
  const allColors = facets.data?.colors ?? [];
  const visibleSizes = showAllSizes ? allSizes : allSizes.slice(0, 8);
  const visibleBrands = showAllBrands ? allBrands : allBrands.slice(0, 6);

  const hasAnyFilter =
    tamanhoArr.length > 0 ||
    marcaArr.length > 0 ||
    corArr.length > 0 ||
    search.minPrice != null ||
    search.maxPrice != null ||
    !!search.inStock;

  const clearAll = () =>
    setSearch({
      tamanho: [],
      marca: [],
      cor: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });

  const chips: { label: string; clear: () => void }[] = [
    ...tamanhoArr.map((t) => ({
      label: `Tamanho: ${t}`,
      clear: () => toggleArrayFilter("tamanho", t),
    })),
    ...marcaArr.map((b) => ({
      label: `Marca: ${b}`,
      clear: () => toggleArrayFilter("marca", b),
    })),
    ...corArr.map((c) => ({
      label: `Cor: ${c}`,
      clear: () => toggleArrayFilter("cor", c),
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

      {/* Mobile sticky filter/sort bar */}
      <MobileFilterBar
        activeFiltersCount={chips.length}
        sortLabel={search.sort !== "relevance" ? SORT_LABELS[search.sort] : null}
        chips={chips}
        onOpenFilters={() => setMobileFiltersOpen(true)}
        onOpenSort={() => setMobileSortOpen(true)}
      />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden space-y-6 text-sm md:block">
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
                  const checked = tamanhoArr.includes(s.label);
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
                  const checked = marcaArr.includes(b.name);
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

          {allColors.length > 0 && (
            <FilterSection label="Cor">
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => {
                  const sel = corArr.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      title={`${c.name} (${c.count})`}
                      onClick={() => toggleArrayFilter("cor", c.name)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition",
                        sel
                          ? "border-foreground bg-muted font-semibold"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                      <span className="text-muted-foreground">({c.count})</span>
                    </button>
                  );
                })}
              </div>
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
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}

          <div ref={loaderRef} className="py-6">
            {q.isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                Carregando mais produtos...
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                ✓ Todos os {products.length} produtos carregados
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        sizes={allSizes}
        brands={allBrands}
        colors={allColors}
        priceMin={priceMin}
        priceMax={priceMax}
        initialSizes={tamanhoArr}
        initialBrands={marcaArr}
        initialColors={corArr}
        initialMinPrice={search.minPrice}
        initialMaxPrice={search.maxPrice}
        initialInStock={!!search.inStock}
        productCount={total}
        onApply={(next) => {
          setSearch({
            tamanho: next.sizes,
            marca: next.brands,
            cor: next.colors,
            minPrice: next.minPrice,
            maxPrice: next.maxPrice,
            inStock: next.inStock || undefined,
          });
          setMobileFiltersOpen(false);
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onClear={clearAll}
      />

      {/* Mobile sort bottom sheet */}
      <MobileSortSheet
        open={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
        current={search.sort}
        onSelect={(v) => {
          setSearch({ sort: v });
          setMobileSortOpen(false);
        }}
      />
    </div>
  );
}

// ===== Mobile components =====

function MobileFilterBar({
  activeFiltersCount,
  sortLabel,
  chips,
  onOpenFilters,
  onOpenSort,
}: {
  activeFiltersCount: number;
  sortLabel: string | null;
  chips: { label: string; clear: () => void }[];
  onOpenFilters: () => void;
  onOpenSort: () => void;
}) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-[#e8e8e0] bg-white px-4 py-2.5 md:hidden">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#e8e8e0] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a1a]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrar
          {activeFiltersCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOpenSort}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#e8e8e0] bg-white px-4 py-2 text-[13px] font-medium text-[#1a1a1a]"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortLabel ? `Ordenar: ${sortLabel}` : "Ordenar"}
        </button>
      </div>

      {chips.length > 0 && (
        <div
          className="mt-2 flex gap-1.5 overflow-x-auto pb-1"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
        >
          {chips.map((c, i) => (
            <button
              key={i}
              onClick={c.clear}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[12px] text-[#166534]"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type SizeFacet = { label: string; count: number };
type BrandFacet = { name: string; count: number };
type ColorFacet = { name: string; hex: string; count: number };

function MobileFilterSheet({
  open,
  onClose,
  sizes,
  brands,
  colors,
  priceMin,
  priceMax,
  initialSizes,
  initialBrands,
  initialColors,
  initialMinPrice,
  initialMaxPrice,
  initialInStock,
  productCount,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  sizes: SizeFacet[];
  brands: BrandFacet[];
  colors: ColorFacet[];
  priceMin: number;
  priceMax: number;
  initialSizes: string[];
  initialBrands: string[];
  initialColors: string[];
  initialMinPrice: number | undefined;
  initialMaxPrice: number | undefined;
  initialInStock: boolean;
  productCount: number;
  onApply: (next: {
    sizes: string[];
    brands: string[];
    colors: string[];
    minPrice: number | undefined;
    maxPrice: number | undefined;
    inStock: boolean;
  }) => void;
  onClear: () => void;
}) {
  const [pendingSizes, setPendingSizes] = useState<string[]>(initialSizes);
  const [pendingBrands, setPendingBrands] = useState<string[]>(initialBrands);
  const [pendingColors, setPendingColors] = useState<string[]>(initialColors);
  const [pendingRange, setPendingRange] = useState<[number, number]>([
    initialMinPrice ?? priceMin,
    initialMaxPrice ?? priceMax,
  ]);
  const [pendingInStock, setPendingInStock] = useState(initialInStock);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Re-sync pending state when sheet opens
  useEffect(() => {
    if (open) {
      setPendingSizes(initialSizes);
      setPendingBrands(initialBrands);
      setPendingColors(initialColors);
      setPendingRange([initialMinPrice ?? priceMin, initialMaxPrice ?? priceMax]);
      setPendingInStock(initialInStock);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const visibleSizes = showAllSizes ? sizes : sizes.slice(0, 12);
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 8);

  const hasAny =
    pendingSizes.length > 0 ||
    pendingBrands.length > 0 ||
    pendingColors.length > 0 ||
    pendingRange[0] > priceMin ||
    pendingRange[1] < priceMax ||
    pendingInStock;

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] flex-col rounded-t-2xl p-0 md:hidden"
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#e0e0e0]" />
        <div className="flex shrink-0 items-center justify-between border-b border-[#e8e8e0] px-5 py-4">
          <h2 className="text-base font-bold text-[#1a1a1a]">Filtros</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-[#aaa]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5" style={{ WebkitOverflowScrolling: "touch" }}>
          {sizes.length > 0 && (
            <section className="border-b border-[#f0f0ea] py-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
                Tamanho
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {visibleSizes.map((s) => {
                  const sel = pendingSizes.includes(s.label);
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setPendingSizes((arr) => toggle(arr, s.label))}
                      className={cn(
                        "flex min-h-[44px] items-center justify-center rounded-lg border px-2 py-2.5 text-sm font-medium transition",
                        sel
                          ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                          : "border-[#e8e8e0] bg-white text-[#555]",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {sizes.length > 12 && (
                <button
                  onClick={() => setShowAllSizes((v) => !v)}
                  className="mt-3 text-[13px] text-[#555] underline"
                >
                  {showAllSizes ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </section>
          )}

          {brands.length > 0 && (
            <section className="border-b border-[#f0f0ea] py-5">
              <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
                Marca
              </h3>
              <ul>
                {visibleBrands.map((b) => {
                  const sel = pendingBrands.includes(b.name);
                  return (
                    <li
                      key={b.name}
                      className="flex min-h-[44px] items-center justify-between border-b border-[#f9f9f9] py-2.5"
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-3">
                        <Checkbox
                          checked={sel}
                          onCheckedChange={() =>
                            setPendingBrands((arr) => toggle(arr, b.name))
                          }
                          className="h-5 w-5"
                        />
                        <span className="text-sm text-[#333]">{b.name}</span>
                      </label>
                      <span className="text-[13px] text-[#aaa]">({b.count})</span>
                    </li>
                  );
                })}
              </ul>
              {brands.length > 8 && (
                <button
                  onClick={() => setShowAllBrands((v) => !v)}
                  className="mt-3 text-[13px] text-[#555] underline"
                >
                  {showAllBrands ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </section>
          )}

          {colors.length > 0 && (
            <section className="border-b border-[#f0f0ea] py-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
                Cor
              </h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const sel = pendingColors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setPendingColors((arr) => toggle(arr, c.name))}
                      className={cn(
                        "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3 py-2 text-[13px] transition",
                        sel
                          ? "border-[#1a1a1a] bg-[#f5f5f5] font-semibold text-[#1a1a1a]"
                          : "border-[#e8e8e0] bg-white text-[#555]",
                      )}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                      <span className="text-[#aaa]">({c.count})</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}



          <section className="border-b border-[#f0f0ea] py-5">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#aaa]">
              Faixa de preço
            </h3>
            <Slider
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.round((priceMax - priceMin) / 100))}
              value={pendingRange}
              onValueChange={(v) => setPendingRange(v as [number, number])}
            />
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                value={pendingRange[0]}
                onChange={(e) =>
                  setPendingRange([Number(e.target.value) || priceMin, pendingRange[1]])
                }
                placeholder="De R$"
                className="h-11 flex-1 rounded-lg border border-[#e8e8e0] px-2 text-center text-base"
              />
              <input
                type="number"
                value={pendingRange[1]}
                onChange={(e) =>
                  setPendingRange([pendingRange[0], Number(e.target.value) || priceMax])
                }
                placeholder="Até R$"
                className="h-11 flex-1 rounded-lg border border-[#e8e8e0] px-2 text-center text-base"
              />
            </div>
          </section>

          <section className="flex items-center justify-between py-5">
            <span className="text-sm font-medium text-[#333]">Apenas em estoque</span>
            <button
              type="button"
              role="switch"
              aria-checked={pendingInStock}
              onClick={() => setPendingInStock((v) => !v)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                pendingInStock ? "bg-[#25D366]" : "bg-[#e0e0e0]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  pendingInStock ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </section>
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-[#e8e8e0] bg-white px-5 py-4">
          <button
            type="button"
            disabled={!hasAny}
            onClick={() => {
              onClear();
              onClose();
            }}
            className="h-12 flex-1 rounded-lg border border-[#e8e8e0] bg-transparent text-sm font-semibold text-[#555] disabled:opacity-50"
          >
            Limpar filtros
          </button>
          <button
            type="button"
            onClick={() =>
              onApply({
                sizes: pendingSizes,
                brands: pendingBrands,
                colors: pendingColors,
                minPrice: pendingRange[0] > priceMin ? pendingRange[0] : undefined,
                maxPrice: pendingRange[1] < priceMax ? pendingRange[1] : undefined,
                inStock: pendingInStock,
              })
            }
            className="h-12 flex-[2] rounded-lg bg-[#1a1a1a] text-sm font-semibold text-white"
          >
            Ver {productCount} produto{productCount !== 1 ? "s" : ""}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileSortSheet({
  open,
  onClose,
  current,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  onSelect: (v: any) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0 md:hidden">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#e0e0e0]" />
        <div className="flex items-center justify-between border-b border-[#e8e8e0] px-5 py-4">
          <h2 className="text-base font-bold text-[#1a1a1a]">Ordenar por</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-[#aaa]">
            <X className="h-6 w-6" />
          </button>
        </div>
        <ul className="pb-4">
          {Object.entries(SORT_LABELS).map(([v, l]) => {
            const sel = current === v;
            return (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => onSelect(v)}
                  className="flex min-h-[56px] w-full items-center justify-between border-b border-[#f9f9f9] px-5 py-4 text-left"
                >
                  <span
                    className={cn(
                      "text-[15px]",
                      sel ? "font-bold text-[#1a1a1a]" : "text-[#333]",
                    )}
                  >
                    {l}
                  </span>
                  {sel && <Check className="h-5 w-5 text-[#25D366]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
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
