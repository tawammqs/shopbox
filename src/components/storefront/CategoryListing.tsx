import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useAllProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "./ProductCard";
import { effectivePrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "relevant" | "price-asc" | "price-desc" | "newest" | "deals";

export function CategoryListing({
  categorySlug,
  subSlug,
}: {
  categorySlug: string;
  subSlug?: string;
}) {
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useAllProducts();

  const cat = categories.find((c) => c.slug === categorySlug && !c.parent_id);
  const sub = subSlug ? categories.find((c) => c.slug === subSlug && c.parent_id === cat?.id) : undefined;
  const subIds = categories.filter((c) => c.parent_id === cat?.id).map((c) => c.id);

  // Base scope: this cat + its subs (or specific sub)
  const baseList = useMemo(() => {
    if (!cat) return [];
    return products.filter((p) => {
      if (sub) return p.subcategory_id === sub.id;
      return p.category_id === cat.id || subIds.includes(p.subcategory_id ?? "");
    });
  }, [products, cat, sub, subIds]);

  // Filters
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("relevant");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visible, setVisible] = useState(12);

  // Available facets
  const allBrands = useMemo(() => Array.from(new Set(baseList.map((p) => p.brand).filter(Boolean) as string[])), [baseList]);
  const allColors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string }>();
    baseList.forEach((p) => p.product_colors.forEach((c) => map.set(c.name, { name: c.name, hex: c.hex })));
    return Array.from(map.values());
  }, [baseList]);
  const priceRange = useMemo(() => {
    if (baseList.length === 0) return { min: 0, max: 0 };
    const prices = baseList.map((p) => effectivePrice(Number(p.price), p.promo_price ? Number(p.promo_price) : null));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [baseList]);

  // Note: sizes are per-product on detail page; for listing we offer common sizes from products if needed.
  // Skipping size facet for simplicity in listing.

  const filtered = useMemo(() => {
    let list = baseList;
    if (selectedSubs.length) list = list.filter((p) => selectedSubs.includes(p.subcategory_id ?? ""));
    if (selectedBrands.length) list = list.filter((p) => p.brand && selectedBrands.includes(p.brand));
    if (selectedColors.length) list = list.filter((p) => p.product_colors.some((c) => selectedColors.includes(c.name)));
    if (selectedTags.length) list = list.filter((p) => p.tags.some((t) => selectedTags.includes(t)));
    if (priceMin > 0 || priceMax > 0) {
      list = list.filter((p) => {
        const ep = effectivePrice(Number(p.price), p.promo_price ? Number(p.promo_price) : null);
        if (priceMin > 0 && ep < priceMin) return false;
        if (priceMax > 0 && ep > priceMax) return false;
        return true;
      });
    }

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => effectivePrice(Number(a.price), a.promo_price ? Number(a.promo_price) : null) - effectivePrice(Number(b.price), b.promo_price ? Number(b.promo_price) : null));
        break;
      case "price-desc":
        sorted.sort((a, b) => effectivePrice(Number(b.price), b.promo_price ? Number(b.promo_price) : null) - effectivePrice(Number(a.price), a.promo_price ? Number(a.promo_price) : null));
        break;
      case "newest":
        sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        break;
      case "deals":
        sorted.sort((a, b) => {
          const ad = a.promo_price ? 1 : 0;
          const bd = b.promo_price ? 1 : 0;
          return bd - ad;
        });
        break;
    }
    return sorted;
  }, [baseList, selectedSubs, selectedBrands, selectedColors, selectedTags, priceMin, priceMax, sort]);

  const subCats = categories.filter((c) => c.parent_id === cat?.id);

  const clearAll = () => {
    setSelectedSubs([]);
    setSelectedSizes([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedTags([]);
    setPriceMin(0);
    setPriceMax(0);
  };

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  if (!cat) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Categoria não encontrada.</div>;
  }

  const FilterPanel = (
    <div className="space-y-6">
      {!sub && subCats.length > 0 && (
        <FilterGroup title="Subcategorias">
          {subCats.map((s) => (
            <CheckRow
              key={s.id}
              label={s.name}
              checked={selectedSubs.includes(s.id)}
              onChange={() => toggle(selectedSubs, setSelectedSubs, s.id)}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Preço">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`R$ ${priceRange.min}`}
            value={priceMin || ""}
            onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-accent"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            placeholder={`R$ ${priceRange.max}`}
            value={priceMax || ""}
            onChange={(e) => setPriceMax(Number(e.target.value) || 0)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </FilterGroup>

      {allBrands.length > 0 && (
        <FilterGroup title="Marca">
          {allBrands.map((b) => (
            <CheckRow
              key={b}
              label={b}
              checked={selectedBrands.includes(b)}
              onChange={() => toggle(selectedBrands, setSelectedBrands, b)}
            />
          ))}
        </FilterGroup>
      )}

      {allColors.length > 0 && (
        <FilterGroup title="Cor">
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => (
              <button
                key={c.name}
                onClick={() => toggle(selectedColors, setSelectedColors, c.name)}
                title={c.name}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition",
                  selectedColors.includes(c.name) ? "border-accent ring-2 ring-accent/30" : "border-border",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Tags">
        {[
          { v: "destaques", l: "Destaques" },
          { v: "lancamentos", l: "Lançamentos" },
          { v: "ofertas", l: "Ofertas" },
        ].map((t) => (
          <CheckRow
            key={t.v}
            label={t.l}
            checked={selectedTags.includes(t.v)}
            onChange={() => toggle(selectedTags, setSelectedTags, t.v)}
          />
        ))}
      </FilterGroup>

      <button onClick={clearAll} className="w-full rounded-full border border-border py-2 text-sm font-medium transition hover:bg-secondary">
        Limpar filtros
      </button>
    </div>
  );

  const activeChips: { label: string; clear: () => void }[] = [
    ...selectedSubs.map((id) => ({ label: subCats.find((s) => s.id === id)?.name ?? "", clear: () => toggle(selectedSubs, setSelectedSubs, id) })),
    ...selectedBrands.map((b) => ({ label: b, clear: () => toggle(selectedBrands, setSelectedBrands, b) })),
    ...selectedColors.map((c) => ({ label: c, clear: () => toggle(selectedColors, setSelectedColors, c) })),
    ...selectedTags.map((t) => ({ label: t, clear: () => toggle(selectedTags, setSelectedTags, t) })),
  ].filter((c) => c.label);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {sub?.name ?? cat.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} produtos</p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filtrar
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto h-10 rounded-full border border-border bg-background px-4 text-sm font-medium outline-none focus:border-accent"
        >
          <option value="relevant">Mais Relevantes</option>
          <option value="price-asc">Menor Preço</option>
          <option value="price-desc">Maior Preço</option>
          <option value="newest">Mais Novo</option>
          <option value="deals">Ofertas</option>
        </select>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {activeChips.map((c, i) => (
            <button
              key={i}
              onClick={c.clear}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
            >
              {c.label} <X className="h-3 w-3" />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs text-muted-foreground underline">
            Limpar tudo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">{FilterPanel}</aside>

        <div>
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">Nenhum produto encontrado.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {filtered.slice(0, visible).map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setVisible((v) => v + 12)}
                    className="rounded-full border-2 border-accent px-6 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-accent-foreground"
                  >
                    Ver mais
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Filtrar</h3>
                <button onClick={() => setDrawerOpen(false)} aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {FilterPanel}
              <button
                onClick={() => setDrawerOpen(false)}
                className="mt-6 w-full rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground"
              >
                Aplicar filtros
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
      />
      {label}
    </label>
  );
}
