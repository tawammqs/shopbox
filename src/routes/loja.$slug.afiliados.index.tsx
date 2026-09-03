import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront } from "@/components/storefront/StoreContext";
import { AffiliateUnavailable as Unavailable } from "@/components/storefront/AffiliateShare";
import { normalizeAffiliatePageContent, TS_BEIGE, TS_LIME } from "@/lib/affiliates";

export const Route = createFileRoute("/loja/$slug/afiliados/")({
  head: () => ({
    meta: [
      { title: "Programa de Afiliados" },
      { name: "description", content: "Conheça o programa de afiliados: ganhe comissão indicando produtos com seu link personalizado." },
      { property: "og:title", content: "Programa de Afiliados" },
      { property: "og:description", content: "Ganhe comissão indicando produtos com seu link personalizado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AffiliateProgramPage,
});

function AffiliateProgramPage() {
  const { store } = useStorefront();

  const { data, isLoading } = useQuery({
    queryKey: ["affiliate-page-content", store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("affiliate_page_content, affiliate_commission_direct, affiliate_commission_referrer, affiliates_enabled")
        .eq("id", store.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!store.affiliates_enabled) return <Unavailable slug={store.slug} />;

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const c = normalizeAffiliatePageContent(data.affiliate_page_content);
  const direct = Number(data.affiliate_commission_direct ?? store.affiliate_commission_direct);
  const referrer = Number(data.affiliate_commission_referrer ?? store.affiliate_commission_referrer);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-10 text-center">
        {store.logo_url && <img src={store.logo_url} alt={store.name} className="mx-auto mb-6 h-12 object-contain" />}
        <h1 className="mb-2 text-2xl font-bold text-foreground">{c.title}</h1>
        {c.subtitle && (
          <span
            className="inline-block rounded-full px-4 py-1.5 text-sm font-bold text-[#111]"
            style={{ backgroundColor: TS_BEIGE }}
          >
            {c.subtitle}
          </span>
        )}
        {c.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>}
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 text-center text-[#111]" style={{ backgroundColor: TS_BEIGE }}>
          <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: TS_LIME }} />
          <p className="text-4xl font-bold text-[#111]">{direct}%</p>
          <p className="mt-1 text-sm opacity-80">por venda direta</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 text-center text-[#111]" style={{ backgroundColor: `${TS_BEIGE}80` }}>
          <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: TS_BEIGE }} />
          <p className="text-4xl font-bold text-[#111]">{referrer}%</p>
          <p className="mt-1 text-sm text-[#111]/70">por venda da sua rede</p>
        </div>
      </div>

      {c.steps.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Como funciona?</h2>
          <div className="space-y-4">
            {c.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-[#111]"
                  style={{ backgroundColor: TS_BEIGE }}
                >
                  {step.number}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.benefits.length > 0 && (
        <section className="mb-6 rounded-2xl p-5" style={{ backgroundColor: `${TS_BEIGE}40` }}>
          <h2 className="mb-3 text-base font-bold text-foreground">✅ Vantagens de ser afiliado</h2>
          <ul className="space-y-2">
            {c.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="shrink-0 font-bold" style={{ color: TS_LIME }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.payment_text && (
        <section className="mb-6 rounded-xl border border-border p-4">
          <h2 className="mb-2 text-base font-bold text-foreground">💰 Pagamento</h2>
          <p className="text-sm text-muted-foreground">{c.payment_text}</p>
        </section>
      )}

      {c.rules.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-foreground">📋 Regras do programa</h2>
          <ul className="space-y-2">
            {c.rules.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 shrink-0 text-destructive">✗</span>
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky bottom-4">
        <Link
          to="/loja/$slug/afiliados/cadastro"
          params={{ slug: store.slug }}
          className="block w-full rounded-2xl py-4 text-center text-lg font-bold text-[#111] shadow-lg"
          style={{ backgroundColor: TS_LIME }}
        >
          {c.cta_button || "Quero ser afiliado"} →
        </Link>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/loja/$slug/afiliados/login" params={{ slug: store.slug }} style={{ color: TS_LIME }} className="font-semibold underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
