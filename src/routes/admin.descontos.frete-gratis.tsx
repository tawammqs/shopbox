import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/descontos/frete-gratis")({
  head: () => ({ meta: [{ title: "Frete grátis — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store, refetch } = useMyStore();
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState<"all" | "categories">("all");
  const [zones, setZones] = useState<"todas" | "especificas">("todas");
  const [combine, setCombine] = useState(false);
  const [threshold, setThreshold] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const rates: any = store?.shipping_rates ?? {};
  const hasRule = !!rates.free_shipping_min_cents;

  useEffect(() => {
    if (rates.free_shipping_min_cents) setThreshold(String(rates.free_shipping_min_cents / 100));
  }, [store?.id]);

  async function save() {
    if (!store) return;
    setSaving(true);
    try {
      const cents = Math.round(parseFloat(threshold.replace(",", ".")) * 100);
      const next: any = store.shipping_rates ?? {};
      next.free_shipping_min_cents = isNaN(cents) ? null : cents;
      const { error } = await supabase.from("stores").update({ shipping_rates: next }).eq("id", store.id);
      if (error) throw error;
      toast.success("Frete grátis salvo");
      setEditing(false);
      await refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!hasRule && !editing) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#25d366]">FRETE GRÁTIS</p>
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-[#111827]">
          Ofereça frete grátis para aumentar suas vendas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#6b7280]">
          Personalize sua oferta de frete grátis: adicione condições e combine com outras
          promoções para aproveitar ao máximo.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#25d366] px-7 text-base font-semibold text-white hover:bg-[#1fb959]"
        >
          Criar frete grátis
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Frete grátis</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Configure as condições para frete grátis.</p>
      </header>

      <Card title="Aplicar a">
        <Pills
          value={scope}
          onChange={(v) => setScope(v as any)}
          options={[
            { v: "all", label: "Toda a loja" },
            { v: "categories", label: "Categorias" },
          ]}
        />
      </Card>

      <Card title="Limites de uso">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={combine} onChange={(e) => setCombine(e.target.checked)} />
          Permitir combinar com outras promoções
        </label>
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-[#6b7280]">Zonas de entrega</p>
          <Pills
            value={zones}
            onChange={(v) => setZones(v as any)}
            options={[
              { v: "todas", label: "Todas" },
              { v: "especificas", label: "Específicas por estado" },
            ]}
          />
        </div>
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-[#6b7280]">Valor do carrinho</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Acima de R$</span>
            <input
              type="text"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="199,90"
              className="h-10 w-40 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setEditing(false)}
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Pills({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            value === o.v ? "bg-[#25d366] text-white" : "text-[#374151] hover:bg-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
