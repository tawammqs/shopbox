import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCategories, buildCategoryTree } from "@/hooks/useCategories";
import { useCart } from "@/stores/cart";
import { formatBRL, effectivePrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  price: number;
  promo_price: number | null;
  product_images: { url: string; position: number }[];
};

export function Header() {
  const { data: settings } = useStoreSettings();
  const { data: categories = [] } = useCategories();
  const tree = buildCategoryTree(categories);
  const navigate = useNavigate();
  const cartCount = useCart((s) => s.totalCount());
  const openCart = useCart((s) => s.open);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const q = query.trim();
      const { data } = await supabase
        .from("products")
        .select("id,title,slug,price,promo_price,product_images(url,position)")
        .eq("active", true)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`)
        .limit(6);
      setResults((data ?? []) as unknown as SearchResult[]);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[0]) {
      navigate({ to: "/produto/$slug", params: { slug: results[0].slug } });
      setQuery("");
      setResults([]);
      setMobileSearchOpen(false);
    }
  };

  const goToProduct = (slug: string) => {
    navigate({ to: "/produto/$slug", params: { slug } });
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Mobile menu trigger */}
          <button
            className="flex h-11 w-11 items-center justify-center md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={settings.name} className="h-9 md:h-10 w-auto" />
            ) : (
              <span className="font-display text-xl md:text-2xl font-bold tracking-tight">
                {settings?.name ?? "Loja"}
              </span>
            )}
          </Link>

          {/* Desktop search */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden flex-1 max-w-xl md:block"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Buscar produtos, marcas, categorias..."
                className="h-11 w-full rounded-full border border-input bg-secondary pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:bg-background"
              />
            </div>
            <AnimatePresence>
              {searchOpen && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
                >
                  {results.map((r) => {
                    const img = r.product_images?.sort((a, b) => a.position - b.position)[0]?.url;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToProduct(r.slug)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-secondary"
                      >
                        {img && (
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{r.title}</div>
                          <div className="text-sm text-accent font-semibold">
                            {formatBRL(effectivePrice(Number(r.price), r.promo_price ? Number(r.promo_price) : null))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              className="flex h-11 w-11 items-center justify-center md:hidden"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={openCart}
              className="relative flex h-11 w-11 items-center justify-center"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSearchSubmit}
              className="overflow-hidden md:hidden"
            >
              <div className="pb-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="h-11 w-full rounded-full border border-input bg-secondary pl-10 pr-4 text-sm outline-none focus:border-accent focus:bg-background"
                  />
                </div>
                {results.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow">
                    {results.map((r) => {
                      const img = r.product_images?.sort((a, b) => a.position - b.position)[0]?.url;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => goToProduct(r.slug)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-secondary"
                        >
                          {img && <img src={img} alt="" loading="lazy" className="h-10 w-10 rounded object-cover" />}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{r.title}</div>
                            <div className="text-sm text-accent font-semibold">
                              {formatBRL(effectivePrice(Number(r.price), r.promo_price ? Number(r.promo_price) : null))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Desktop nav */}
        <nav className="hidden border-t border-border md:block">
          <ul className="flex items-center gap-1">
            {tree.map((cat) => (
              <li key={cat.id} className="group relative">
                <Link
                  to="/categoria/$slug"
                  params={{ slug: cat.slug }}
                  className="inline-flex h-12 items-center gap-1 px-4 text-sm font-medium tracking-wide transition hover:text-accent"
                >
                  {cat.name}
                  {cat.children.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>
                {cat.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-popover py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                    {cat.children.map((sub) => (
                      <Link
                        key={sub.id}
                        to="/categoria/$slug/$sub"
                        params={{ slug: cat.slug, sub: sub.slug }}
                        className="block px-4 py-2 text-sm transition hover:bg-secondary hover:text-accent"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-background md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <span className="font-display text-lg font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="h-11 w-11 grid place-items-center" aria-label="Fechar">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="px-2 py-3">
                {tree.map((cat) => (
                  <MobileCatItem key={cat.id} cat={cat} onNavigate={() => setMobileMenuOpen(false)} />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileCatItem({
  cat,
  onNavigate,
}: {
  cat: ReturnType<typeof buildCategoryTree>[number];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center">
        <Link
          to="/categoria/$slug"
          params={{ slug: cat.slug }}
          onClick={onNavigate}
          className="flex-1 px-3 py-3 text-base font-medium"
        >
          {cat.name}
        </Link>
        {cat.children.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center"
            aria-label="Expandir"
          >
            <ChevronDown className={cn("h-5 w-5 transition", open && "rotate-180")} />
          </button>
        )}
      </div>
      {open && cat.children.length > 0 && (
        <div className="pb-2 pl-4">
          {cat.children.map((sub) => (
            <Link
              key={sub.id}
              to="/categoria/$slug/$sub"
              params={{ slug: cat.slug, sub: sub.slug }}
              onClick={onNavigate}
              className="block px-3 py-2 text-sm text-muted-foreground"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
