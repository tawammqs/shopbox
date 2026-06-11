import { createFileRoute } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";

export const Route = createFileRoute("/admin/estatisticas/visitas")({
  head: () => ({ meta: [{ title: "Visitas — Estatísticas" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const content = (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Visitas</h1></header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6"><p className="text-xs text-[#6b7280]">Visitas totais</p><p className="mt-2 text-2xl font-bold">—</p></div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Top páginas visitadas</h3>
        <table className="mt-4 w-full text-sm"><thead><tr className="text-left text-xs text-[#6b7280]"><th className="py-2">Página</th><th>Visitas</th></tr></thead><tbody>{Array.from({ length: 4 }).map((_, i) => (<tr key={i} className="border-t border-gray-100"><td className="py-2">/exemplo-{i + 1}</td><td>—</td></tr>))}</tbody></table>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64"><h3 className="text-base font-semibold">Recorrência de visitantes</h3></div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64"><h3 className="text-base font-semibold">Ingressos por dispositivo</h3></div>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Acompanhe tráfego, páginas mais visitadas e dispositivos.">{content}</PremiumLock>;
  return content;
}
