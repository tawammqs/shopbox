import { createFileRoute } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { PremiumLock } from "@/components/admin/PremiumLock";

export const Route = createFileRoute("/admin/estatisticas/vendas")({
  head: () => ({ meta: [{ title: "Vendas e clientes — Estatísticas" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = store?.plan?.slug === "premium";
  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Vendas e clientes</h1>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Pedidos criados", "Receita", "Ticket médio"].map((l) => (
          <div key={l} className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-xs text-[#6b7280]">{l}</p><p className="mt-2 text-2xl font-bold">—</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64"><h3 className="text-base font-semibold">Pedidos por status de pagamento</h3></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64"><h3 className="text-base font-semibold">Clientes (novos vs recorrentes)</h3></div>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Analise vendas por status, novos vs recorrentes, e métricas detalhadas.">{content}</PremiumLock>;
  return content;
}
