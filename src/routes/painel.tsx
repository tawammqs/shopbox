import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/painel")({
  head: () => ({ meta: [{ title: "Painel — ShopBox" }] }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: store } = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, name, slug, subscription_status, plan_id")
        .eq("owner_user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-xl font-bold">ShopBox</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold">
          Bem-vindo{store?.name ? `, ${store.name}` : ""}! 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sua conta foi criada com sucesso. Em breve você poderá configurar tudo por aqui.
        </p>

        {store && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Sua loja</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{store.name}</dd>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <dt className="text-muted-foreground">URL</dt>
                <dd className="font-medium">/loja/{store.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status assinatura</dt>
                <dd className="font-medium">{store.subscription_status}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold mb-4">📋 Próximos passos da construção</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="text-amber-600">⏳</span>
              <span>Storefront público em <code>/loja/{store?.slug || "sua-loja"}</code></span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600">⏳</span>
              <span>Painel completo: produtos, categorias, banners, descontos, configurações</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600">⏳</span>
              <span>Checkout via WhatsApp com cupons e promoções</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Continue conversando comigo no chat para construir cada parte!
          </p>
        </div>
      </main>
    </div>
  );
}
