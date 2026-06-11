import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Store as StoreIcon, Loader2, Lock } from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { hasStoreAccess } from "@/lib/plans";
import { Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel — ShopBox" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: store, isLoading: storeLoading, error: storeError, refetch } = useMyStore();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

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

  if (storeError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-display text-xl font-bold">Não foi possível carregar sua loja</h1>
          <p className="mt-2 text-sm text-muted-foreground break-words">
            {storeError.message ?? "Erro inesperado"}
          </p>
          <div className="mt-6 space-y-2">
            <Button onClick={() => refetch()} className="w-full" size="lg">Tentar novamente</Button>
            <Button variant="ghost" onClick={() => signOut()} className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return <CreateStoreFallback userId={user.id} email={user.email ?? ""} />;
  }

  if (!hasStoreAccess(store)) {
    return (
      <SubscriptionGate
        status={store.subscription_status}
        isPostCheckout={isPostCheckout}
        onRefresh={() => refetch()}
      />
    );
  }

  return (
    <AdminShell storeId={store.id} storeName={store.name} storeSlug={store.slug}>
      <PaymentTestModeBanner />
      <Outlet />
    </AdminShell>
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
  onRefresh: () => void | Promise<unknown>;
}) {
  const [refreshing, setRefreshing] = useState(false);

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

  const isExpiredTrial = status === "trialing"; // trial flag but window expired
  const title = isExpiredTrial ? "Período de teste encerrado" : "Pagamento pendente";
  const desc = "Assine um plano para continuar usando a ShopBox.";

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
      toast.message("Status atualizado. Se você assinou, seu painel já está liberado.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>

        <div className="mt-6 space-y-2">
          <Button asChild className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90" size="lg">
            <Link to="/admin/plano">Ver planos</Link>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="w-full">
            {refreshing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando…</> : "Já assinei — atualizar"}
          </Button>
          <Button variant="ghost" onClick={() => signOut()} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
