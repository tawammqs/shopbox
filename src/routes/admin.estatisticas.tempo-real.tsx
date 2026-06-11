import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/estatisticas/tempo-real")({
  head: () => ({ meta: [{ title: "Tempo real — Estatísticas" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const [tab, setTab] = useState<"visitantes" | "pedidos">("visitantes");
  const [live, setLive] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);
  const [todayOrders, setTodayOrders] = useState<{ count: number; revenue: number }>({ count: 0, revenue: 0 });

  useEffect(() => {
    if (!store?.id) return;
    let cancelled = false;
    const load = async () => {
      const now = Date.now();
      const fiveMin = new Date(now - 5 * 60 * 1000).toISOString();
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const dayISO = startOfDay.toISOString();

      const [liveRes, dayVisitsRes, dayOrdersRes] = await Promise.all([
        supabase.from("store_visits").select("session_id").eq("store_id", store.id).gte("created_at", fiveMin),
        supabase.from("store_visits").select("id", { count: "exact", head: true }).eq("store_id", store.id).gte("created_at", dayISO),
        supabase.from("orders").select("total_cents").eq("store_id", store.id).gte("created_at", dayISO),
      ]);
      if (cancelled) return;
      const sessions = new Set((liveRes.data ?? []).map((r: any) => r.session_id).filter(Boolean));
      setLive(sessions.size);
      setTodayVisits(dayVisitsRes.count ?? 0);
      const orders = dayOrdersRes.data ?? [];
      setTodayOrders({
        count: orders.length,
        revenue: orders.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0) / 100,
      });
    };
    load();
    const t = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [store?.id]);

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const content = (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Tempo real</h1></header>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Atividade nos últimos 5 minutos</h3>
        <p className="mt-3 text-3xl font-bold text-[#25d366]">{live} {live === 1 ? "visitante" : "visitantes"}</p>
        <p className="text-xs text-[#6b7280]">Atualiza automaticamente a cada 15 segundos.</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Acumulado de hoje</h3>
        <div className="mt-4 flex gap-2 border-b border-gray-200">
          {(["visitantes", "pedidos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("px-3 py-2 text-sm capitalize", tab === t ? "border-b-2 border-[#25d366] text-[#25d366] font-medium" : "text-[#6b7280]")}
            >
              {t === "visitantes" ? "Visitantes" : "Pedidos e Vendas"}
            </button>
          ))}
        </div>
        {tab === "visitantes" ? (
          <div className="mt-4">
            <p className="text-xs text-[#6b7280]">Visitas registradas hoje</p>
            <p className="mt-1 text-3xl font-bold">{todayVisits}</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6b7280]">Pedidos hoje</p>
              <p className="mt-1 text-3xl font-bold">{todayOrders.count}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Receita hoje</p>
              <p className="mt-1 text-3xl font-bold">{fmtBRL(todayOrders.revenue)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Acompanhe visitantes, pedidos e vendas em tempo real.">{content}</PremiumLock>;
  return content;
}
