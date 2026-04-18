import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { PLAN_LABELS, PLAN_PRICES_CENTS, type PlanSlug } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plano")({
  component: PlanPage,
});

const PLANS: { slug: PlanSlug; features: string[] }[] = [
  { slug: "inicial", features: ["Até 50 produtos", "Carrinho via WhatsApp", "Categorias e banners", "Suporte por e-mail"] },
  { slug: "profissional", features: ["Até 500 produtos", "Cupons e promoções", "Combos (Leve 2, Pague 1)", "Vídeos depoimento", "Popup de boas-vindas", "Suporte prioritário"] },
  { slug: "premium", features: ["Até 5.000 produtos", "Domínio personalizado", "SEO por produto", "Analytics avançado", "Tudo do Profissional", "Suporte VIP"] },
];

function PlanPage() {
  const { data: store } = useMyStore();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  if (!store) return null;
  const currentSlug = store.plan?.slug as PlanSlug | null;

  async function openPortal() {
    setBusy("portal");
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { returnUrl: window.location.href },
      });
      if (error || !data?.url) throw new Error(error?.message || "Erro");
      window.open(data.url, "_blank");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Plano & Cobrança</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Plano atual</p>
            <p className="font-display text-2xl font-bold">{currentSlug ? PLAN_LABELS[currentSlug] : "—"}</p>
            <p className="text-sm text-muted-foreground">Status: {store.subscription_status}</p>
          </div>
          <Button onClick={openPortal} disabled={busy === "portal"} variant="outline">
            {busy === "portal" ? "Abrindo…" : "Gerenciar pagamento"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.slug === currentSlug;
          return (
            <div key={p.slug} className={`rounded-2xl border bg-card p-6 ${isCurrent ? "border-accent ring-2 ring-accent/20" : "border-border"}`}>
              <h3 className="font-display text-xl font-bold">{PLAN_LABELS[p.slug]}</h3>
              <p className="mt-1 text-3xl font-bold">{formatBRL(PLAN_PRICES_CENTS[p.slug] / 100)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}</li>
                ))}
              </ul>
              <Button className="mt-6 w-full" disabled={isCurrent} variant={isCurrent ? "outline" : "default"}>
                {isCurrent ? "Plano atual" : "Fazer upgrade"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Para upgrades/downgrades, use o botão "Gerenciar pagamento" acima — você será redirecionado ao portal seguro.
      </p>
    </div>
  );
}
