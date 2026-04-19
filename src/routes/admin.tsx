import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
// Note: post-checkout activation is now handled by Realtime in useMyStore.
import {
  LayoutDashboard, Package, FolderTree, Image, Tag, MessageSquare,
  Settings, CreditCard, LogOut, ExternalLink, Store as StoreIcon, Menu, Palette, Loader2,
  Lock,
} from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { planLabel, hasStoreAccess } from "@/lib/plans";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import shopboxLogo from "@/assets/shopbox-logo.png";

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
  const { data: store, isLoading: storeLoading, refetch } = useMyStore();
  const location = useLocation();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Redirect /admin → /admin/dashboard
  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [location.pathname, navigate]);

  // Post-checkout flag drives the "Ativando sua loja…" screen below.
  // Realtime subscription in useMyStore() invalidates the query as soon as
  // the Stripe webhook updates the store row, so no polling is needed here.
  const isPostCheckout =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("checkout") === "success";

  if (loading || storeLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!store) {
    return <CreateStoreFallback userId={user.id} email={user.email ?? ""} />;
  }

  // Subscription gate — block access if status is incomplete/canceled/unpaid/inactive
  if (!hasStoreAccess(store)) {
    return (
      <SubscriptionGate
        status={store.subscription_status}
        isPostCheckout={isPostCheckout}
        onRefresh={() => refetch()}
      />
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
            <img src={shopboxLogo} alt="shopbox" className="h-6 w-auto" />
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

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function CreateStoreFallback({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (storeName.trim().length < 2) {
      toast.error("Informe o nome da loja");
      return;
    }
    setBusy(true);
    try {
      // Find a free plan or fall back to first active plan
      const { data: plan } = await supabase
        .from("plans").select("id").eq("slug", "inicial").eq("active", true).maybeSingle();

      // Generate unique slug
      const base = slugify(storeName);
      let slug = base;
      for (let i = 0; i < 10; i++) {
        const { data: exists } = await supabase
          .from("stores").select("id").eq("slug", slug).maybeSingle();
        if (!exists) break;
        slug = `${base}-${i + 2}`;
      }

      const { error } = await supabase.from("stores").insert({
        owner_user_id: userId,
        name: storeName.trim(),
        slug,
        plan_id: plan?.id ?? null,
        subscription_status: "trialing",
        whatsapp: whatsapp.trim(),
      });
      if (error) throw error;
      toast.success("Loja criada com sucesso!");
      await qc.invalidateQueries({ queryKey: ["my-store-full", userId] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar loja");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <StoreIcon className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold">Falta criar sua loja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua conta ({email}) ainda não tem uma loja vinculada. Crie agora em segundos.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="storeName">Nome da loja</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Bella Acessórios"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999998888"
            />
            <p className="text-xs text-muted-foreground">Você pode configurar depois nas configurações.</p>
          </div>
          <Button onClick={handleCreate} disabled={busy} className="w-full" size="lg">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar minha loja"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SubscriptionGate({
  status,
  isPostCheckout,
  onRefresh,
}: {
  status: string | null | undefined;
  isPostCheckout: boolean;
  onRefresh: () => void;
}) {
  const [opening, setOpening] = useState(false);

  if (isPostCheckout && (status === "incomplete" || !status)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
          <h1 className="mt-4 font-display text-xl font-bold">Ativando sua loja…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirmamos seu pagamento. Em alguns segundos seu painel estará liberado.
          </p>
        </div>
      </div>
    );
  }

  async function openPortal() {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/admin/dashboard`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Não foi possível abrir o portal");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao abrir portal");
    } finally {
      setOpening(false);
    }
  }

  const labelByStatus: Record<string, { title: string; desc: string }> = {
    incomplete: {
      title: "Pagamento pendente",
      desc: "Seu cadastro foi criado, mas o pagamento ainda não foi confirmado. Reative sua assinatura para liberar o painel.",
    },
    canceled: {
      title: "Assinatura cancelada",
      desc: "Sua assinatura foi cancelada. Reative para voltar a usar a ShopBox.",
    },
    unpaid: {
      title: "Pagamento em atraso",
      desc: "Não conseguimos cobrar sua assinatura. Atualize sua forma de pagamento para reativar a loja.",
    },
    inactive: {
      title: "Loja inativa",
      desc: "Sua loja está inativa. Reative seu plano para continuar.",
    },
  };
  const info = labelByStatus[status ?? "inactive"] ?? labelByStatus.inactive;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold">{info.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{info.desc}</p>

        <div className="mt-6 space-y-2">
          <Button onClick={openPortal} disabled={opening} className="w-full" size="lg">
            {opening ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo…</>
            ) : (
              "Gerenciar pagamento"
            )}
          </Button>
          <Button variant="outline" onClick={onRefresh} className="w-full">
            Já paguei — atualizar
          </Button>
          <Button variant="ghost" onClick={() => signOut()} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
