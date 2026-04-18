import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { HeroMockup } from "@/components/marketing/HeroMockup";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingCart, Tags, Palette, BarChart3, Globe,
  Check, Star, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopBox — Crie sua loja e venda pelo WhatsApp" },
      {
        name: "description",
        content:
          "Plataforma de e-commerce para WhatsApp. Vitrine profissional, cupons, promoções e checkout direto no WhatsApp. A partir de R$47/mês.",
      },
      { property: "og:title", content: "ShopBox — Venda pelo WhatsApp" },
      { property: "og:description", content: "Crie sua loja online e venda pelo WhatsApp em minutos." },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: Package, title: "Produtos ilimitados com variações", desc: "Cores, tamanhos e estoque por combinação. Tudo organizado em poucos cliques." },
  { icon: ShoppingCart, title: "Carrinho com checkout pelo WhatsApp", desc: "Pedido formatado vai direto pro seu WhatsApp com cupom, total e variações." },
  { icon: Tags, title: "Cupons, promoções e combos", desc: "Cupons fixos ou %, promoções por categoria, combos 'Leve 2 Pague 1'." },
  { icon: Palette, title: "Temas profissionais personalizáveis", desc: "Marketplace de temas pra cada nicho. Você escolhe e personaliza." },
  { icon: BarChart3, title: "Gestão de estoque em tempo real", desc: "Matriz cor × tamanho com alerta de estoque baixo automático." },
  { icon: Globe, title: "Domínio personalizado", desc: "Use seu próprio domínio (sualoja.com.br) no plano Premium." },
];

const STEPS = [
  { n: "1", title: "Crie sua conta e escolha seu plano", desc: "Cadastro rápido, 7 dias grátis pra testar tudo." },
  { n: "2", title: "Configure sua loja", desc: "Logo, produtos, categorias, tema e WhatsApp." },
  { n: "3", title: "Compartilhe e venda pelo WhatsApp", desc: "Link da sua loja na bio, story ou anúncio. Pedidos chegam no seu WhatsApp." },
];

const TESTIMONIALS = [
  { name: "Marina S.", store: "Marina Kids", segment: "Moda Infantil", quote: "Triplicou meus pedidos no primeiro mês. Os clientes adoram poder ver tudo antes de mandar mensagem." },
  { name: "Ricardo T.", store: "RT Calçados", segment: "Calçados", quote: "Configurei sozinho em uma tarde. Os cupons salvaram minha Black Friday." },
  { name: "Juliana M.", store: "Bella Acessórios", segment: "Bijuterias", quote: "A função de vídeos de depoimento aumentou demais minha conversão." },
];

type ThemePreview = {
  id: string;
  slug: string;
  name: string;
  preview_desktop_url: string | null;
  is_free: boolean;
  price_cents: number;
};

function LandingPage() {
  const { data: themes } = useQuery({
    queryKey: ["themes-marketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("id, slug, name, preview_desktop_url, is_free, price_cents")
        .eq("status", "approved")
        .order("install_count", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as ThemePreview[];
    },
  });

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-marketing-body)" }}>
      <MarketingHeader />

      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#1ebe57]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
              Plataforma de e-commerce para WhatsApp
            </span>
            <h1
              className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#111827] md:text-6xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Crie sua loja e venda pelo{" "}
              <span className="text-[#25D366]">WhatsApp</span> como uma loja profissional
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[#4b5563]">
              Vitrine profissional, cupons, promoções e checkout direto no WhatsApp dos
              seus clientes. Sem código, sem complicação.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/cadastro"
                className="rounded-full bg-[#25D366] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#25D366]/20 transition hover:bg-[#1ebe57]"
              >
                Testar grátis por 7 dias
              </Link>
              <a
                href="#como-funciona"
                className="rounded-full border-2 border-[#25D366] px-7 py-3 text-base font-semibold text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
              >
                Ver demonstração
              </a>
            </div>
            <p className="mt-5 text-sm text-[#6b7280]">
              ✓ Sem cartão para começar &nbsp;·&nbsp; ✓ Cancele quando quiser &nbsp;·&nbsp; ✓ Suporte via WhatsApp
            </p>
          </div>
          <div className="relative">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-[#e5e7eb] bg-[#f7f8fa] py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm font-medium text-[#6b7280]">
            Mais de <span className="font-bold text-[#111827]">1.200 lojistas</span> já vendem com a gente
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-[#9ca3af]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-5 w-5 text-[#25D366]" /> WhatsApp Business
            </div>
            <div className="text-sm font-semibold">Pagamento Seguro</div>
            <div className="text-sm font-semibold">SSL Grátis</div>
            <div className="text-sm font-semibold">Suporte Dedicado</div>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9/5 lojistas
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Tudo que sua loja precisa, do jeito mais simples
            </h2>
            <p className="mt-4 text-lg text-[#6b7280]">
              Recursos pensados para quem vive do WhatsApp e quer profissionalizar a operação.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-[#e5e7eb] bg-white p-7 transition hover:border-[#25D366] hover:shadow-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0fdf4]">
                    <Icon className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="bg-[#f7f8fa] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Comece a vender em 3 passos
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] font-display text-xl font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-[#6b7280]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THEMES PREVIEW */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2
                className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
                style={{ fontFamily: "var(--font-marketing)" }}
              >
                Temas profissionais para sua loja
              </h2>
              <p className="mt-4 text-lg text-[#6b7280]">Escolha um visual e personalize em minutos.</p>
            </div>
            <Link to="/temas" className="text-sm font-semibold text-[#25D366] hover:text-[#1ebe57]">
              Ver todos os temas →
            </Link>
          </div>
          <div className="mt-10 -mx-6 overflow-x-auto px-6 pb-4 scrollbar-hide">
            <div className="flex gap-5">
              {(themes ?? []).map((t) => (
                <Link
                  key={t.id}
                  to="/temas/$slug"
                  params={{ slug: t.slug }}
                  className="group w-72 shrink-0 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white transition hover:border-[#25D366] hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#f7f8fa]">
                    {t.preview_desktop_url ? (
                      <img src={t.preview_desktop_url} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#9ca3af]">{t.name}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-semibold text-[#111827]">{t.name}</div>
                    <div className="mt-1 text-sm text-[#25D366] font-semibold">
                      {t.is_free ? "Gratuito" : `R$ ${(t.price_cents / 100).toFixed(0)}`}
                    </div>
                  </div>
                </Link>
              ))}
              {!themes?.length && (
                <div className="text-sm text-[#9ca3af]">Carregando temas...</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-[#f7f8fa] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Planos para cada fase do seu negócio
            </h2>
            <p className="mt-4 text-lg text-[#6b7280]">Comece pequeno e cresça sem dor de cabeça.</p>
          </div>
          <div className="mt-14">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Quem usa, recomenda
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl bg-[#f7f8fa] p-7">
                <div className="flex gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-[#374151] leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[#111827]">{t.name}</div>
                    <div className="text-xs text-[#6b7280]">{t.store} · {t.segment}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#f7f8fa] py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2
              className="text-4xl font-extrabold tracking-tight text-[#111827] md:text-5xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              Dúvidas frequentes
            </h2>
          </div>
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#25D366] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2
            className="text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-marketing)" }}
          >
            Pronto para criar sua loja?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Sua loja no ar em menos de 10 minutos. Sem cartão para começar.
          </p>
          <Link
            to="/cadastro"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-base font-bold text-[#25D366] shadow-xl transition hover:bg-[#f7f8fa]"
          >
            Criar minha loja agora — é grátis →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
