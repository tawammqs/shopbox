import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Circle, Package, FolderTree, AlertTriangle, Image as ImageIcon, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { planLabel, PLAN_LIMITS } from "@/lib/plans";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: store } = useMyStore();

  const stats = useQuery({
    queryKey: ["admin-stats", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const sid = store!.id;
      const [products, lowStock, categories, banners] = await Promise.all([
        supabase.from("products").select("id, low_stock_threshold, product_stock(quantity)", { count: "exact" }).eq("store_id", sid),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", sid),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("store_id", sid).eq("active", true),
        Promise.resolve(null),
      ]);
      const all = products.data ?? [];
      const lowCount = all.filter((p: any) => {
        const total = (p.product_stock ?? []).reduce((s: number, x: any) => s + (x.quantity ?? 0), 0);
        return total > 0 && total <= (p.low_stock_threshold ?? 5);
      }).length;
      return {
        productCount: products.count ?? 0,
        categoryCount: categories.count ?? 0,
        bannerCount: banners?.count ?? 0,
        lowStockCount: lowCount,
      };
    },
  });

  if (!store) return null;

  const planSlug = store.plan?.slug as any;
  const maxProducts = store.plan?.max_products ?? PLAN_LIMITS.inicial.maxProducts;
  const productCount = stats.data?.productCount ?? 0;
  const productPct = Math.min(100, Math.round((productCount / maxProducts) * 100));

  const checklist = [
    { label: "Configure seu logo", done: !!store.logo_url, to: "/admin/configuracoes" as const },
    { label: "Defina sua cor de destaque", done: store.accent_color !== "#1a6b4a", to: "/admin/configuracoes" as const },
    { label: "Adicione uma categoria", done: (stats.data?.categoryCount ?? 0) > 0, to: "/admin/categorias" as const },
    { label: "Cadastre um produto", done: productCount > 0, to: "/admin/produtos" as const },
    { label: "Configure WhatsApp", done: store.whatsapp.length >= 8, to: "/admin/configuracoes" as const },
    { label: "Adicione um banner", done: (stats.data?.bannerCount ?? 0) > 0, to: "/admin/banners" as const },
  ];
  const completed = checklist.filter((c) => c.done).length;
  const allDone = completed === checklist.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua loja</p>
      </div>

      {/* Onboarding */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {allDone ? "🎉 Sua loja está pronta!" : "Configure sua loja"}
            </h2>
            <p className="text-sm text-muted-foreground">{completed} de {checklist.length} concluídos</p>
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-all" style={{ width: `${(completed / checklist.length) * 100}%` }} />
          </div>
        </div>
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
                <span className={item.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>{item.label}</span>
                {!item.done && <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos" value={productCount} icon={Package} sub={`${maxProducts} no seu plano`} />
        <StatCard label="Categorias" value={stats.data?.categoryCount ?? 0} icon={FolderTree} />
        <StatCard label="Estoque baixo" value={stats.data?.lowStockCount ?? 0} icon={AlertTriangle} highlight={(stats.data?.lowStockCount ?? 0) > 0} />
        <StatCard label="Banners ativos" value={stats.data?.bannerCount ?? 0} icon={ImageIcon} />
      </div>

      {/* Plan + product limit */}
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
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/produtos">+ Novo produto</Link></Button>
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/banners">+ Novo banner</Link></Button>
            <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/admin/descontos">+ Novo cupom</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub, highlight }: { label: string; value: number; icon: any; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${highlight ? "border-destructive/50" : "border-border"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <p className={`font-display text-3xl font-bold ${highlight ? "text-destructive" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
