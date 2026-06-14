import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus, useAddonConfig, saveAddonConfig } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";

export const Route = createFileRoute("/admin/marketing/compre-junto")({
  head: () => ({ meta: [{ title: "Compre Junto — ShopBox" }] }),
  component: Page,
});

type Combo = { trigger_product_id: string; suggested_product_ids: string[]; discount_percent: number };
type Tier = { min_value: number; discount_percent: number };
type Cfg = {
  active?: boolean;
  combos?: Combo[];
  progressive_discount?: { active?: boolean; tiers?: Tier[] };
};

function Page() {
  const { data: store } = useMyStore();
  const { data: status, isLoading } = useAddonStatus(store?.id, "compre_junto");
  const qc = useQueryClient();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("addon_success") === "true") {
      toast.success("Add-on ativado!");
      qc.invalidateQueries({ queryKey: ["store_addon"] });
    }
  }, [qc]);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!status?.isActive) return <AddonPaywall addonKey="compre_junto" />;
  return <Config storeId={store!.id} />;
}

function Config({ storeId }: { storeId: string }) {
  const { data: cfg = {} as Cfg } = useAddonConfig<Cfg>(storeId, "compre_junto");
  const [form, setForm] = useState<Cfg>(cfg);
  const qc = useQueryClient();
  useEffect(() => { setForm(cfg); }, [cfg]);

  const products = useQuery({
    queryKey: ["products_simple_cj", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title").eq("store_id", storeId).order("title");
      return data ?? [];
    },
  });

  async function save() {
    await saveAddonConfig(storeId, "compre_junto", form);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["store_addon_config"] });
  }

  const tiers = form.progressive_discount?.tiers ?? [];

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-[#111827]">Compre Junto</h1>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex items-center justify-between text-sm font-medium">
          Ativar Compre Junto
          <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-9" />
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-[#111827]">Desconto progressivo por valor</h3>
        <label className="flex items-center justify-between text-sm font-medium">
          Ativar
          <input
            type="checkbox"
            checked={!!form.progressive_discount?.active}
            onChange={(e) => setForm({ ...form, progressive_discount: { ...(form.progressive_discount ?? {}), active: e.target.checked } })}
            className="h-5 w-9"
          />
        </label>
        {tiers.map((t, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Acima de R$</label>
              <input
                type="number"
                value={t.min_value}
                onChange={(e) => {
                  const next = [...tiers]; next[i] = { ...t, min_value: Number(e.target.value) };
                  setForm({ ...form, progressive_discount: { ...form.progressive_discount, tiers: next } });
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Desconto %</label>
              <input
                type="number"
                value={t.discount_percent}
                onChange={(e) => {
                  const next = [...tiers]; next[i] = { ...t, discount_percent: Number(e.target.value) };
                  setForm({ ...form, progressive_discount: { ...form.progressive_discount, tiers: next } });
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
              />
            </div>
            <button
              onClick={() => {
                const next = tiers.filter((_, j) => j !== i);
                setForm({ ...form, progressive_discount: { ...form.progressive_discount, tiers: next } });
              }}
              className="rounded p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setForm({ ...form, progressive_discount: { ...form.progressive_discount, tiers: [...tiers, { min_value: 0, discount_percent: 0 }] } })}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#25d366]"
        >
          <Plus className="h-4 w-4" /> Adicionar faixa
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-[#111827]">Combos sugeridos</h3>
        {(form.combos ?? []).map((c, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3">
            <select
              value={c.trigger_product_id}
              onChange={(e) => {
                const next = [...(form.combos ?? [])]; next[i] = { ...c, trigger_product_id: e.target.value };
                setForm({ ...form, combos: next });
              }}
              className="h-10 w-full rounded-lg border border-gray-200 px-2 text-sm"
            >
              <option value="">Produto gatilho</option>
              {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <input
              type="number"
              value={c.discount_percent}
              onChange={(e) => {
                const next = [...(form.combos ?? [])]; next[i] = { ...c, discount_percent: Number(e.target.value) };
                setForm({ ...form, combos: next });
              }}
              placeholder="Desconto % se comprar junto"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
            <button
              onClick={() => setForm({ ...form, combos: (form.combos ?? []).filter((_, j) => j !== i) })}
              className="text-xs text-red-500"
            >
              Remover combo
            </button>
          </div>
        ))}
        <button
          onClick={() => setForm({ ...form, combos: [...(form.combos ?? []), { trigger_product_id: "", suggested_product_ids: [], discount_percent: 10 }] })}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#25d366]"
        >
          <Plus className="h-4 w-4" /> Adicionar combo
        </button>
      </div>

      <button onClick={save} className="rounded-lg bg-[#25d366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb959]">Salvar</button>
    </div>
  );
}
