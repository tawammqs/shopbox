import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopBox — Crie sua loja online e venda pelo WhatsApp" },
      {
        name: "description",
        content:
          "Plataforma completa para vender pelo WhatsApp. Cupons, promoções, vídeos de depoimentos, pop-ups — tudo sem código. A partir de R$47/mês.",
      },
      { property: "og:title", content: "ShopBox — Venda pelo WhatsApp" },
      { property: "og:description", content: "Crie sua loja online e venda pelo WhatsApp em minutos." },
    ],
  }),
  component: LandingPage,
});

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[];
  display_order: number;
};

const FEATURES = [
  { icon: "🛒", title: "Carrinho WhatsApp", desc: "Pedidos formatados direto no WhatsApp do seu cliente, com cupom e total." },
  { icon: "🏷️", title: "Cupons & Promoções", desc: "Cupons fixos ou %, promoções por categoria, combos 'Leve 2 Pague 1'." },
  { icon: "🎥", title: "Vídeos de Depoimentos", desc: "Mostre clientes reais usando seus produtos, com nota e citação." },
  { icon: "❤️", title: "Wishlist", desc: "Seus clientes salvam favoritos e compartilham listas pelo WhatsApp." },
  { icon: "📦", title: "Estoque por Variação", desc: "Matriz cor × tamanho com alerta de estoque baixo automático." },
  { icon: "🎨", title: "Sua Marca", desc: "Logo, cores, banners desktop+mobile e domínio personalizado (Premium)." },
];

const FAQ = [
  { q: "Preciso de cartão de crédito para começar?", a: "Sim, o cadastro inicia uma assinatura mensal. Você pode cancelar a qualquer momento direto pelo painel." },
  { q: "Como funciona o checkout pelo WhatsApp?", a: "O cliente monta o carrinho na sua loja e ao finalizar é direcionado para uma conversa no seu WhatsApp já com todos os itens, variações, cupom aplicado e total — você só confirma pagamento e entrega." },
  { q: "Posso usar meu próprio domínio?", a: "Sim, no plano Premium você pode conectar seu domínio (sualoja.com.br). Nos outros planos você usa o subdomínio gratuito da plataforma." },
  { q: "Tem limite de produtos?", a: "O plano Inicial permite até 50 produtos. Profissional e Premium são ilimitados." },
  { q: "Qual a diferença para outras plataformas?", a: "ShopBox é desenhada para quem vende pelo WhatsApp: sem gateway de pagamento complexo, sem mensalidade alta — você fala direto com seu cliente e fecha a venda como sempre fez, mas com vitrine profissional." },
];

const TESTIMONIALS = [
  { name: "Marina S.", store: "Marina Kids", quote: "Triplicou meus pedidos no primeiro mês. Os clientes adoram poder ver tudo antes de mandar mensagem." },
  { name: "Ricardo T.", store: "RT Calçados", quote: "Configurei sozinho em uma tarde. Os cupons salvaram minha Black Friday." },
  { name: "Juliana M.", store: "Bella Acessórios", quote: "A função de vídeos de depoimento aumentou demais minha conversão." },
];

function LandingPage() {
  const { data: plans } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, slug, name, price_cents, features, display_order")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-2xl font-bold tracking-tight">ShopBox</div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition">Planos</a>
            <a href="#depoimentos" className="hover:text-foreground transition">Depoimentos</a>
            <a href="#faq" className="hover:text-foreground transition">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              Começar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          ✨ Plataforma feita para o WhatsApp
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Crie sua loja online <br />e venda pelo <span className="italic">WhatsApp</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Vitrine profissional, cupons, promoções, wishlist e checkout direto no WhatsApp
          dos seus clientes. Sem código, sem complicação.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/cadastro"
            className="rounded-full bg-foreground px-8 py-4 text-base font-medium text-background transition hover:opacity-90"
          >
            Começar agora →
          </Link>
          <a
            href="#pricing"
            className="rounded-full border border-border px-8 py-4 text-base font-medium transition hover:bg-muted"
          >
            Ver planos
          </a>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          A partir de R$47/mês · Cancele quando quiser
        </p>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border/50 bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Tudo que você precisa para vender mais
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Recursos pensados para quem vive do WhatsApp e quer profissionalizar a operação.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-md">
                <div className="text-4xl">{f.icon}</div>
                <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Planos para cada momento
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comece pequeno e cresça sem dor de cabeça.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans?.map((plan) => {
              const highlighted = plan.slug === "profissional";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border bg-card p-8 flex flex-col ${
                    highlighted
                      ? "border-foreground ring-2 ring-foreground shadow-xl scale-[1.02]"
                      : "border-border shadow-sm"
                  }`}
                >
                  {highlighted && (
                    <span className="self-start mb-4 inline-block rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                      MAIS POPULAR
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-semibold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="font-display text-5xl font-bold">
                      R$ {(plan.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="text-emerald-600 mt-0.5">✓</span>
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/cadastro"
                    className={`mt-8 block w-full rounded-full px-6 py-3 text-center text-sm font-medium transition ${
                      highlighted
                        ? "bg-foreground text-background hover:opacity-90"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    Começar com {plan.name}
                  </Link>
                </div>
              );
            }) ?? (
              <div className="md:col-span-3 text-center text-muted-foreground">Carregando planos...</div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="border-y border-border/50 bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold md:text-5xl">
              Quem usa, recomenda
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="text-amber-500">★★★★★</div>
                <p className="mt-3 text-foreground/90 italic">"{t.quote}"</p>
                <div className="mt-4 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.store}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold md:text-5xl">Dúvidas frequentes</h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-card p-5 transition open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-medium flex justify-between items-center">
                  {item.q}
                  <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-foreground py-20 text-background">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Pronto para começar a vender?
          </h2>
          <p className="mt-4 text-background/70">
            Sua loja no ar em menos de 10 minutos.
          </p>
          <Link
            to="/cadastro"
            className="mt-8 inline-block rounded-full bg-background px-8 py-4 text-base font-medium text-foreground transition hover:opacity-90"
          >
            Criar minha loja agora →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold">ShopBox</div>
              <p className="mt-2 text-sm text-muted-foreground">
                A plataforma de loja online para o WhatsApp.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div className="space-y-2">
                <div className="font-semibold">Produto</div>
                <a href="#features" className="block text-muted-foreground hover:text-foreground">Funcionalidades</a>
                <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Planos</a>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">Conta</div>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground">Entrar</Link>
                <Link to="/cadastro" className="block text-muted-foreground hover:text-foreground">Cadastro</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} ShopBox. Feito para quem vende pelo WhatsApp.
          </div>
        </div>
      </footer>
    </div>
  );
}
