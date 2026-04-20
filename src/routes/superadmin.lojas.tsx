import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Calendar,
  Power,
  PowerOff,
  CreditCard,
  Bell,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/lojas")({
  component: SuperadminLojasPage,
});

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  owner_user_id: string;
  custom_domain: string | null;
  whatsapp: string;
  plans: { name: string; slug: string; price_cents: number } | null;
};

const STATUS_META: Record<
  string,
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  trialing: { label: "Trial", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300", icon: Clock },
  active: { label: "Ativa", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  past_due: { label: "Atrasada", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: AlertCircle },
  canceled: { label: "Cancelada", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: XCircle },
  incomplete: { label: "Incompleta", tone: "bg-muted text-muted-foreground", icon: AlertCircle },
  unpaid: { label: "Não paga", tone: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: XCircle },
  inactive: { label: "Inativa", tone: "bg-muted text-muted-foreground", icon: XCircle },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function SuperadminLojasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [openingPortal, setOpeningPortal] = useState<string | null>(null);

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("stores").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? "Loja reativada" : "Loja suspensa");
      qc.invalidateQueries({ queryKey: ["sa-stores"] });
      qc.invalidateQueries({ queryKey: ["sa-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openCustomerPortal(storeId: string) {
    setOpeningPortal(storeId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-portal-session", {
        body: {
          storeId,
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/superadmin/lojas`,
        },
      });
      if (error || !data?.url) {
        throw new Error(error?.message || data?.error || "Não foi possível abrir o portal");
      }
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpeningPortal(null);
    }
  }

  const storesQ = useQuery({
    queryKey: ["sa-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select(
          "id, name, slug, active, subscription_status, trial_ends_at, current_period_end, created_at, owner_user_id, custom_domain, whatsapp, plans(name, slug, price_cents)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as StoreRow[];
    },
  });

  const stores = storesQ.data ?? [];

  const stats = useMemo(() => {
    const paying = stores.filter(
      (s) => s.subscription_status === "active" || s.subscription_status === "past_due",
    );
    const mrrCents = paying.reduce((sum, s) => sum + (s.plans?.price_cents ?? 0), 0);
    const trialing = stores.filter((s) => s.subscription_status === "trialing").length;
    const churned = stores.filter(
      (s) => s.subscription_status === "canceled" || s.subscription_status === "unpaid",
    ).length;
    const expiringSoon = stores.filter((s) => {
      const ref = s.subscription_status === "trialing" ? s.trial_ends_at : s.current_period_end;
      const d = daysUntil(ref);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    return {
      total: stores.length,
      mrrCents,
      arrCents: mrrCents * 12,
      activeCount: paying.length,
      trialing,
      churned,
      expiringSoon,
    };
  }, [stores]);

  const planOptions = useMemo(() => {
    const set = new Map<string, string>();
    stores.forEach((s) => {
      if (s.plans) set.set(s.plans.slug, s.plans.name);
    });
    return Array.from(set.entries());
  }, [stores]);

  // Histórico de MRR dos últimos 6 meses (estimado a partir da data de criação das lojas pagantes)
  const mrrHistory = useMemo(() => {
    const months: { label: string; date: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        date: d,
      });
    }
    return months.map(({ label, date }) => {
      // No fim do mês de referência
      const refEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const cents = stores
        .filter((s) => {
          const created = new Date(s.created_at);
          if (created > refEnd) return false;
          // Considerar pagantes naquele momento (aproximação: estado atual aplicado retroativo
          // se já havia sido criada antes do mês de referência)
          return s.subscription_status === "active" || s.subscription_status === "past_due";
        })
        .reduce((sum, s) => sum + (s.plans?.price_cents ?? 0), 0);
      return { month: label, mrr: cents / 100 };
    });
  }, [stores]);


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      if (statusFilter !== "all" && s.subscription_status !== statusFilter) return false;
      if (planFilter !== "all" && s.plans?.slug !== planFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.custom_domain ?? "").toLowerCase().includes(q) ||
        s.whatsapp.toLowerCase().includes(q)
      );
    });
  }, [stores, search, statusFilter, planFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lojas & MRR</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada de todos os clientes Shopbox.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MRR (Receita Mensal)"
          value={formatBRL(stats.mrrCents / 100)}
          hint={`ARR ${formatBRL(stats.arrCents / 100)}`}
          icon={TrendingUp}
          accent="text-emerald-600"
        />
        <KpiCard
          label="Lojas pagantes"
          value={String(stats.activeCount)}
          hint={`de ${stats.total} totais`}
          icon={CheckCircle2}
          accent="text-blue-600"
        />
        <KpiCard
          label="Em trial"
          value={String(stats.trialing)}
          hint="Conversões pendentes"
          icon={Users}
          accent="text-violet-600"
        />
        <KpiCard
          label="Expiram em 7 dias"
          value={String(stats.expiringSoon)}
          hint={`${stats.churned} canceladas`}
          icon={AlertCircle}
          accent="text-amber-600"
        />
      </div>

      {/* Gráfico MRR últimos 6 meses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do MRR (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrHistory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v: number) => formatBRL(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [formatBRL(v), "MRR"]}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#mrrGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas as lojas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, slug, domínio ou WhatsApp"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {planOptions.map(([slug, name]) => (
                  <SelectItem key={slug} value={slug}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {storesQ.isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma loja encontrada com esses filtros.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loja</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const meta = STATUS_META[s.subscription_status] ?? STATUS_META.inactive;
                    const Icon = meta.icon;
                    const expiryRef =
                      s.subscription_status === "trialing"
                        ? s.trial_ends_at
                        : s.current_period_end;
                    const days = daysUntil(expiryRef);
                    const expiryUrgent = days !== null && days <= 7 && days >= 0;
                    const mrrCents =
                      s.subscription_status === "active" || s.subscription_status === "past_due"
                        ? (s.plans?.price_cents ?? 0)
                        : 0;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            /{s.slug}
                            {s.custom_domain && ` · ${s.custom_domain}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.plans ? (
                            <div>
                              <div className="text-sm font-medium">{s.plans.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatBRL(s.plans.price_cents / 100)}/mês
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={meta.tone}>
                            <Icon className="mr-1 h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(expiryRef)}
                          </div>
                          {days !== null && (
                            <div
                              className={`text-xs ${
                                days < 0
                                  ? "text-rose-600"
                                  : expiryUrgent
                                    ? "text-amber-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {days < 0
                                ? `Expirou há ${Math.abs(days)}d`
                                : days === 0
                                  ? "Expira hoje"
                                  : `${days}d restantes`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mrrCents > 0 ? formatBRL(mrrCents / 100) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(s.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant={s.active ? "outline" : "default"}
                              onClick={() =>
                                toggleActive.mutate({ id: s.id, active: !s.active })
                              }
                              disabled={toggleActive.isPending}
                              className="h-7 text-xs"
                            >
                              {s.active ? (
                                <>
                                  <PowerOff className="mr-1 h-3 w-3" /> Suspender
                                </>
                              ) : (
                                <>
                                  <Power className="mr-1 h-3 w-3" /> Reativar
                                </>
                              )}
                            </Button>
                            <Link
                              to="/loja/$slug"
                              params={{ slug: s.slug }}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              Visitar <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof TrendingUp;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          </div>
          <div className={`rounded-lg bg-muted p-2 ${accent ?? "text-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
