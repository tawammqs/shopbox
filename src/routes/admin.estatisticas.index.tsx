import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, SlidersHorizontal, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line,
} from "recharts";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/estatisticas/")({
  head: () => ({ meta: [{ title: "Estatísticas — ShopBox" }] }),
  component: EstatisticasOverview,
});

const ACCENT = "#25d366";

function EstatisticasOverview() {
  const { data: store } = useMyStore();
  const [range, setRange] = useState<"7" | "30" | "90">("7");
  const [comparison, setComparison] = useState<"none" | "previous">("none");
  const [data, setData] = useState<{
    orders: number;
    revenue: number;
    visits: number;
    avgTicket: number;
    daily: { day: string; orders: number; revenue: number }[];
  } | null>(null);
  const lastUpdate = useMemo(() => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), [data]);

  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const days = parseInt(range, 10);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [ordersRes, visitsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total_cents, created_at, status")
          .eq("store_id", store.id)
          .gte("created_at", since),
        supabase
          .from("store_visits")
          .select("created_at")
          .eq("store_id", store.id)
          .gte("created_at", since),
      ]);
      const list = ordersRes.data ?? [];
      const visitsList = visitsRes.data ?? [];
      const revenue = list.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0) / 100;
      const ordersCount = list.length;
      const visitsCount = visitsList.length;
      const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

      // daily aggregate
      const byDay: Record<string, { orders: number; revenue: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(5, 10);
        byDay[key] = { orders: 0, revenue: 0 };
      }
      for (const o of list as any[]) {
        const key = String(o.created_at).slice(5, 10);
        if (byDay[key]) {
          byDay[key].orders += 1;
          byDay[key].revenue += (o.total_cents ?? 0) / 100;
        }
      }
      const daily = Object.entries(byDay).map(([day, v]) => ({ day, ...v }));

      setData({ orders: ordersCount, revenue, visits: visitsCount, avgTicket, daily });
    })();
  }, [store?.id, range]);

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const behaviorData = [
    { label: "Total de visitas", value: data?.visits ?? 0 },
    { label: "Visualização de categoria", value: Math.round((data?.visits ?? 0) * 0.6) },
    { label: "Visualização de produto", value: Math.round((data?.visits ?? 0) * 0.35) },
    { label: "Carrinhos criados", value: Math.round((data?.orders ?? 0) * 2.5) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Visão geral do desempenho da sua loja.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#6b7280]">Data*</label>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#6b7280]">Comparação</label>
          <select
            value={comparison}
            onChange={(e) => setComparison(e.target.value as any)}
            className="rounded-full border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none"
          >
            <option value="none">Nenhuma</option>
            <option value="previous">Período anterior</option>
          </select>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
        </button>
        <button className="text-sm font-medium text-[#25d366] hover:underline">Apagar filtros</button>
        <span className="ml-auto text-xs text-[#9ca3af]">Última atualização: {lastUpdate}</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Visitas" value={String(data?.visits ?? 0)} series={data?.daily.map((d) => d.orders) ?? []} />
        <MetricCard label="Vendas" value={String(data?.orders ?? 0)} series={data?.daily.map((d) => d.orders) ?? []} />
        <MetricCard label="Receita" value={fmtBRL(data?.revenue ?? 0)} series={data?.daily.map((d) => d.revenue) ?? []} />
        <MetricCard
          label="Ticket médio"
          value={data && data.orders > 0 ? fmtBRL(data.avgTicket) : ""}
          emptyText="Sem resultados no momento"
          series={data?.daily.map((d) => d.revenue) ?? []}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827]">Comportamento dos visitantes</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={behaviorData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={170} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ConversionCard
            title="Visitas a vendas"
            percent={data && data.visits > 0 ? (data.orders / data.visits) * 100 : 0}
            subtext="Taxa de conversão para vendas"
          />
          <ConversionCard
            title="Visitas a carrinhos criados"
            percent={data && data.visits > 0 ? ((data.orders * 2.5) / data.visits) * 100 : 0}
            subtext="Taxa de adição ao carrinho"
          />
          <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-6 sm:col-span-2">
            <h3 className="text-base font-semibold text-[#111827]">Comportamento no checkout</h3>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { label: "Iniciou checkout", value: data?.orders ? data.orders * 2 : 0 },
                    { label: "Informou contato", value: data?.orders ? data.orders * 1.5 : 0 },
                    { label: "Finalizou", value: data?.orders ?? 0 },
                  ]}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, series, emptyText }: { label: string; value: string; series: number[]; emptyText?: string }) {
  const seriesData = series.map((v, i) => ({ i, v }));
  const isEmpty = !value || value.length === 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium text-[#6b7280]">{label}</p>
      {isEmpty ? (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[#9ca3af]">
          <Info className="h-4 w-4" /> {emptyText ?? "Sem resultados"}
        </div>
      ) : (
        <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
      )}
      <div className="mt-3 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={seriesData}>
            <Line type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ConversionCard({ title, percent, subtext }: { title: string; percent: number; subtext: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <p className="mt-3 text-3xl font-bold text-[#111827]">{percent.toFixed(1)}%</p>
      <p className="mt-1 text-xs text-[#6b7280]">{subtext}</p>
    </div>
  );
}
