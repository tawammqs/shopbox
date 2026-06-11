import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — ShopBox" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: store } = useMyStore();
  const [totals, setTotals] = useState<{ total: number; orders: number; pending: number } | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("total_cents, status")
        .eq("store_id", store.id);
      const list = data ?? [];
      const total = list.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0) / 100;
      const pending = list.filter((o: any) => o.status === "pending").length;
      setTotals({ total, orders: list.length, pending });
    })();
  }, [store?.id]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Financeiro</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Resumo financeiro da sua loja.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Receita total" value={fmt(totals?.total ?? 0)} icon={<DollarSign className="h-4 w-4 text-[#25d366]" />} />
        <Card label="Pedidos" value={String(totals?.orders ?? 0)} />
        <Card label="Pedidos pendentes" value={String(totals?.pending ?? 0)} />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-[#6b7280]">
        Para detalhes por pedido, acesse a <Link to="/admin/pedidos" className="font-medium text-[#25d366] hover:underline">lista de vendas</Link>.
      </div>
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2"><span className="text-xs font-medium text-[#6b7280]">{label}</span>{icon}</div>
      <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
    </div>
  );
}
