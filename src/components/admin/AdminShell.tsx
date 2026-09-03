import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Home, BarChart2, ShoppingCart, DollarSign, Users, Package, Tag,
  Store as StoreIcon, Settings, ChevronDown, ChevronRight, Lock, Search,
  HelpCircle, Menu, X, LogOut, ExternalLink,
  CreditCard, Megaphone,
} from "lucide-react";
import { useAllAddonStatus } from "@/lib/addons";
import { signOut } from "@/hooks/useAuth";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { cn } from "@/lib/utils";

type SubItem = { label: string; to: string; premium?: boolean; external?: boolean; addonKey?: string };
type NavItem = {
  label: string;
  to?: string;
  icon: typeof Home;
  children?: SubItem[];
  external?: boolean;
};
type NavSection = { label?: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Início", to: "/admin", icon: Home },
      {
        label: "Estatísticas",
        icon: BarChart2,
        children: [
          { label: "Visão geral", to: "/admin/estatisticas" },
          { label: "Produtos", to: "/admin/estatisticas/produtos", premium: true },
          { label: "Vendas e clientes", to: "/admin/estatisticas/vendas", premium: true },
          { label: "Visitas", to: "/admin/estatisticas/visitas", premium: true },
          { label: "Tempo real", to: "/admin/estatisticas/tempo-real", premium: true },
        ],
      },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      {
        label: "Vendas",
        icon: ShoppingCart,
        children: [{ label: "Lista de vendas", to: "/admin/vendas" }],
      },
      { label: "Financeiro", to: "/admin/financeiro", icon: DollarSign },
      {
        label: "Clientes",
        icon: Users,
        children: [
          { label: "Lista de clientes", to: "/admin/clientes" },
        ],
      },
    ],
  },
  {
    label: "PRODUTOS",
    items: [
      {
        label: "Produtos",
        icon: Package,
        children: [
          { label: "Lista de produtos", to: "/admin/produtos" },
          { label: "Categorias", to: "/admin/produtos/categorias" },
          { label: "Tabela de Preços", to: "/admin/produtos/tabela-precos", premium: true },
        ],
      },
      {
        label: "Descontos",
        icon: Tag,
        children: [
          { label: "Cupons", to: "/admin/descontos/cupons" },
          { label: "Frete grátis", to: "/admin/descontos/frete-gratis" },
          { label: "Promoções", to: "/admin/descontos/promocoes" },
        ],
      },
    ],
  },
  {
    label: "MARKETING",
    items: [
      {
        label: "Marketing",
        icon: Megaphone,
        children: [
          { label: "Video Commerce", to: "/admin/marketing/video-commerce", addonKey: "video_commerce" },
          { label: "Grupo VIP", to: "/admin/marketing/grupo-vip", addonKey: "grupo_vip" },
          { label: "Captura de Leads", to: "/admin/marketing/captura-leads", addonKey: "captura_leads" },
          { label: "Compre Junto", to: "/admin/marketing/compre-junto", addonKey: "compre_junto" },
          { label: "Perguntas e Avaliações", to: "/admin/marketing/perguntas-avaliacoes", addonKey: "perguntas_avaliacoes" },
          { label: "Afiliados", to: "/admin/afiliados" },
        ],
      },
    ],
  },
  {
    label: "CANAIS DE VENDA",
    items: [
      {
        label: "Loja online",
        icon: StoreIcon,
        children: [
          { label: "Layout", to: "/admin/loja/layout" },
          { label: "Temas", to: "/admin/temas" },
          { label: "Páginas", to: "/admin/loja/paginas" },
          { label: "Menus", to: "/admin/loja/menus" },
          { label: "Filtros", to: "/admin/loja/filtros" },
          { label: "Links de redes sociais", to: "/admin/loja/redes-sociais" },
        ],
      },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { label: "Planos e Cobrança", to: "/admin/plano", icon: CreditCard },
  { label: "Configurações", to: "/admin/configuracoes", icon: Settings },
];

// Map pathnames → page title for header
const TITLE_MAP: Record<string, string> = {
  "/admin": "Início",
  "/admin/estatisticas": "Estatísticas",
  "/admin/estatisticas/produtos": "Estatísticas — Produtos",
  "/admin/estatisticas/vendas": "Estatísticas — Vendas e clientes",
  "/admin/estatisticas/visitas": "Estatísticas — Visitas",
  "/admin/estatisticas/tempo-real": "Estatísticas — Tempo real",
  "/admin/vendas": "Vendas",
  "/admin/pedidos": "Vendas",
  "/admin/financeiro": "Financeiro",
  "/admin/clientes": "Clientes",
  "/admin/clientes/avaliacoes": "Perguntas e Avaliações",
  "/admin/perguntas": "Perguntas e Avaliações",
  "/admin/produtos": "Produtos",
  "/admin/produtos/categorias": "Categorias",
  "/admin/categorias": "Categorias",
  "/admin/produtos/tabela-precos": "Tabela de Preços",
  "/admin/descontos": "Descontos",
  "/admin/descontos/cupons": "Cupons",
  "/admin/descontos/frete-gratis": "Frete grátis",
  "/admin/descontos/promocoes": "Promoções",
  "/admin/loja/layout": "Layout",
  "/admin/loja/paginas": "Páginas",
  "/admin/loja/menus": "Menus",
  "/admin/loja/filtros": "Filtros",
  "/admin/loja/redes-sociais": "Links de redes sociais",
  "/admin/personalizar-loja": "Loja online",
  "/admin/configuracoes": "Configurações",
  "/admin/plano": "Planos e Cobrança",
  "/admin/temas": "Temas",
  "/admin/banners": "Banners",
  "/admin/home-video": "Vídeo da home",
  "/admin/dashboard": "Dashboard",
  "/admin/marketing": "Marketing",
  "/admin/marketing/video-commerce": "Video Commerce",
  "/admin/marketing/grupo-vip": "Grupo VIP",
  "/admin/marketing/captura-leads": "Captura de Leads",
  "/admin/marketing/compre-junto": "Compre Junto",
  "/admin/marketing/perguntas-avaliacoes": "Perguntas e Avaliações",
  "/admin/afiliados": "Afiliados",
};

function pageTitleFor(pathname: string): string {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // Find best prefix match
  const match = Object.keys(TITLE_MAP)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLE_MAP[match] : "Painel";
}

export function AdminShell({
  storeId,
  storeName,
  storeSlug,
  children,
}: {
  storeId: string;
  storeName: string;
  storeSlug: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = useMemo(() => pageTitleFor(location.pathname), [location.pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-[#f9fafb] text-[#111827]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-[#e5e7eb] bg-white md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <Sidebar
          storeId={storeId}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          currentPath={location.pathname}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-[#e5e7eb] bg-white">
            <Sidebar
              storeId={storeId}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              currentPath={location.pathname}
              mobile
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#111827]">{title}</h1>
          </div>
          <HeaderActions storeName={storeName} storeSlug={storeSlug} />
        </header>
        <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  storeId, collapsed, onToggle, currentPath, mobile,
}: {
  storeId: string;
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
  mobile?: boolean;
}) {
  const unread = useUnreadCounts(storeId);
  const pendingOrders = unread.orders;
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const { data: addonsActive = {} } = useAllAddonStatus(storeId);

  return (
    <>
      <div className={cn("flex h-14 items-center border-b border-[#e5e7eb]", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366] text-white text-[15px] font-bold hover:opacity-90"
            aria-label="Expandir menu"
          >
            S
          </button>
        ) : (
          <>
            <Link to="/admin" className="flex items-center">
              <img src="/LOGO_SHOPBOX.png" alt="ShopBox" className="h-7 w-auto object-contain" style={{ maxWidth: 140, display: "block" }} />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
              aria-label={mobile ? "Fechar menu" : "Recolher menu"}
            >
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="mb-4">
            {section.label && !collapsed && (
              <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavRow
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  currentPath={currentPath}
                  unreadByPath={{
                    "/admin/vendas": unread.orders,
                    "/admin/marketing/perguntas-avaliacoes": unread.questions,
                  }}
                  isPremium={isPremium}
                  addonsActive={addonsActive}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#e5e7eb] p-2 space-y-0.5">
        {FOOTER_ITEMS.map((item) => (
          <NavRow key={item.label} item={item} collapsed={collapsed} currentPath={currentPath} unreadByPath={{}} isPremium={isPremium} />
        ))}
      </div>
    </>
  );
}

function NavRow({
  item, collapsed, currentPath, unreadByPath, hasSubmenuIndicator, isPremium, addonsActive,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
  unreadByPath: Record<string, number>;
  hasSubmenuIndicator?: boolean;
  isPremium?: boolean;
  addonsActive?: Record<string, boolean>;
}) {
  const hasChildren = !!item.children?.length;
  const childActive = hasChildren && item.children!.some((c) => currentPath === c.to || currentPath.startsWith(c.to + "/"));
  const isActiveLeaf = !hasChildren && item.to ? (item.to === "/admin" ? currentPath === "/admin" : currentPath === item.to || currentPath.startsWith(item.to + "/")) : false;
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = item.icon;
  const leafUnread = !hasChildren && item.to ? (unreadByPath[item.to] ?? 0) : 0;
  const groupUnread = hasChildren
    ? item.children!.reduce((sum, c) => sum + (unreadByPath[c.to] ?? 0), 0)
    : 0;

  if (!hasChildren && item.to) {
    const content = (
      <>
        <div className="relative">
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {collapsed && leafUnread > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && hasSubmenuIndicator && <ChevronRight className="h-4 w-4 text-gray-400" />}
        {!collapsed && leafUnread > 0 && (
          <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {leafUnread > 9 ? "9+" : leafUnread}
          </span>
        )}
      </>
    );
    const baseCls = cn(
      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal text-[#374151] transition",
      "hover:bg-[#f9fafb]",
      isActiveLeaf && "bg-[#f0fdf4] text-[#25d366] font-medium",
      collapsed && "justify-center",
    );
    if (item.external) {
      return (
        <a href={item.to} target="_blank" rel="noopener" className={baseCls} title={collapsed ? item.label : undefined}>
          {isActiveLeaf && <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#25d366]" />}
          {content}
          {!collapsed && <ExternalLink className="h-3.5 w-3.5 text-gray-400" />}
        </a>
      );
    }
    return (
      <Link to={item.to} className={baseCls} title={collapsed ? item.label : undefined}>
        {isActiveLeaf && <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#25d366]" />}
        {content}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-normal text-[#374151] transition hover:bg-[#f9fafb]",
          childActive && "text-[#25d366] font-medium",
          collapsed && "justify-center",
        )}
        title={collapsed ? item.label : undefined}
      >
        {childActive && <span className="absolute left-0 top-0 h-full w-[3px] rounded-r bg-[#25d366]" />}
        <div className="relative">
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {collapsed && groupUnread > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
        {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
        {!collapsed && groupUnread > 0 && (
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {groupUnread > 9 ? "9+" : groupUnread}
          </span>
        )}
        {!collapsed && (open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />)}
      </button>
      {!collapsed && open && (
        <div className="ml-8 mt-0.5 space-y-0.5 border-l border-[#e5e7eb] pl-3">
          {item.children!.map((child) => {
            const active = currentPath === child.to;
            const childUnread = unreadByPath[child.to] ?? 0;
            return (
              <Link
                key={child.to}
                to={child.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827]",
                  active && "text-[#25d366] font-medium",
                )}
              >
                <span className="flex-1 truncate">{child.label}</span>
                {childUnread > 0 && (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#25d366] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {childUnread > 9 ? "9+" : childUnread}
                  </span>
                )}
                {child.premium && !isPremium && (
                  <>
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#25d366]">
                      Premium
                    </span>
                  </>
                )}
                {child.addonKey && !addonsActive?.[child.addonKey] && (
                  <Lock className="h-3 w-3 text-gray-300" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeaderActions({ storeName, storeSlug }: { storeName: string; storeSlug: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const initial = (storeName || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Buscar"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>
      <a
        href="https://ajuda.shopboxapp.com.br"
        target="_blank"
        rel="noopener"
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Ajuda"
      >
        <HelpCircle className="h-[18px] w-[18px]" />
      </a>
      <a
        href={`/loja/${storeSlug}`}
        target="_blank"
        rel="noopener"
        className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 md:inline-flex"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Ver loja
      </a>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366] text-sm font-semibold text-white">
            {initial}
          </span>
          <span className="hidden text-sm font-medium text-[#111827] sm:inline">{storeName}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
              <button
                onClick={() => { setMenuOpen(false); navigate({ to: "/admin/configuracoes" }); }}
                className="block w-full px-4 py-2 text-left text-sm text-[#111827] hover:bg-[#f9fafb]"
              >
                Minha conta
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate({ to: "/admin/plano" }); }}
                className="block w-full px-4 py-2 text-left text-sm text-[#111827] hover:bg-[#f9fafb]"
              >
                Plano atual
              </button>
              <div className="my-1 border-t border-[#e5e7eb]" />
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#111827] hover:bg-[#f9fafb]"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          </>
        )}
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-4">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                autoFocus
                placeholder="Buscar produtos, pedidos, clientes…"
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-500">Comece a digitar para buscar.</div>
          </div>
        </div>
      )}
    </div>
  );
}
