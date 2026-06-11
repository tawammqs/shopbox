import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Settings, ChevronRight } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — ShopBox" }] }),
  component: FinanceiroPage,
});

type Payment = {
  id: string;
  order_number: number;
  created_at: string;
  total: number;
  status: string;
  customer: { name: string } | null;
};

const STATE_BADGE: Record<string, { label: string; cls: string }> = {
  entregue:   { label: "Aprovado", cls: "bg-[#d1fae5] text-[#065f46]" },
  confirmado: { label: "Aprovado", cls: "bg-[#d1fae5] text-[#065f46]" },
  enviado:    { label: "Aprovado", cls: "bg-[#d1fae5] text-[#065f46]" },
  aguardando: { label: "Pendente", cls: "bg-[#f3f4f6] text-[#374151]" },
  cancelado:  { label: "Recusado pelo emissor", cls: "bg-[#fee2e2] text-[#991b1b]" },
};

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function FinanceiroPage() {
  const { data: store } = useMyStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total, status, customer:customers(name)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      setPayments((data ?? []) as any);
    })();
  }, [store?.id]);

  const totals = useMemo(() => {
    let available = 0;
    let future = 0;
    for (const p of payments) {
      const ok = ["entregue", "confirmado", "enviado"].includes(p.status);
      if (ok) available += Number(p.total);
      else if (p.status === "aguardando") future += Number(p.total);
    }
    return { available, future };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (p) =>
        String(p.order_number).includes(q) ||
        (p.customer?.name ?? "").toLowerCase().includes(q) ||
        String(p.total).includes(q),
    );
  }, [payments, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Financeiro</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Acompanhe seu saldo e movimentações.</p>
        </div>
        <Link
          to="/admin/configuracoes"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-[#111827] hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" /> Configurar
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Saldo disponível</p>
          <p className="mt-2 text-3xl font-bold text-[#111827]">{fmtBRL(totals.available)}</p>
          <button className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959]">
            Transferir →
          </button>
        </div>
        <button className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Lançamentos futuros</p>
              <p className="mt-2 text-3xl font-bold text-[#111827]">{fmtBRL(totals.future)}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[#111827]">Pagamentos</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tipo, número ou valor do pagamento, nome do cliente"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#25d366]"
            />
          </div>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
            <SlidersHorizontal className="h-4 w-4" /> Filtrar
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#f9fafb] text-left text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Forma de pagamento</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[#6b7280]">Nenhum pagamento.</td></tr>
              ) : filtered.map((p) => {
                const b = STATE_BADGE[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="font-medium text-[#25d366] hover:underline">#{String(p.order_number).padStart(3, "0")}</span></td>
                    <td className="px-4 py-3 text-[#6b7280]">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-[#111827]">{p.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#6b7280]">WhatsApp</td>
                    <td className="px-4 py-3 font-medium text-[#111827]">{fmtBRL(Number(p.total))}</td>
                    <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", b.cls)}>{b.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
