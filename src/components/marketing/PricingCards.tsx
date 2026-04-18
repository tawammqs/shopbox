import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

export function PricingCards() {
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
      <div className="grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => {
          const highlighted = plan.slug === "profissional";
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl bg-white p-8 ${
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
                <span className="font-display text-5xl font-extrabold text-[#111827]">
                  R${(plan.price_cents / 100).toFixed(0)}
                </span>
                <span className="text-sm text-[#6b7280]">/mês</span>
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
                to="/cadastro"
                className={`mt-8 block w-full rounded-full px-6 py-3 text-center text-sm font-semibold transition ${
                  highlighted
                    ? "bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    : "border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                }`}
              >
                Testar grátis por 7 dias
              </Link>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-[#6b7280]">
        7 dias grátis em todos os planos. Sem cartão de crédito.
      </p>
    </>
  );
}
