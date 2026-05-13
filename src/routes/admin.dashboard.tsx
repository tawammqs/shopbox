import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Circle, ArrowRight, Sparkles, ChevronDown, ShoppingBag, Clock, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { planLabel, PLAN_LIMITS } from "@/lib/plans";
import { accessTypeOf, trialDaysRemaining, trialHoursRemaining } from "@/lib/access";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

type RangeKey = "7d" | "30d" | "90d" | "all";
const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "Últimos 7 dias", days: 7 },
  { key: "30d", label: "Últimos 30 dias", days: 30 },
  { key: "90d", label: "Últimos 90 dias", days: 90 },
  { key: "all", label: "Todo o período", days: null },
];

function DashboardPage() {
  const { data: store } = useMyStore();
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>("30d");

  const checklistStats = useQuery({
    queryKey: ["admin-checklist-stats", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const sid = store!.id;
      const [products, categories, banners] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", sid),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", sid),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("store_id", sid).eq("active", true),
      ]);
      return {
        productCount: products.count ?? 0,
        categoryCount: categories.count ?? 0,
        bannerCount: banners.count ?? 0,
      };
    },
  });

  const ordersStats = useQuery({
    queryKey: ["admin-orders-stats", store?.id, range],
    enabled: !!store,
    queryFn: async () => {
      const opt = RANGE_OPTIONS.find((r) => r.key === range)!;
      let q = supabase.from("orders").select("id, total, status, created_at").eq("store_id", store!.id);
      if (opt.days !== null) {
        const since = new Date(Date.now() - opt.days * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", since);
      }
      const { data, error } = await q;
      if (error) throw error;
      const orders = data ?? [];
      // Excluir cancelados do faturamento e ticket médio
      const billable = orders.filter((o) => o.status !== "cancelado");
      const revenue = billable.reduce((a, o) => a + Number(o.total ?? 0), 0);
      const total = orders.length;
      const pending = orders.filter((o) => o.status === "aguardando").length;
      const avg = billable.length > 0 ? revenue / billable.length : 0;
      return { total, pending, revenue, avg };
    },
  });

  if (!store) return null;

  const planSlug = store.plan?.slug as any;
  const maxProducts = store.plan?.max_products ?? PLAN_LIMITS.inicial.maxProducts;
  const productCount = checklistStats.data?.productCount ?? 0;
  const productPct = Math.min(100, Math.round((productCount / maxProducts) * 100));

  const checklist = [
    { label: "Configure seu logo", done: !!store.logo_url, to: "/admin/configuracoes" as const },
    { label: "Defina sua cor de destaque", done: store.accent_color !== "#1a6b4a", to: "/admin/configuracoes" as const },
    { label: "Adicione uma categoria", done: (checklistStats.data?.categoryCount ?? 0) > 0, to: "/admin/categorias" as const },
    { label: "Cadastre um produto", done: productCount > 0, to: "/admin/produtos" as const },
    { label: "Configure WhatsApp", done: store.whatsapp.length >= 8, to: "/admin/configuracoes" as const },
    { label: "Adicione um banner", done: (checklistStats.data?.bannerCount ?? 0) > 0, to: "/admin/banners" as const },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const allDone = completed === checklist.length;

  const o = ordersStats.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua loja</p>
      </div>

      {/* Onboarding (collapsible) */}
      <div className="rounded-2xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setChecklistOpen((v) => !v)}
          aria-expanded={checklistOpen}
          aria-controls="onboarding-checklist"
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted/30"
        >
          <div className="flex-1">
            <h2 className="font-display text-base font-semibold">
              {allDone ? "🎉 Sua loja está pronta!" : "Configure sua loja"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {completed} de {checklist.length} concluídos
            </p>
          </div>
          <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-muted sm:block">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(completed / checklist.length) * 100}%` }}
            />
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${checklistOpen ? "rotate-180" : ""}`}
          />
        </button>
        {checklistOpen && (
          <div id="onboarding-checklist" className="border-t border-border p-5 pt-4">
            <ul className="space-y-2">
              {checklist.map((item, i) => (
                <li key={i}>
                  <Link to={item.to} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-muted/50">
                    {item.done ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className={item.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>
                      {item.label}
                    </span>
                    {!item.done && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Período / filtro */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                range === opt.key
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats principais — pedidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStat
          label="Pedidos (filtro)"
          value={(o?.total ?? 0).toString()}
          icon={ShoppingBag}
          loading={ordersStats.isLoading}
        />
        <BigStat
          label="Aguardando"
          value={(o?.pending ?? 0).toString()}
          icon={Clock}
          loading={ordersStats.isLoading}
          highlight={(o?.pending ?? 0) > 0}
        />
        <BigStat
          label="Faturamento"
          value={formatBRL(o?.revenue ?? 0)}
          icon={DollarSign}
          loading={ordersStats.isLoading}
        />
        <BigStat
          label="Ticket médio"
          value={formatBRL(o?.avg ?? 0)}
          icon={TrendingUp}
          loading={ordersStats.isLoading}
        />
      </div>

      {/* Plano + atalhos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-display text-lg font-semibold">Plano {planLabel(planSlug)}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{formatBRL((store.plan?.price_cents ?? 0) / 100)} / mês</p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span>Produtos usados</span>
              <span className="font-medium">{productCount} / {maxProducts}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${productPct >= 90 ? "bg-destructive" : productPct >= 70 ? "bg-amber-500" : "bg-accent"}`}
                style={{ width: `${productPct}%` }}
              />
            </div>
            {productPct >= 90 && (
              <p className="mt-2 text-xs text-destructive">
                ⚠️ Você está perto do limite. Considere fazer upgrade.
              </p>
            )}
          </div>
          <Button asChild className="mt-4" variant="outline" size="sm">
            <Link to="/admin/plano">Fazer upgrade</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Atalhos</h3>
          <div className="mt-3 grid gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/pedidos">Ver pedidos</Link></Button>
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/produtos">+ Novo produto</Link></Button>
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/banners">+ Novo banner</Link></Button>
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/descontos">+ Novo cupom</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  icon: Icon,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  icon: any;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 transition ${
        highlight ? "border-amber-500/50 bg-amber-500/5" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-amber-600" : "text-muted-foreground"}`} />
      </div>
      <p className={`font-display text-3xl font-bold ${highlight ? "text-amber-700 dark:text-amber-300" : ""}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );
}
