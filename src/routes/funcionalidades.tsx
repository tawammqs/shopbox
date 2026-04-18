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
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-marketing-body)" }}>
      <MarketingHeader />

      <section className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f8f6] px-3 py-1 text-xs font-semibold text-[#00857a]">
            ✨ Funcionalidades
          </span>
          <h1
            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#111827] md:text-6xl"
            style={{ fontFamily: "var(--font-marketing)" }}
          >
            Tudo que sua loja WhatsApp precisa
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[#6b7280]">
            Recursos completos para profissionalizar sua operação — sem precisar de programador, sem complicação.
          </p>
        </div>
      </section>

      {GROUPS.map((g, idx) => (
        <section key={g.title} className={idx % 2 === 0 ? "bg-[#f7f8fa] py-16" : "bg-white py-16"}>
          <div className="mx-auto max-w-6xl px-6">
            <h2
              className="text-3xl font-extrabold text-[#111827] md:text-4xl"
              style={{ fontFamily: "var(--font-marketing)" }}
            >
              {g.title}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.title} className="rounded-2xl border border-[#e5e7eb] bg-white p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f8f6]">
                      <Icon className="h-5 w-5 text-[#00b7a8]" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                      {it.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">{it.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-[#00b7a8] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white md:text-5xl" style={{ fontFamily: "var(--font-marketing)" }}>
            Vamos começar?
          </h2>
          <Link
            to="/cadastro"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-base font-bold text-[#00b7a8] shadow-xl transition hover:bg-[#f7f8fa]"
          >
            Criar minha loja grátis →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
