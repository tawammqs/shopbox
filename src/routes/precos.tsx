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
    <div className="min-h-screen bg-white" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
      <MarketingHeader />

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 px-3.5 py-1 text-[11px] font-medium text-[#25D366]" style={{ fontFamily: "Geist Mono, monospace" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Planos transparentes
          </span>
          <h1
            className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.03em] text-[#0a0f0a] md:text-6xl lg:text-7xl"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            Sem surpresas,<br />sem letras miúdas
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#5a6a5a] leading-relaxed">
            7 dias grátis em todos os planos. Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </section>

      <section className="bg-[#f7faf7] py-20 border-y border-[#e5e7eb]">
        <div className="mx-auto max-w-6xl px-6">
          <PricingCards />
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <span className="text-[11px] font-medium uppercase tracking-[2px] text-[#25D366]" style={{ fontFamily: "Geist Mono, monospace" }}>
              FAQ
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-[#0a0f0a] md:text-5xl" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
              Perguntas frequentes
            </h2>
          </div>
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
