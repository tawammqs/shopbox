import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loja/filtros")({
  head: () => ({ meta: [{ title: "Filtros — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [state, setState] = useState({ show_variations: true, show_brand: true, show_price: true });

  const settings = useQuery({
    queryKey: ["filter_settings", store?.id],
    enabled: !!store?.id,
    queryFn: async () => (await supabase.from("store_filter_settings").select("*").eq("store_id", store!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (settings.data) {
      setState({
        show_variations: settings.data.show_variations,
        show_brand: settings.data.show_brand,
        show_price: settings.data.show_price,
      });
    }
  }, [settings.data]);

  async function toggle(key: keyof typeof state) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    const { error } = await supabase.from("store_filter_settings").upsert({ store_id: store!.id, ...next, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["filter_settings"] });
  }

  const rows: [keyof typeof state, string][] = [
    ["show_variations", "Variações do produto"],
    ["show_brand", "Marca"],
    ["show_price", "Preço"],
  ];

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Filtros</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Escolha quais filtros você quer mostrar na lista de produtos da loja</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {rows.map(([k, l]) => (
            <li key={k} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-[#111827]">{l}</span>
              <input type="checkbox" checked={state[k]} onChange={() => toggle(k)} className="h-5 w-5 accent-[#25d366]" />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-[#111827]">Campos personalizados</h3>
        <div className="mt-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
          <p className="mt-3 text-base font-semibold text-[#111827]">Mostre mais filtros na sua loja</p>
          <p className="mt-1 max-w-md text-sm text-[#6b7280]">Crie campos e transforme-os em filtros para ajudar seus clientes a encontrar o que procuram.</p>
          <a href="#" className="mt-3 text-sm font-medium text-[#25d366] hover:underline">+ Criar campos ↗</a>
        </div>
      </div>
    </div>
  );
}
