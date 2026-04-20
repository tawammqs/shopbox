import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[];
  display_order: number;
};

const TAGLINES: Record<string, string> = {
  inicial: "Para quem está começando",
  profissional: "Para quem quer vender mais",
  premium: "Para uma loja completa e profissional",
};

// Annual pricing config (in cents)
const ANNUAL_PRICING: Record<string, { yearlyTotal: number; monthlyEquivalent: number; savings: number }> = {
  inicial: { yearlyTotal: 45600, monthlyEquivalent: 3800, savings: 10800 },
  profissional: { yearlyTotal: 93600, monthlyEquivalent: 7800, savings: 22800 },
  premium: { yearlyTotal: 189600, monthlyEquivalent: 15800, savings: 46800 },
};

const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Math.round(cents / 100),
  );

export function PricingCards() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const isYearly = billing === "yearly";

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans-public-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, slug, name, price_cents, features, display_order")
        .eq("active", true)
        .in("slug", ["inicial", "profissional", "premium"])
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[480px] animate-pulse rounded-2xl border border-[#e5e7eb] bg-white" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Billing toggle */}
      <div className="mb-10 flex items-center justify-center gap-4">
        <span
          className={`text-sm font-medium transition-colors ${
            !isYearly ? "text-[#0a0f0a]" : "text-[#6b7280]"
          }`}
        >
          Mensal
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isYearly}
          aria-label="Alternar entre cobrança mensal e anual"
          onClick={() => setBilling(isYearly ? "monthly" : "yearly")}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 ${
            isYearly ? "bg-[#25D366]" : "bg-[#e5e7eb]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
              isYearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            isYearly ? "text-[#0a0f0a]" : "text-[#6b7280]"
          }`}
        >
          Anual
        </span>
        <span className="inline-flex items-center rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[11px] font-semibold text-[#27500A]">
          2 meses grátis
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => {
          const highlighted = plan.slug === "profissional";
          const annual = ANNUAL_PRICING[plan.slug];
          const displayCents = isYearly && annual ? annual.monthlyEquivalent : plan.price_cents;

          const isPremium = plan.slug === "premium";
          const ctaLabel = isYearly && isPremium ? "Falar com consultor" : "Testar grátis por 7 dias";
          const ctaTo = isYearly && isPremium ? "/contato" : "/cadastro";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl bg-white p-8 transition-all duration-200 ${
                highlighted
                  ? "border-2 border-[#25D366] shadow-xl md:scale-105"
                  : "border border-[#e5e7eb] shadow-sm"
              }`}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#25D366] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                  Mais Popular
                </span>
              )}
              <h3 className="font-display text-2xl font-bold text-[#111827]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[#6b7280]">{TAGLINES[plan.slug] ?? ""}</p>
              <div className="mt-5">
                <span className="font-display text-5xl font-extrabold text-[#111827] transition-all duration-200">
                  R${formatBRL(displayCents)}
                </span>
                <span className="text-sm text-[#6b7280]">/mês</span>
              </div>

              {/* Annual savings line */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isYearly && annual ? "mt-2 max-h-10 opacity-100" : "max-h-0 opacity-0"
                }`}
                aria-hidden={!isYearly}
              >
                {annual && (
                  <p className="text-[12px] font-medium text-[#3B6D11]">
                    R${formatBRL(annual.yearlyTotal)}/ano · economize R${formatBRL(annual.savings)}
                  </p>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
                    <span className="text-[#374151]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={ctaTo}
                className={`mt-8 block w-full rounded-full px-6 py-3 text-center text-sm font-semibold transition ${
                  highlighted
                    ? "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    : "border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                }`}
              >
                {ctaLabel}
              </Link>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-[#6b7280] transition-opacity duration-200">
        {isYearly
          ? "Cobrança anual antecipada · sem cartão de crédito · reembolso em até 7 dias"
          : "7 dias grátis em todos os planos · sem cartão de crédito · cancele quando quiser"}
      </p>
    </>
  );
}
