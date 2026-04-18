import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export const Route = createFileRoute("/precos")({
  head: () => ({
    meta: [
      { title: "Preços — ShopBox" },
      { name: "description", content: "Planos a partir de R$47/mês. 7 dias grátis para testar. Cancele quando quiser." },
      { property: "og:title", content: "Preços — ShopBox" },
      { property: "og:description", content: "Planos transparentes para cada fase do seu negócio." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-marketing-body)" }}>
      <MarketingHeader />

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f8f6] px-3 py-1 text-xs font-semibold text-[#00857a]">
            💰 Preços
          </span>
          <h1
            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#111827] md:text-6xl"
            style={{ fontFamily: "var(--font-marketing)" }}
          >
            Planos para cada fase do seu negócio
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#6b7280]">
            Comece pequeno e cresça sem dor de cabeça. Sem comissão por venda.
          </p>
        </div>
      </section>

      <section className="bg-[#f7f8fa] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <PricingCards />
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-[#111827] md:text-4xl" style={{ fontFamily: "var(--font-marketing)" }}>
              Dúvidas frequentes
            </h2>
          </div>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
