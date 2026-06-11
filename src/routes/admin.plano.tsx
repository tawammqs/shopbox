import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import {
  Check, X, ChevronRight, ChevronDown, CheckCircle, CreditCard, FileText,
  ArrowLeft, Receipt,
} from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, type PlanSlug } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plano")({
  head: () => ({ meta: [{ title: "Planos e Cobrança — ShopBox" }] }),
  component: PlanPage,
});

type Tab = "pagamentos" | "planos" | "faturas";
type Period = "mensal" | "trimestral" | "anual";

const PRICES: Record<PlanSlug, Record<Period, number>> = {
  inicial: { mensal: 47, trimestral: 45, anual: 40 },
  profissional: { mensal: 97, trimestral: 92, anual: 82 },
  premium: { mensal: 197, trimestral: 187, anual: 167 },
};

const PLAN_FEATURES: Record<PlanSlug, string[]> = {
  inicial: [
    "Até 200 produtos",
    "Storefront WhatsApp",
    "Carrinho + checkout via WhatsApp",
    "Suporte por e-mail",
  ],
  profissional: [
    "Produtos ilimitados",
    "Tudo do Inicial",
    "Motor de promoções (cupons, combos)",
    "CRM de clientes",
    "Facebook Pixel + Meta Conversion API",
    "Feed XML Meta Catálogo",
  ],
  premium: [
    "Tudo do Profissional",
    "Estatísticas avançadas",
    "Tabela de preços (atacado/varejo)",
    "Domínio próprio",
    "Cupom primeira compra",
    "Perguntas e avaliações",
  ],
};

function PlanPage() {
  const { data: store } = useMyStore();
  const [tab, setTab] = useState<Tab>("pagamentos");

  if (!store) return null;

  return (
    <div className="mx-auto flex max-w-7xl gap-6">
      {/* Inner sidebar */}
      <aside className="hidden w-60 shrink-0 md:block">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827]"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <nav className="space-y-1 rounded-xl border border-gray-200 bg-white p-2">
          <InnerNav active={tab === "pagamentos"} icon={<CreditCard className="h-4 w-4" />} label="Pagamentos" onClick={() => setTab("pagamentos")} />
          <InnerNav active={tab === "planos"} icon={<Receipt className="h-4 w-4" />} label="Planos" onClick={() => setTab("planos")} />
          <InnerNav active={tab === "faturas"} icon={<FileText className="h-4 w-4" />} label="Faturas" onClick={() => setTab("faturas")} />
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {(["pagamentos", "planos", "faturas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                tab === t ? "border-[#25d366] bg-[#25d366]/10 text-[#25d366]" : "border-gray-200 text-[#6b7280]",
              )}
            >
              {t === "pagamentos" ? "Pagamentos" : t === "planos" ? "Planos" : "Faturas"}
            </button>
          ))}
        </div>

        {tab === "pagamentos" && <PagamentosTab store={store} />}
        {tab === "planos" && <PlanosTab currentSlug={store.plan?.slug as PlanSlug | null} />}
        {tab === "faturas" && <FaturasTab />}
      </div>
    </div>
  );
}

