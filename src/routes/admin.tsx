import { createFileRoute, Outlet, Link, useNavigate, useLocation, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, Package, FolderTree, Image, Tag, MessageSquare,
  Settings, CreditCard, LogOut, ExternalLink, Store as StoreIcon, Menu, Palette
} from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { planLabel } from "@/lib/plans";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel — ShopBox" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/descontos", label: "Descontos", icon: Tag },
  { to: "/admin/temas", label: "Temas", icon: Palette },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquare },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin/plano", label: "Plano & Cobrança", icon: CreditCard },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: store, isLoading: storeLoading } = useMyStore();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Redirect /admin → /admin/dashboard
  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [location.pathname, navigate]);

  if (loading || storeLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="font-display text-2xl font-bold">Você ainda não tem uma loja</h1>
        <p className="text-muted-foreground">Crie sua loja para acessar o painel.</p>
        <Button onClick={() => navigate({ to: "/cadastro" })}>Criar minha loja</Button>
      </div>
    );
  }

  const planSlug = store.plan?.slug ?? null;

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <SidebarContent storeName={store.name} storeSlug={store.slug} planLabel={planLabel(planSlug as any)} />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent storeName={store.name} storeSlug={store.slug} planLabel={planLabel(planSlug as any)} />
              </SheetContent>
            </Sheet>
            <span className="font-display text-lg font-bold">ShopBox</span>
          </div>
          <div className="hidden flex-1 md:block" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/loja/${store.slug}`} target="_blank" rel="noopener">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver loja
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <PaymentTestModeBanner />

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ storeName, storeSlug, planLabel: pl }: { storeName: string; storeSlug: string; planLabel: string }) {
  return (
    <>
      <div className="border-b border-border p-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <StoreIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{storeName}</p>
            <p className="truncate text-xs text-muted-foreground">/{storeSlug}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-accent/10 text-accent font-medium" }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Seu plano</p>
          <p className="text-sm font-semibold">{pl}</p>
          <Button asChild size="sm" variant="outline" className="mt-2 w-full">
            <Link to="/admin/plano">Gerenciar plano</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
