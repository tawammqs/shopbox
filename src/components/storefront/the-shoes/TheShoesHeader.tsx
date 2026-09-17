import { useStoreHref } from "@/lib/store-href";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X, Package, ChevronRight, ChevronDown } from "lucide-react";
import { TheShoesVipBanner } from "../TheShoesExtras";
import { MioVipMenuLink } from "../MioAddonOverlays";
import { useStorefront } from "../StoreContext";
import { useStoreAffiliate } from "../AffiliateShare";
import { clearAffiliateSession, TS_LIME } from "@/lib/affiliates";
// (StorefrontCustomizer is mounted at the layout level for non-legacy Mio stores)
import { useCart } from "@/stores/cart";
import { searchProductsLive, fetchStoreBrands } from "@/lib/storefront";
import { effectivePrice, formatBRL } from "@/lib/format";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { useQuery } from "@tanstack/react-query";

export function TheShoesHeader() {
  const { store, categories, menus } = useStorefront();
  const isLegacyTheShoes = store.slug === "the-shoes";
  const navigate = useNavigate();
  const affiliate = useStoreAffiliate();
  const openCart = useCart((s) => s.open);
  const items = useCart((s) => s.items);
  const cartCount = useMemo(
    () => items.filter((i) => i.storeId === store.id).reduce((a, b) => a + b.quantity, 0),
    [items, store.id],
  );

  // Legacy The Shoes: announcement comes from the_shoes_theme_settings.
  // Other Mio stores use StorefrontCustomizer's announcement bar (mounted by the layout).
  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
    enabled: isLegacyTheShoes,
  });
  const ab = isLegacyTheShoes ? settingsQ.data?.announcement_bar : undefined;

  const roots = categories.filter((c) => !c.parent_id);

  const storeHref = useStoreHref();

  /** Garante que links relativos apontem para as páginas DESTA loja. */
  const resolveUrl = (url: string | null) => {
    if (!url) return "#";
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    if (path.startsWith("/loja/")) return storeHref(path);
    return storeHref(`/loja/${store.slug}${path}`);
  };

  // Menu horizontal do desktop: prefere menu com nome de header/topo/principal; senão, o primeiro.
  const desktopMenu = useMemo(() => {
    if (!menus?.length) return null;
    return menus.find((m) => /header|topo|principal|main|nav/i.test(m.name)) ?? menus[0];
  }, [menus]);
  const desktopMenuItems = desktopMenu?.items ?? [];

  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try { setResults(await searchProductsLive(store.id, term)); } catch { setResults([]); }
    }, 200);
  }, [term, store.id]);

  useEffect(() => {
    fetchStoreBrands(store.id).then(setBrands).catch(() => setBrands([]));
  }, [store.id]);

  // A barra fixa mobile abre o modal do Grupo VIP via CustomEvent.
  useEffect(() => {
    const h = () => setVipOpen(true);
    window.addEventListener("ts:open-vip", h);
    return () => window.removeEventListener("ts:open-vip", h);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/loja/$slug/busca", params: { slug: store.slug }, search: { q: term.trim() } });
    setSearchOpen(false);
  };

  const hamburger = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="#111" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
  const bellIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
  const userIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
  const searchIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const bagIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );

  return (
    <header className={cn("ts-header sticky top-0 z-40 bg-white", store.slug === "loja-aranha" && "ts-header-aranha")}>
      {ab?.enabled && ab.items?.length > 0 && (
        <div className="ts-ann" style={{ background: ab.bg_color, color: ab.text_color }}>
          <div className="ts-ann-track">
            <span>{ab.items.join("  ·  ")}  ·  </span>
            <span aria-hidden>{ab.items.join("  ·  ")}  ·  </span>
          </div>
        </div>
      )}

      <div className="ts-main border-b border-[#f0f0f0]">
        {/* LEFT */}
        <div className="ts-main-left">
          <button aria-label="Abrir menu" onClick={() => setNavOpen(true)} className="ts-icon-btn ts-hamburger-btn md:hidden">
            {hamburger}
          </button>
          {affiliate && (
            <Link
              to="/loja/$slug/afiliados/painel"
              params={{ slug: store.slug }}
              className="ts-desktop-only ml-3 items-center gap-1.5 pb-0.5 text-sm font-semibold text-[#111]"
              style={{ borderBottom: `2px solid ${TS_LIME}` }}
            >
              📊 Painel
            </Link>
          )}
        </div>

        {/* CENTER logo */}
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="ts-main-center">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="ts-logo object-contain" />
          ) : (
            <span className="font-display text-lg font-extrabold tracking-tight text-[#111]">{store.name}</span>
          )}
        </Link>

        {/* RIGHT icons */}
        <div className="ts-main-right">
          <button aria-label="Notificações" className="ts-icon-btn ts-desktop-only">{bellIcon}</button>
          {affiliate ? (
            <Link to="/loja/$slug/afiliados/painel" params={{ slug: store.slug }}
                  className="ts-desktop-only items-center gap-1.5 text-sm font-semibold text-[#111]">
              <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: TS_LIME, color: "#111827" }}>
                {affiliate.name.charAt(0).toUpperCase()}
              </span>
              <span>{affiliate.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link to="/loja/$slug/entrar" params={{ slug: store.slug }} aria-label="Entrar"
                  className="ts-desktop-only items-center gap-1 text-sm text-[#555] hover:text-[#111]">
              {userIcon}<span>Entrar</span>
            </Link>
          )}
          <button aria-label="Buscar" onClick={() => setSearchOpen((v) => !v)} className="ts-icon-btn">
            {searchIcon}
          </button>
          <button onClick={openCart} aria-label="Carrinho" className="ts-icon-btn ts-cart-btn">
            {bagIcon}
            {cartCount > 0 && <span className="ts-cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Menu horizontal desktop (oculto no mobile) */}
      {isLegacyTheShoes ? (
        <DesktopSaintGermainNav storeSlug={store.slug} brands={brands} onOpenVip={() => setVipOpen(true)} />
      ) : desktopMenuItems.length > 0 ? (
        <nav
          className="hidden md:flex"
          style={{
            borderBottom: "0.5px solid #e5e7eb",
            backgroundColor: "#ffffff",
            padding: "0 32px",
            alignItems: "center",
            gap: 32,
            overflowX: "auto",
          }}
          aria-label="Navegação principal"
        >
          {desktopMenuItems.map((item) => (
            <a
              key={item.id}
              href={resolveUrl(item.url)}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
                padding: "12px 0",
                whiteSpace: "nowrap",
                borderBottom: "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
              onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-b border-[#f0f0f0] bg-white px-4 py-3 md:px-10">
          <div className="relative mx-auto max-w-3xl">
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos..."
              className="h-11 w-full rounded-full border border-[#e5e5e5] bg-white px-4 pr-10 text-sm outline-none focus:border-[#111]"
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

      {/* Navigation drawer (desktop + mobile) */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setNavOpen(false)} />
          <aside className="ts-drawer">
            {/* Desktop: só botão fechar */}
            <div className="ts-drawer-close-desktop mb-8 flex items-center">
              <button onClick={() => setNavOpen(false)} aria-label="Fechar"
                className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-[#e0e0e0] text-[#333]"
                style={{ fontSize: 18 }}>
                ×
              </button>
            </div>
            {/* Mobile: topo com logo + fechar */}
            <div className="ts-drawer-mobile-top">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} style={{ height: 44, width: "auto", objectFit: "contain" }} />
              ) : (
                <span style={{ fontWeight: 800, fontSize: 18, color: "#111" }}>{store.name}</span>
              )}
              <button onClick={() => setNavOpen(false)} aria-label="Fechar"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#111", padding: 4 }}>
                <X size={24} />
              </button>
            </div>
            {/* Mobile: login / criar conta */}
            {!affiliate && (
              <Link to="/loja/$slug/entrar" params={{ slug: store.slug }} onClick={() => setNavOpen(false)}
                className="ts-drawer-mobile-login">
                <span>Iniciar sessão ou criar conta</span>
                <span style={{ color: "#9ca3af", fontSize: 18 }}>›</span>
              </Link>
            )}
            <div className="ts-drawer-body overflow-y-auto">
              <Link to="/loja/$slug" params={{ slug: store.slug }} onClick={() => setNavOpen(false)}
                className="block border-b border-[#f5f5f5] py-4 text-[16px] font-medium text-[#111]">
                Início
              </Link>
              {roots.map((c) => {
                const subs = categories.filter((s) => s.parent_id === c.id);
                if (subs.length === 0) {
                  return (
                    <Link key={c.id}
                      to="/loja/$slug/categoria/$categorySlug"
                      params={{ slug: store.slug, categorySlug: c.slug }}
                      onClick={() => setNavOpen(false)}
                      className="flex items-center justify-between border-b border-[#f5f5f5] py-4 text-[16px] font-medium text-[#111]">
                      <span>{c.name}</span>
                      <span className="text-[16px] text-[#aaa]">›</span>
                    </Link>
                  );
                }
                const isOpen = openCatId === c.id;
                return (
                  <div key={c.id} className="border-b border-[#f5f5f5]">
                    <button
                      type="button"
                      onClick={() => setOpenCatId(isOpen ? null : c.id)}
                      className="flex w-full items-center justify-between py-4 text-[16px] font-medium text-[#111]">
                      <span>{c.name}</span>
                      <span className="text-[16px] text-[#aaa]" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
                    </button>
                    {isOpen && (
                      <div className="pb-2">
                        <Link
                          to="/loja/$slug/categoria/$categorySlug"
                          params={{ slug: store.slug, categorySlug: c.slug }}
                          onClick={() => setNavOpen(false)}
                          className="block py-2 pl-3 text-[14px] text-[#666]">
                          Ver todos em {c.name}
                        </Link>
                        {subs.map((s) => (
                          <Link key={s.id}
                            to="/loja/$slug/categoria/$categorySlug"
                            params={{ slug: store.slug, categorySlug: s.slug }}
                            onClick={() => setNavOpen(false)}
                            className="block py-2 pl-3 text-[14px] text-[#333]">
                            {s.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-4">
                {isLegacyTheShoes ? (
                  <button
                    type="button"
                    onClick={() => { setNavOpen(false); setVipOpen(true); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#d9f523',
                      borderRadius: '9999px',
                      padding: '10px 20px',
                      marginTop: '16px',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#111111',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                      <circle cx="12" cy="16" r="1" fill="#111"/>
                    </svg>
                    Ofertas Secretas
                  </button>
                ) : (
                  <MioVipMenuLink onNavigate={() => setNavOpen(false)} />
                )}
              </div>
              {!affiliate && (
                <Link to="/loja/$slug/entrar" params={{ slug: store.slug }} onClick={() => setNavOpen(false)}
                  className="ts-drawer-login-extra mt-4 block border-t border-[#f5f5f5] py-4 text-[16px] font-medium text-[#111]">
                  Entrar
                </Link>
              )}
              <div style={{ flex: 1, minHeight: 32 }} />
              <Link
                to="/loja/$slug/rastreio"
                params={{ slug: store.slug }}
                onClick={() => setNavOpen(false)}
                className="ts-drawer-tracking"
              >
                <span className="ts-drawer-tracking-label">
                  <Package size={20} />
                  <span>Rastrear pedido</span>
                </span>
                <ChevronRight size={16} />
              </Link>
              {affiliate && (
                <div className="mt-4 border-t border-[#f5f5f5]">
                  <div className="bg-[#fafafa] px-2 py-2 text-xs font-semibold uppercase text-[#999]">Área do Afiliado</div>
                  <Link to="/loja/$slug/afiliados/painel" params={{ slug: store.slug }} onClick={() => setNavOpen(false)}
                    className="block border-b border-[#f5f5f5] py-3 text-[15px] font-semibold text-[#111]">
                    📊 Meu Painel
                  </Link>
                  <button
                    type="button"
                    onClick={() => { clearAffiliateSession(); setNavOpen(false); }}
                    className="block w-full border-b border-[#f5f5f5] py-3 text-left text-[15px] text-[#e11d48]">
                    Sair da conta de afiliado
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      <style>{`
        .ts-header, .ts-header * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }
        .ts-main {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          height: 56px;
          padding: 0 16px;
          background: #fff;
        }
        .ts-main-left { justify-self: start; display: flex; align-items: center; }
        .ts-main-center { justify-self: center; display: flex; align-items: center; }
        .ts-main-right { justify-self: end; display: flex; align-items: center; gap: 12px; }
        .ts-logo { height: 40px; width: auto; max-width: 160px; }
        @media (min-width: 768px) { .ts-logo { height: 48px; } }
        @media (max-width: 767px) {
          .ts-header-aranha .ts-main { grid-template-columns: 1fr auto 1fr; }
          .ts-header-aranha .ts-main-center { justify-self: center; }
          .ts-header-aranha .ts-logo { height: 48px; max-width: 190px; }
        }
        .ts-icon-btn {
          background: transparent; border: none; cursor: pointer;
          color: #111; padding: 4px;
          min-width: 44px; min-height: 44px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: color 0.15s;
        }
        .ts-icon-btn:hover { color: #555; }
        .ts-hamburger-btn { display: inline-flex; }
        @media (min-width: 768px) { .ts-hamburger-btn { display: none; } }
        .ts-cart-btn { position: relative; }
        .ts-cart-badge {
          position: absolute; top: 2px; right: 2px;
          background: #c0392b; color: #fff;
          font-size: 10px; font-weight: 700;
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; line-height: 1;
        }
        .ts-desktop-only { display: none; }
        @media (min-width: 768px) {
          .ts-main { height: 70px; padding: 0 40px; }
          .ts-main-right { gap: 20px; }
          .ts-desktop-only { display: inline-flex; }
        }
        .ts-ann { height: 32px; display: flex; align-items: center; overflow: hidden;
          font-size: 12px; font-weight: 500; letter-spacing: 0.02em; }
        .ts-ann-track { display: inline-flex; white-space: nowrap;
          animation: tsAnnScroll 30s linear infinite; }
        .ts-ann-track > span { padding: 0 20px; }
        @keyframes tsAnnScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

        .ts-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 320px; max-width: 90vw;
          background: #fff; z-index: 201;
          padding: 24px; overflow-y: auto;
          animation: tsDrawerIn 0.3s ease forwards;
        }
        .ts-drawer-mobile-top { display: none; }
        .ts-drawer-mobile-login { display: none; }
        .ts-drawer-mobile-affiliate { display: none; }
        .ts-drawer-tracking {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 16px; border-top: 1px solid #f5f5f5;
          padding: 16px 0; font-size: 16px; font-weight: 500; color: #111;
          text-decoration: none;
        }
        .ts-drawer-tracking-label {
          display: flex; align-items: center; gap: 10;
        }
        @keyframes tsDrawerIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        /* Mobile: menu sobrepõe a tela inteira */
        @media (max-width: 767px) {
          .ts-drawer {
            width: 100%; max-width: 100vw;
            padding: 0; overflow: hidden;
            display: flex; flex-direction: column;
          }
          .ts-drawer-close-desktop { display: none; }
          .ts-drawer-mobile-top {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; border-bottom: 0.5px solid #e5e7eb;
          }
          .ts-drawer-mobile-login {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; border-bottom: 0.5px solid #e5e7eb;
            font-weight: 600; font-size: 15px; color: #111;
          }
          .ts-drawer-mobile-affiliate {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; border-bottom: 0.5px solid #e5e7eb;
            font-weight: 600; font-size: 15px; color: #111;
          }
          .ts-drawer-login-extra { display: none; }
          .ts-drawer-body {
            flex: 1; min-height: 0;
            display: flex; flex-direction: column;
            padding: 0 20px; overflow-y: auto;
          }
          .ts-drawer-tracking {
            margin: 0 -20px;
            padding: 18px 20px;
            background: #111827;
            border-top: none;
            font-size: 15px;
            font-weight: 600;
            color: #ffffff;
          }
          .ts-drawer-tracking svg { stroke: #ffffff; }
        }
      `}</style>

      {isLegacyTheShoes && (
        <TheShoesVipBanner open={vipOpen} onOpenChange={setVipOpen} />
      )}
    </header>
  );
}

function DesktopSaintGermainNav({
  storeSlug,
  brands,
  onOpenVip,
}: {
  storeSlug: string;
  brands: string[];
  onOpenVip: () => void;
}) {
  const linkBase: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    padding: "13px 0",
    whiteSpace: "nowrap",
    textDecoration: "none",
    borderBottom: "2px solid transparent",
    transition: "border-color 0.2s",
  };

  return (
    <nav
      className="hidden md:flex"
      style={{
        borderBottom: "0.5px solid #e5e7eb",
        backgroundColor: "#ffffff",
        padding: "0 40px",
        alignItems: "center",
        gap: 28,
      }}
      aria-label="Navegação principal"
    >
      <Link
        to="/loja/$slug/produtos"
        params={{ slug: storeSlug }}
        search={{ tag: "mais-vendidos" }}
        style={linkBase}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
      >
        Mais vendidos
      </Link>
      <Link
        to="/loja/$slug/produtos"
        params={{ slug: storeSlug }}
        search={{ tag: "lancamento" }}
        style={linkBase}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
      >
        Lançamentos
      </Link>

      {/* Marcas — dropdown com marcas reais da loja */}
      <div className="group relative flex items-center" style={{ whiteSpace: "nowrap" }}>
        <button
          type="button"
          style={{
            ...linkBase,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Marcas <ChevronDown className="h-3 w-3" />
        </button>
        {brands.length > 0 && (
          <div className="invisible absolute left-0 top-full z-50 min-w-[180px] rounded-xl border border-[#e5e7eb] bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
            {brands.map((brand) => (
              <Link
                key={brand}
                to="/loja/$slug/categoria/$categorySlug"
                params={{ slug: storeSlug, categorySlug: "theshoes" }}
                search={{ marca: brand }}
                className="block rounded-md px-3 py-2 text-sm text-[#374151] hover:bg-[#f5f5f5]"
              >
                {brand}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/loja/$slug/categoria/$categorySlug"
        params={{ slug: storeSlug, categorySlug: "theshoes" }}
        style={linkBase}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
      >
        The Shoes
      </Link>
      <Link
        to="/loja/$slug/rastreio"
        params={{ slug: storeSlug }}
        style={linkBase}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
      >
        Rastrear Pedido
      </Link>
      <button
        type="button"
        onClick={onOpenVip}
        style={{
          ...linkBase,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "#111827")}
        onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
      >
        Ofertas Secretas
      </button>

      <Link
        to="/loja/$slug/afiliados"
        params={{ slug: storeSlug }}
        style={{
          ...linkBase,
          fontWeight: 700,
          color: "#ffffff",
          backgroundColor: "#111827",
          padding: "6px 14px",
          borderRadius: 20,
          marginLeft: "auto",
          borderBottom: "none",
        }}
      >
        💰 Seja Afiliada
      </Link>
    </nav>
  );
}