function InnerNav({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition",
        active ? "bg-[#f0fdf4] font-medium text-[#25d366]" : "text-[#374151] hover:bg-gray-50",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ────────────────────────────── PAGAMENTOS ────────────────────────────── */
function PagamentosTab({ store }: { store: any }) {
  const [subTab, setSubTab] = useState<"pendentes" | "historico">("pendentes");
  const [busy, setBusy] = useState(false);
  const renewDate = store?.current_period_end
    ? new Date(store.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  async function openPortal() {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { returnUrl: window.location.href },
      });
      if (error || !data?.url) throw new Error(error?.message || "Erro");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Pagamentos</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Tudo sobre pagamentos, assinaturas e vencimentos dos serviços da ShopBox.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { id: "pendentes", label: "Pendentes" },
              { id: "historico", label: "Últimos pagamentos" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition",
                  subTab === t.id ? "border-[#25d366] text-[#25d366]" : "border-transparent text-[#6b7280] hover:text-[#111827]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {subTab === "pendentes" ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d1fae5]">
                <CheckCircle className="h-6 w-6 text-[#059669]" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827]">Sua loja está em dia</h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Você poderá fazer seu próximo pagamento a partir de {renewDate}.
              </p>
              <Button variant="outline" onClick={openPortal} disabled={busy} className="mt-5">
                {busy ? "Abrindo…" : "Continuar"} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-[#6b7280]">
              Histórico de pagamentos aparecerá aqui.
            </div>
          )}
        </div>

        {/* Aside */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-[#111827]">Dados da conta</h4>
            <p className="mt-3 font-medium text-[#111827]">{store.name}</p>
            <a
              href={`/loja/${store.slug}`}
              target="_blank"
              rel="noopener"
              className="mt-1 block text-sm text-[#25d366] hover:underline"
            >
              shopboxapp.com.br/loja/{store.slug}
            </a>
            <Link
              to="/admin/configuracoes"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#25d366] hover:underline"
            >
              ⚙ Dados fiscais
            </Link>
          </div>

          <CouponCard />

          <a
            href="https://ajuda.shopboxapp.com.br"
            target="_blank"
            rel="noopener"
            className="block text-sm text-[#25d366] hover:underline"
          >
            ⓘ Mais sobre pagamentos e assinaturas ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function CouponCard() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-[#111827]">Inserir cupom</span>
        <ChevronRight className={cn("h-4 w-4 text-gray-400 transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o cupom"
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
            />
            <button
              onClick={() => toast.success("Cupom enviado para validação")}
              className="rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── PLANOS ────────────────────────────── */
function PlanosTab({ currentSlug }: { currentSlug: PlanSlug | null }) {
  const [period, setPeriod] = useState<Period>("anual");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Planos</h1>
      </header>

      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
          {(
            [
              { id: "mensal", label: "Mensal" },
              { id: "trimestral", label: "Trimestral", badge: "-5%" },
              { id: "anual", label: "Anual", badge: "-15%" },
            ] as { id: Period; label: string; badge?: string }[]
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
                period === p.id ? "bg-[#111827] text-white" : "text-[#6b7280] hover:text-[#111827]",
              )}
            >
              {p.label}
              {p.badge && (
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", period === p.id ? "bg-[#25d366] text-white" : "bg-[#25d366]/10 text-[#25d366]")}>
                  {p.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(["inicial", "profissional", "premium"] as PlanSlug[]).map((slug) => (
          <PlanCard key={slug} slug={slug} period={period} current={slug === currentSlug} />
        ))}
      </div>

      <ComparisonTable currentSlug={currentSlug} />
    </div>
  );
}

function PlanCard({ slug, period, current }: { slug: PlanSlug; period: Period; current: boolean }) {
  const price = PRICES[slug][period];
  const monthly = PRICES[slug].mensal;
  const annual = price * 12;
  const savings = (monthly - price) * 12;
  const popular = slug === "profissional";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 transition",
        popular ? "border-[#25d366] shadow-lg" : "border-gray-200",
      )}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#25d366] px-3 py-1 text-xs font-semibold text-white">
          Mais escolhido
        </span>
      )}
      <h3 className="text-2xl font-bold text-[#111827]">{PLAN_LABELS[slug]}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-[#111827]">R$ {price}</span>
        <span className="text-sm text-[#6b7280]">/mês</span>
        {period !== "mensal" && (
          <span className="text-sm text-gray-400 line-through">R$ {monthly}</span>
        )}
      </div>
      {period !== "mensal" && (
        <p className="mt-1 text-xs text-[#059669]">
          R$ {annual}/ano · Economize R$ {savings}
        </p>
      )}
      <div className="my-5 border-t border-gray-100" />
      <ul className="space-y-2.5 text-sm text-[#374151]">
        {PLAN_FEATURES[slug].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#25d366]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        disabled={current}
        className={cn(
          "mt-6 h-11 rounded-lg text-sm font-semibold transition",
          current
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : popular
              ? "bg-[#25d366] text-white hover:bg-[#1fb959]"
              : "border border-gray-200 bg-white text-[#111827] hover:bg-gray-50",
        )}
      >
        {current ? "Plano atual" : "Fazer upgrade"}
      </button>
    </div>
  );
}

type Row = { label: string; values: [string | boolean, string | boolean, string | boolean] };
type Category = { label: string; rows: Row[] };

const COMPARISON: Category[] = [
  {
    label: "Produtos",
    rows: [
      { label: "Número de produtos", values: ["200", "Ilimitado", "Ilimitado"] },
      { label: "Categorias", values: [true, true, true] },
      { label: "Variações", values: [true, true, true] },
    ],
  },
  {
    label: "Vendas",
    rows: [
      { label: "Checkout WhatsApp", values: [true, true, true] },
      { label: "Cupons de desconto", values: [false, true, true] },
      { label: "Motor de promoções", values: [false, true, true] },
      { label: "Combos e Leve X Pague Y", values: [false, true, true] },
    ],
  },
  {
    label: "Marketing",
    rows: [
      { label: "Facebook Pixel", values: [false, true, true] },
      { label: "Meta Conversion API", values: [false, true, true] },
      { label: "Feed XML Meta Catálogo", values: [false, true, true] },
      { label: "CRM de clientes", values: [false, true, true] },
    ],
  },
  {
    label: "Gestão",
    rows: [
      { label: "Estatísticas avançadas", values: [false, false, true] },
      { label: "Tabela de preços", values: [false, false, true] },
      { label: "Cupom primeira compra", values: [false, false, true] },
      { label: "Perguntas e avaliações", values: [false, false, true] },
    ],
  },
  {
    label: "Loja",
    rows: [
      { label: "Domínio próprio", values: [false, false, true] },
      { label: "Marketplace de temas", values: [true, true, true] },
    ],
  },
];

function ComparisonTable({ currentSlug }: { currentSlug: PlanSlug | null }) {
  const [filter, setFilter] = useState<"all" | "diff">("all");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(
    Object.fromEntries(COMPARISON.map((c) => [c.label, true])),
  );

  const filteredCats = useMemo(() => {
    if (filter === "all") return COMPARISON;
    return COMPARISON.map((c) => ({
      ...c,
      rows: c.rows.filter((r) => new Set(r.values.map(String)).size > 1),
    })).filter((c) => c.rows.length > 0);
  }, [filter]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#111827]">Comparar planos</h2>
        <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          <button onClick={() => setFilter("all")} className={cn("rounded-full px-3 py-1", filter === "all" && "bg-gray-100 font-medium")}>Ver tudo</button>
          <button onClick={() => setFilter("diff")} className={cn("rounded-full px-3 py-1", filter === "diff" && "bg-gray-100 font-medium")}>Apenas as diferenças</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              <th className="px-4 py-3">Funcionalidade</th>
              {(["inicial", "profissional", "premium"] as PlanSlug[]).map((s) => (
                <th key={s} className={cn("px-4 py-3 text-center", s === currentSlug && "text-[#25d366]")}>{PLAN_LABELS[s]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCats.map((cat) => (
              <Fragment key={cat.label}>
                <tr className="border-t border-gray-100 bg-gray-50/50">
                  <td colSpan={4} className="px-4 py-2">
                    <button
                      onClick={() => setOpenCats((s) => ({ ...s, [cat.label]: !s[cat.label] }))}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#374151]"
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition", !openCats[cat.label] && "-rotate-90")} />
                      {cat.label}
                    </button>
                  </td>
                </tr>
                {openCats[cat.label] &&
                  cat.rows.map((row) => (
                    <tr key={`${cat.label}-${row.label}`} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-[#111827]">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-4 py-3 text-center">
                          {typeof v === "boolean" ? (
                            v ? <Check className="mx-auto h-4 w-4 text-[#25d366]" /> : <X className="mx-auto h-4 w-4 text-[#9ca3af]" />
                          ) : (
                            <span className="text-[#374151]">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ────────────────────────────── FATURAS ────────────────────────────── */
function FaturasTab() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Faturas</h1>
      </header>
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">Nenhuma fatura encontrada</h3>
        <p className="mt-1 text-sm text-[#6b7280]">Suas faturas aparecerão aqui após o primeiro pagamento.</p>
      </div>
    </div>
  );
}
