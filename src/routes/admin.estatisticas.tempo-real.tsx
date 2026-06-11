import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/estatisticas/tempo-real")({
  head: () => ({ meta: [{ title: "Tempo real — Estatísticas" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);
  const [tab, setTab] = useState<"visitantes" | "pedidos">("visitantes");

  const content = (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold tracking-tight text-[#111827]">Estatísticas — Tempo real</h1></header>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold">Atividade nos últimos 5 minutos</h3>
        <p className="mt-3 text-3xl font-bold text-[#25d366]">0 visitantes</p>
        <p className="text-xs text-[#6b7280]">Comportamento dos visitantes em tempo real.</p>
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
        <div className="mt-4 text-sm text-[#6b7280]">Conteúdo em breve.</div>
      </div>
    </div>
  );
  if (!isPremium) return <PremiumLock description="Acompanhe visitantes, pedidos e vendas em tempo real.">{content}</PremiumLock>;
  return content;
}
