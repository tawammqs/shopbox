import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, User, X } from "lucide-react";
import { TheShoesVipBanner } from "../TheShoesExtras";
import { useStorefront } from "../StoreContext";
import { useCart } from "@/stores/cart";
import { searchProductsLive } from "@/lib/storefront";
import { effectivePrice, formatBRL } from "@/lib/format";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { useQuery } from "@tanstack/react-query";

const ACCENT = "#111111";

export function TheShoesHeader() {
  const { store, categories } = useStorefront();
  const navigate = useNavigate();
  const openCart = useCart((s) => s.open);
  const items = useCart((s) => s.items);
  const cartCount = useMemo(
    () => items.filter((i) => i.storeId === store.id).reduce((a, b) => a + b.quantity, 0),
    [items, store.id],
  );

  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
  });
  const ab = settingsQ.data?.announcement_bar;

  const roots = categories.filter((c) => !c.parent_id);

  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try { setResults(await searchProductsLive(store.id, term)); } catch { setResults([]); }
    }, 200);
  }, [term, store.id]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/loja/$slug/busca", params: { slug: store.slug }, search: { q: term.trim() } });
    setSearchOpen(false);
  };

  return (
    <header className="ts-header sticky top-0 z-40 bg-white">
      {/* Announcement bar */}
      {ab?.enabled && ab.items?.length > 0 && (
        <div className="ts-ann" style={{ background: ab.bg_color, color: ab.text_color }}>
          <div className="ts-ann-track">
            <span>{ab.items.join("  ·  ")}  ·  </span>
            <span aria-hidden>{ab.items.join("  ·  ")}  ·  </span>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="ts-main flex items-center border-b border-[#f0f0f0] bg-white">
        {/* left */}
        <div className="flex flex-1 items-center gap-2">
          <button
            aria-label="Abrir menu"
            onClick={() => setNavOpen(true)}
            className="grid h-11 w-11 place-items-center text-[#333] md:hidden"
          >
            <Menu className="h-[22px] w-[22px]" />
          </button>
        </div>

        {/* center logo */}
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="flex shrink-0 items-center justify-center">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="ts-logo object-contain" />
          ) : (
            <span className="font-display text-lg font-extrabold tracking-tight text-[#111]">{store.name}</span>
          )}
        </Link>

        {/* right icons */}
        <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
          <button aria-label="Notificações" className="hidden h-11 w-11 place-items-center text-[#333] md:grid">
            <Bell className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </button>
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center text-[#333]"
          >
            <Search className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </button>
          <Link
            to="/loja/$slug/wishlist"
            params={{ slug: store.slug }}
            aria-label="Conta"
            className="hidden h-11 w-11 place-items-center text-[#333] md:grid"
          >
            <User className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Carrinho"
            className="relative grid h-11 w-11 place-items-center text-[#333]"
          >
            <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.6} />
            {cartCount > 0 && (
              <span
                className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: ACCENT }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* search bar */}
      {searchOpen && (
        <form onSubmit={submitSearch} className="border-b border-[#f0f0f0] bg-white px-4 py-3 md:px-10">
          <div className="relative mx-auto max-w-3xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="h-11 w-full rounded-full border border-[#e5e5e5] bg-white pl-10 pr-10 text-sm outline-none focus:border-[#111]"
            />
            <button type="button" onClick={() => { setSearchOpen(false); setTerm(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full text-[#666] hover:bg-[#f5f5f5]">
              <X className="h-4 w-4" />
            </button>
            {term.trim().length >= 2 && results.length > 0 && (
              <div className="mt-2 max-h-[60vh] overflow-auto rounded-xl border border-[#eee] bg-white p-2 shadow-lg">
                {results.map((r) => {
                  const price = effectivePrice(r.price, r.promo_price);
                  return (
                    <Link key={r.id} to="/loja/$slug/produto/$productSlug"
                      params={{ slug: store.slug, productSlug: r.slug }}
                      onClick={() => { setSearchOpen(false); setTerm(""); }}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#fafafa]">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#f5f5f5]">
                        {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#111]">{r.title}</p>
                        <p className="text-sm font-bold text-[#111]">{formatBRL(price)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      )}

      {/* desktop nav */}
      <nav className="ts-nav hidden border-b border-[#f0f0f0] bg-white md:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-center gap-8 px-10">
          <Link
            to="/loja/$slug" params={{ slug: store.slug }}
            activeOptions={{ exact: true }}
            className="text-[13px] font-medium text-[#333] transition-colors hover:text-[#111]"
            activeProps={{ className: "text-[#111] font-semibold" }}
          >
            Início
          </Link>
          {roots.map((c) => (
            <Link key={c.id}
              to="/loja/$slug/categoria/$categorySlug"
              params={{ slug: store.slug, categorySlug: c.slug }}
              className="text-[13px] font-medium text-[#333] transition-colors hover:text-[#111]"
              activeProps={{ className: "text-[#111] font-semibold" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* mobile drawer */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setNavOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl md:hidden">
            <div className="flex h-[60px] items-center justify-between border-b border-[#f0f0f0] px-4">
              {store.logo_url
                ? <img src={store.logo_url} alt={store.name} className="h-7 w-auto object-contain" />
                : <span className="font-bold text-[#111]">{store.name}</span>}
              <button onClick={() => setNavOpen(false)} aria-label="Fechar" className="grid h-9 w-9 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto py-2">
              <Link to="/loja/$slug" params={{ slug: store.slug }} onClick={() => setNavOpen(false)}
                className="block border-b border-[#f5f5f5] px-6 py-4 text-[15px] font-medium text-[#333]">
                Início
              </Link>
              {roots.map((c) => (
                <Link key={c.id}
                  to="/loja/$slug/categoria/$categorySlug"
                  params={{ slug: store.slug, categorySlug: c.slug }}
                  onClick={() => setNavOpen(false)}
                  className="block border-b border-[#f5f5f5] px-6 py-4 text-[15px] font-medium text-[#333]">
                  {c.name}
                </Link>
              ))}
            </div>
          </aside>
        </>
      )}

      <style>{`
        .ts-header, .ts-header * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }
        .ts-main { height: 64px; padding: 0 16px; }
        .ts-logo { height: 44px; width: auto; max-width: 160px; }
        @media (min-width: 768px) {
          .ts-main { height: 76px; padding: 0 40px; }
          .ts-logo { height: 56px; max-width: 200px; }
        }
        .ts-ann { height: 32px; display: flex; align-items: center; overflow: hidden;
          font-size: 12px; font-weight: 500; letter-spacing: 0.02em; }
        .ts-ann-track { display: inline-flex; white-space: nowrap;
          animation: tsAnnScroll 30s linear infinite; }
        .ts-ann-track > span { padding: 0 20px; }
        @keyframes tsAnnScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </header>
  );
}
