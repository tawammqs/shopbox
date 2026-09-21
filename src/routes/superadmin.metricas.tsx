import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingUp, Users, Store as StoreIcon, AlertCircle, DollarSign, Percent, Calendar, ExternalLink, FileText, Eye, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getBlogMetrics } from "@/lib/blog.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/superadmin/metricas")({
  component: SuperadminMetricasPage,
});

type RangeKey = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };

function SuperadminMetricasPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-metrics", range],
    queryFn: async () => {
      const [storesRes, plansRes] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name, slug, owner_user_id, subscription_status, plan_id, created_at, current_period_end, trial_ends_at, active")
          .order("created_at", { ascending: false }),
        supabase
          .from("plans")
          .select("id, name, slug, price_cents"),
      ]);

      if (storesRes.error) throw storesRes.error;
      if (plansRes.error) throw plansRes.error;

      const stores = storesRes.data ?? [];
      const plans = plansRes.data ?? [];
      const planMap = new Map(plans.map((p) => [p.id, p]));

      const storesInRange = stores.filter((s) => s.created_at >= since);

      const totalStores = stores.length;
      const totalInRange = storesInRange.length;
      const payingStatuses = new Set(["active", "trialing"]);
      const paying = stores.filter((s) => payingStatuses.has(s.subscription_status));
      const payingInRange = storesInRange.filter((s) => payingStatuses.has(s.subscription_status));
      const incomplete = stores.filter((s) => s.subscription_status === "incomplete");
      const canceled = stores.filter((s) => s.subscription_status === "canceled");

      const conversionRate = totalInRange > 0
        ? (payingInRange.length / totalInRange) * 100
        : 0;

      // MRR estimado a partir do plano vinculado (paying = active + trialing, mas trialing não cobra ainda)
      const mrrCents = paying
        .filter((s) => s.subscription_status === "active")
        .reduce((sum, s) => {
          const plan = s.plan_id ? planMap.get(s.plan_id) : null;
          return sum + (plan?.price_cents ?? 0);
        }, 0);

      // Distribuição por plano (ativos)
      const planDist = new Map<string, number>();
      paying.forEach((s) => {
        const plan = s.plan_id ? planMap.get(s.plan_id) : null;
        const name = plan?.name ?? "Sem plano";
        planDist.set(name, (planDist.get(name) ?? 0) + 1);
      });

      return {
        totalStores,
        totalInRange,
        paying: paying.length,
        payingInRange: payingInRange.length,
        active: paying.filter((s) => s.subscription_status === "active").length,
        trialing: paying.filter((s) => s.subscription_status === "trialing").length,
        incomplete,
        canceled: canceled.length,
        conversionRate,
        mrrCents,
        planDist: Array.from(planDist.entries()),
        recent: storesInRange.slice(0, 20),
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Métricas de conversão</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral de cadastros, lojas pagantes e MRR estimado.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label={`Cadastros (${range})`}
              value={data.totalInRange.toString()}
              hint={`${data.totalStores} no total`}
            />
            <StatCard
              icon={StoreIcon}
              label={`Lojas pagantes (${range})`}
              value={data.payingInRange.toString()}
              hint={`${data.paying} no total`}
            />
            <StatCard
              icon={Percent}
              label="Taxa de conversão"
              value={`${data.conversionRate.toFixed(1)}%`}
              hint="cadastros → assinatura"
              accent="text-emerald-600"
            />
            <StatCard
              icon={DollarSign}
              label="MRR estimado"
              value={formatBRL(data.mrrCents / 100)}
              hint={`${data.active} assinaturas ativas`}
              accent="text-emerald-600"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={TrendingUp} label="Em trial" value={data.trialing.toString()} small />
            <StatCard icon={AlertCircle} label="Lojas órfãs (incomplete)" value={data.incomplete.length.toString()} small accent="text-amber-600" />
            <StatCard icon={AlertCircle} label="Canceladas" value={data.canceled.toString()} small accent="text-red-600" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por plano (ativos)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.planDist.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem assinaturas ativas ainda.</p>
              ) : (
                <div className="space-y-2">
                  {data.planDist.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {data.incomplete.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Lojas órfãs — checkout abandonado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Cadastraram-se mas não concluíram o pagamento. Recebem e-mail automático de
                  recuperação 2h após o abandono.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Cadastrada em</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.incomplete.slice(0, 50).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs">{s.slug}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Link
                            to="/superadmin/lojas"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Ver <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <BlogMetricsSection />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cadastros recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem cadastros no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.subscription_status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint, accent, small,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  small?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
        </div>
        <div className={`mt-2 ${small ? "text-2xl" : "text-3xl"} font-bold ${accent ?? ""}`}>
          {value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativa", variant: "default" },
  trialing: { label: "Trial", variant: "secondary" },
  incomplete: { label: "Incompleta", variant: "outline" },
  past_due: { label: "Atrasada", variant: "destructive" },
  canceled: { label: "Cancelada", variant: "destructive" },
  unpaid: { label: "Não paga", variant: "destructive" },
  inactive: { label: "Inativa", variant: "outline" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function BlogMetricsSection() {
  const fetchMetrics = useServerFn(getBlogMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["superadmin-blog-metrics"], queryFn: () => fetchMetrics() });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Métricas do Blog</h2>
        <p className="text-sm text-muted-foreground">Audiência dos artigos e leads captados pelo blog.</p>
      </div>
      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={FileText} label="Artigos publicados" value={data.publishedCount.toString()} />
            <StatCard icon={Eye} label="Visualizações totais" value={data.totalViews.toString()} hint={`${data.views30d} nos últimos 30 dias`} />
            <StatCard icon={MessageCircle} label="Leads do blog" value={data.leads.toString()} hint={`${data.leads30d} nos últimos 30 dias`} accent="text-emerald-600" />
            <StatCard icon={Percent} label="Conversão do blog" value={`${data.conversionRate.toFixed(1)}%`} hint="leads ÷ visualizações" accent="text-emerald-600" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Top 5 artigos mais lidos</CardTitle></CardHeader>
            <CardContent>
              {data.topPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum artigo publicado ainda.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Artigo</TableHead><TableHead className="text-right">Visualizações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.topPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell><div className="font-medium">{post.title}</div><div className="text-xs text-muted-foreground">/blog/{post.slug}</div></TableCell>
                        <TableCell className="text-right font-semibold">{post.view_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
