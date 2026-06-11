import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/estatisticas/visitas")({
  head: () => ({ meta: [{ title: "Visitas — Estatísticas" }] }),
  component: Page,
});

type Stats = {
  total: number;
  uniqueVisitors: number;
  topPages: { path: string; count: number }[];
  byDevice: { device: string; count: number }[];
  returningPct: number;
};

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const since = new Date(Date.now() - parseInt(range, 10) * 86400000).toISOString();
      const { data } = await supabase
        .from("store_visits")
        .select("path, device, session_id")
        .eq("store_id", store.id)
        .gte("created_at", since)
        .limit(10000);
      const rows = data ?? [];

      const pages = new Map<string, number>();
      const devices = new Map<string, number>();
      const sessionVisits = new Map<string, number>();
      for (const r of rows as any[]) {
        pages.set(r.path, (pages.get(r.path) ?? 0) + 1);
        const dev = r.device || "unknown";
        devices.set(dev, (devices.get(dev) ?? 0) + 1);
        if (r.session_id) sessionVisits.set(r.session_id, (sessionVisits.get(r.session_id) ?? 0) + 1);
      }

      const uniqueVisitors = sessionVisits.size;
      const returningCount = Array.from(sessionVisits.values()).filter((n) => n > 1).length;
      const returningPct = uniqueVisitors > 0 ? (returningCount / uniqueVisitors) * 100 : 0;

      setStats({
        total: rows.length,
        uniqueVisitors,
        topPages: Array.from(pages.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([path, count]) => ({ path, count })),
        byDevice: Array.from(devices.entries()).map(([device, count]) => ({ device, count })),
        returningPct,
      });
    })();
  }, [store?.id, range]);

  const content = (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Visitas</h1>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Visitas totais" value={stats?.total ?? 0} />
        <Card label="Visitantes únicos" value={stats?.uniqueVisitors ?? 0} />
        <Card label="Recorrência" value={`${(stats?.returningPct ?? 0).toFixed(1)}%`} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Top páginas visitadas</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#6b7280]">
              <th className="py-2">Página</th>
              <th className="text-right">Visitas</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.topPages ?? []).length === 0 ? (
              <tr><td colSpan={2} className="py-6 text-center text-xs text-[#9ca3af]">Sem visitas no período</td></tr>
            ) : stats!.topPages.map((p) => (
              <tr key={p.path} className="border-t border-gray-100">
                <td className="py-2 font-mono text-xs">{p.path}</td>
                <td className="text-right">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Ingressos por dispositivo</h3>
        <div className="mt-4 space-y-2">
          {(stats?.byDevice ?? []).length === 0 ? (
            <p className="text-xs text-[#9ca3af]">Sem dados ainda</p>
          ) : stats!.byDevice.map((d) => {
            const pct = stats!.total > 0 ? (d.count / stats!.total) * 100 : 0;
            return (
              <div key={d.device}>
                <div className="flex justify-between text-xs"><span className="capitalize">{d.device}</span><span>{d.count} ({pct.toFixed(0)}%)</span></div>
                <div className="mt-1 h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#25d366]" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Acompanhe tráfego, páginas mais visitadas e dispositivos.">{content}</PremiumLock>;
  return content;
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
