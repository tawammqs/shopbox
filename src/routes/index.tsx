import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopBox — Crie sua loja online e venda pelo WhatsApp" },
      {
        name: "description",
        content:
          "Plataforma SaaS para criar sua loja virtual em minutos com checkout via WhatsApp, cupons, promoções e muito mais.",
      },
      { property: "og:title", content: "ShopBox — Venda pelo WhatsApp" },
      {
        property: "og:description",
        content: "Crie sua loja online e venda pelo WhatsApp em minutos.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-2xl font-bold tracking-tight">
            ShopBox
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Planos
            </a>
            <a href="#faq" className="hover:text-foreground">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Entrar
            </button>
            <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90">
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          Em breve · Plataforma multi-loja
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold leading-tight md:text-7xl">
          Crie sua loja online <br />e venda pelo WhatsApp
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sem código, sem cartão de crédito para começar. Seus produtos, seus
          cupons, seu jeito — checkout direto no WhatsApp dos seus clientes.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90">
            Começar grátis
          </button>
          <button className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted">
            Ver demonstração
          </button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          🚧 Construção em andamento — landing, cadastro e painel chegam nos
          próximos passos.
        </p>
      </section>

      {/* Quick status card */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="font-display text-2xl font-semibold">
            Status da construção
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                ✓
              </span>
              <span>
                Banco multi-loja criado (lojas, produtos, cupons, promoções,
                reviews, vídeos, planos…)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                ✓
              </span>
              <span>Regras de acesso por loja (RLS) e segurança aplicadas</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                ⏳
              </span>
              <span>
                Próximo passo: ativar Stripe + cadastro/login + storefront
                multi-loja em <code>/loja/[slug]</code>
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
