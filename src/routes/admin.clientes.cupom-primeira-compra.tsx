import { createFileRoute } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";

export const Route = createFileRoute("/admin/clientes/cupom-primeira-compra")({
  head: () => ({ meta: [{ title: "Cupom Primeira Compra" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const mock = (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-[#111827]">Cupom Primeira Compra</h1><p className="mt-1 text-sm text-[#6b7280]">Ofereça um desconto automático para novos clientes.</p></header>
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div><label className="text-sm font-medium">Percentual de desconto</label><div className="mt-2 h-10 rounded-lg border border-gray-200" /></div>
        <div><label className="text-sm font-medium">Validade</label><div className="mt-2 h-10 rounded-lg border border-gray-200" /></div>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Crie cupons de boas-vindas para novos clientes automaticamente.">{mock}</PremiumLock>;
  return mock;
}
