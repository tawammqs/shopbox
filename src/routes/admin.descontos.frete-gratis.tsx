import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/descontos/frete-gratis")({
  head: () => ({ meta: [{ title: "Frete grátis" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const [threshold, setThreshold] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const rates: any = store.shipping_rates ?? {};
    if (rates.free_shipping_min_cents) setThreshold(String(rates.free_shipping_min_cents / 100));
  }, [store?.id]);

  async function save() {
    if (!store) return;
    setSaving(true);
    try {
      const cents = Math.round(parseFloat(threshold.replace(",", ".")) * 100);
      const rates: any = store.shipping_rates ?? {};
      rates.free_shipping_min_cents = isNaN(cents) ? null : cents;
      const { error } = await supabase.from("stores").update({ shipping_rates: rates }).eq("id", store.id);
      if (error) throw error;
      toast.success("Frete grátis atualizado");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Frete grátis</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Defina um valor mínimo de compra para frete grátis.</p>
      </header>
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-[#111827]">Valor mínimo (R$)</label>
          <input
            type="text"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Ex: 199,90"
            className="mt-2 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#25d366]"
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
