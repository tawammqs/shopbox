import { createFileRoute } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { PremiumLock } from "@/components/admin/PremiumLock";

export const Route = createFileRoute("/admin/estatisticas/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Estatísticas" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = store?.plan?.slug === "premium";
  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Produtos</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Veja os produtos mais vendidos.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-xs text-[#6b7280]">Produtos vendidos</p><p className="mt-2 text-2xl font-bold">—</p></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-xs text-[#6b7280]">Produtos por vendas</p><p className="mt-2 text-2xl font-bold">—</p></div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Top 50 produtos mais vendidos</h3>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="text-left text-xs text-[#6b7280]"><th className="py-2">Produto</th><th>Vendas</th><th>Receita</th></tr></thead>
          <tbody>{Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="border-t border-gray-100"><td className="py-2">Produto exemplo {i + 1}</td><td>—</td><td>—</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Veja os produtos mais vendidos, ranking de receita e desempenho por categoria.">{content}</PremiumLock>;
  return content;
}
