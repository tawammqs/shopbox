import { createFileRoute } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { PremiumLock } from "@/components/admin/PremiumLock";

export const Route = createFileRoute("/admin/produtos/tabela-precos")({
  head: () => ({ meta: [{ title: "Tabela de Preços" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = store?.plan?.slug === "premium";
  const mock = (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-[#111827]">Tabela de Preços</h1></header>
      <div className="rounded-xl border border-gray-200 bg-white p-6 h-64" />
    </div>
  );
  if (!isPremium) return <PremiumLock description="Crie tabelas de preços para grupos de clientes, atacado e promoções.">{mock}</PremiumLock>;
  return mock;
}
