import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useStorefront } from "./StoreContext";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { searchProductsLive } from "@/lib/storefront";
import { formatBRL } from "@/lib/format";
import { effectivePrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StorefrontHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const cartCount = useCart((s) => s.totalCount(store.id));
  const openCart = useCart((s) => s.open);
  const wishlistCount = useWishlist((s) => s.ids.length);

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchProductsLive(store.id, term);
        setResults(r);
      } catch (_) {
        setResults([]);
      }
    }, 200);
  }, [term, store.id]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/loja/$slug/busca", params: { slug: store.slug }, search: { q: term.trim() } });
    setShowResults(false);
    setSearchOpenMobile(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-6">
        <button
          aria-label="Abrir menu"
          className="rounded-md p-2 text-foreground hover:bg-muted md:hidden"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/loja/$slug" params={{ slug: store.slug }} className="flex shrink-0 items-center gap-2">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-9 w-auto max-w-[160px] object-contain" />
          ) : (
            <span className="font-display text-lg font-bold text-foreground md:text-xl">{store.name}</span>
          )}
        </Link>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Buscar produtos, marcas..."
            className="h-10 w-full rounded-full border border-input bg-muted/40 pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:bg-background"
          />
          {showResults && term.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-[420px] overflow-auto rounded-xl border border-border bg-popover p-2 shadow-lg">
              {results.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum resultado</div>
              ) : (
                <>
                  {results.map((r) => {
                    const price = effectivePrice(r.price, r.promo_price);
                    return (
                      <Link
                        key={r.id}
                        to="/loja/$slug/produto/$productSlug"
                        params={{ slug: store.slug, productSlug: r.slug }}
                        className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted"
                        onClick={() => {
                          setShowResults(false);
                          setTerm("");
                        }}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          {r.brand && <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{r.brand}</p>}
                          <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                          <p className="text-sm font-semibold text-accent">{formatBRL(price)}</p>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitSearch(e as any);
                    }}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-center text-xs font-medium text-accent hover:bg-muted"
                  >
                    Ver todos os resultados →
                  </button>
                </>
              )}
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setSearchOpenMobile((v) => !v)}
            aria-label="Buscar"
            className="rounded-md p-2 text-foreground hover:bg-muted md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            to="/loja/$slug/wishlist"
            params={{ slug: store.slug }}
            aria-label="Lista de desejos"
            className="relative rounded-md p-2 text-foreground hover:bg-muted"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Carrinho"
            onClick={openCart}
            className="relative rounded-md p-2 text-foreground hover:bg-muted"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground",
                  "animate-in zoom-in-50 duration-200",
                )}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpenMobile && (
        <form onSubmit={submitSearch} className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="h-10 w-full rounded-full border border-input bg-muted/40 pl-10 pr-10 text-sm outline-none focus:border-accent focus:bg-background"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpenMobile(false);
                setTerm("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {term.trim().length >= 2 && results.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.map((r) => {
                const price = effectivePrice(r.price, r.promo_price);
                return (
                  <Link
                    key={r.id}
                    to="/loja/$slug/produto/$productSlug"
                    params={{ slug: store.slug, productSlug: r.slug }}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                    onClick={() => setSearchOpenMobile(false)}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-sm font-semibold text-accent">{formatBRL(price)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </form>
      )}
    </header>
  );
}
