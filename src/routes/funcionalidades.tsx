import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Package, ShoppingCart, Tags, Palette, BarChart3, Globe,
  Heart, Video, Star, MessageCircle, Bell, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/funcionalidades")({
  head: () => ({
    meta: [
      { title: "Funcionalidades — ShopBox" },
      { name: "description", content: "Conheça todas as funcionalidades do ShopBox: cupons, promoções, vídeos de depoimentos, estoque, temas e checkout WhatsApp." },
      { property: "og:title", content: "Funcionalidades — ShopBox" },
      { property: "og:description", content: "Tudo que sua loja WhatsApp precisa em um só lugar." },
    ],
  }),
  component: FeaturesPage,
});

const GROUPS = [
  {
    title: "Catálogo & Produtos",
    items: [
      { icon: Package, title: "Produtos ilimitados", desc: "Adicione quantos produtos precisar com fotos, descrição rica e SEO." },
      { icon: BarChart3, title: "Estoque por variação", desc: "Matriz cor × tamanho com quantidade individual e alerta de baixo estoque." },
      { icon: Bell, title: "Avise-me quando voltar", desc: "Cliente pede notificação quando produto esgotar — você reativa via painel." },
    ],
  },
  {
    title: "Vendas & Conversão",
    items: [
      { icon: ShoppingCart, title: "Checkout WhatsApp", desc: "Pedido formatado direto no seu WhatsApp com itens, variações, cupom e total." },
      { icon: Tags, title: "Cupons & Promoções", desc: "Cupons fixos ou %, promoções por categoria, combos 'Leve 2 Pague 1'." },
      { icon: Sparkles, title: "Pop-up de boas-vindas", desc: "Cupom automático para primeiros visitantes — converte mais." },
    ],
  },
  {
    title: "Engajamento",
    items: [
      { icon: Heart, title: "Wishlist do cliente", desc: "Visitantes salvam favoritos e podem compartilhar lista pelo WhatsApp." },
      { icon: Video, title: "Vídeos de depoimentos", desc: "YouTube ou MP4 com nota e citação do cliente — aumenta conversão." },
      { icon: Star, title: "Avaliações de produto", desc: "Clientes deixam estrelas e comentários — você modera no painel." },
    ],
  },
  {
    title: "Marca & Personalização",
    items: [
      { icon: Palette, title: "Marketplace de temas", desc: "Temas profissionais para cada nicho. Personalize cores, fontes e seções." },
      { icon: Globe, title: "Domínio personalizado", desc: "Use sualoja.com.br no plano Premium." },
      { icon: MessageCircle, title: "WhatsApp como CTA", desc: "Botão flutuante, compartilhamento de produto, lista pelo WhatsApp." },
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
      <MarketingHeader />

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 px-3.5 py-1 text-[11px] font-medium text-[#25D366]" style={{ fontFamily: "Geist Mono, monospace" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Funcionalidades completas
          </span>
          <h1
            className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.03em] text-[#0a0f0a] md:text-6xl lg:text-7xl"
            style={{ fontFamily: "Geist, system-ui, sans-serif" }}
          >
            Tudo que sua loja<br />WhatsApp precisa
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#5a6a5a] leading-relaxed">
            Recursos completos para profissionalizar sua operação — sem precisar de programador, sem complicação.
          </p>
        </div>
      </section>

      {GROUPS.map((g, idx) => (
        <section key={g.title} className={idx % 2 === 0 ? "bg-[#f7faf7] py-20 border-y border-[#e5e7eb]" : "bg-white py-20"}>
          <div className="mx-auto max-w-6xl px-6">
            <span className="text-[11px] font-medium uppercase tracking-[2px] text-[#25D366]" style={{ fontFamily: "Geist Mono, monospace" }}>
              — {String(idx + 1).padStart(2, "0")}
            </span>
            <h2
              className="mt-3 text-4xl font-black tracking-[-0.02em] text-[#0a0f0a] md:text-5xl"
              style={{ fontFamily: "Geist, system-ui, sans-serif" }}
            >
              {g.title}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.title} className="rounded-2xl border border-[#e5e7eb] bg-white p-7 transition hover:border-[#25D366]/40 hover:shadow-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                      <Icon className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#0a0f0a]" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
                      {it.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5a6a5a]">{it.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-[#25D366] py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(255,255,255,.18) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-5xl font-black tracking-[-0.02em] text-white md:text-6xl" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
            Pronto para criar<br />sua loja?
          </h2>
          <p className="mt-4 text-base text-white/85" style={{ fontFamily: "Geist Mono, monospace" }}>
            Mais de 12.000 lojistas já vendem pelo WhatsApp
          </p>
          <Link
            to="/cadastro"
            className="mt-10 inline-block rounded-full bg-white px-9 py-4 text-base font-bold text-[#25D366] shadow-xl transition hover:-translate-y-0.5"
          >
            Testar grátis por 7 dias
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
