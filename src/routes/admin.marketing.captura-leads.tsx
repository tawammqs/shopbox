import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus, useAddonConfig, saveAddonConfig } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";
import { LeadsTable, useLeadsCount } from "@/components/admin/marketing/LeadsTable";

export const Route = createFileRoute("/admin/marketing/captura-leads")({
  head: () => ({ meta: [{ title: "Captura de Leads — ShopBox" }] }),
  component: Page,
});

type Cfg = {
  active?: boolean;
  discount_percent?: number;
  coupon_code?: string;
  title?: string;
  description?: string;
  ask_birthday?: boolean;
  delay_seconds?: number;
};

function Page() {
  const { data: store } = useMyStore();
  const { data: status, isLoading } = useAddonStatus(store?.id, "captura_leads");
  const qc = useQueryClient();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("addon_success") === "true") {
      toast.success("Add-on ativado!");
      qc.invalidateQueries({ queryKey: ["store_addon"] });
    }
  }, [qc]);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!status?.isActive) return <AddonPaywall addonKey="captura_leads" />;
  return <Tabs storeId={store!.id} />;
}

function Tabs({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<"config" | "leads">("config");
  const { data: count = 0 } = useLeadsCount(storeId, "coupon_leads");
  const { data: cfg = {} as Cfg } = useAddonConfig<Cfg>(storeId, "captura_leads");
  const showBirthday = !!cfg.ask_birthday;

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-[#111827]">Captura de Leads</h1>
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("config")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "config" ? "border-[#25d366] text-[#25d366]" : "border-transparent text-gray-500"
          }`}
        >
          Configuração
        </button>
        <button
          onClick={() => setTab("leads")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "leads" ? "border-[#25d366] text-[#25d366]" : "border-transparent text-gray-500"
          }`}
        >
          Leads captados ({count})
        </button>
      </div>

      {tab === "config" ? (
        <Config storeId={storeId} />
      ) : (
        <LeadsTable
          storeId={storeId}
          table="coupon_leads"
          columns={showBirthday ? ["name", "whatsapp", "birthday", "created_at"] : ["name", "whatsapp", "created_at"]}
          metrics={showBirthday ? ["total", "week", "birthday_month"] : ["total", "week"]}
          searchPlaceholder="Buscar por nome ou WhatsApp"
          emptyTitle="Ainda não há leads capturados."
          emptySubtitle="Quando alguém preencher o formulário do popup de cupom na sua loja, aparecerá aqui."
          csvFilenamePrefix="captura_leads"
        />
      )}
    </div>
  );
}

function Config({ storeId }: { storeId: string }) {
  const { data: cfg = {} as Cfg } = useAddonConfig<Cfg>(storeId, "captura_leads");
  const [form, setForm] = useState<Cfg>(cfg);
  const qc = useQueryClient();
  useEffect(() => { setForm(cfg); }, [cfg]);

  async function save() {
    await saveAddonConfig(storeId, "captura_leads", form);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["store_addon_config"] });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex items-center justify-between text-sm font-medium">
          Ativar popup
          <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-9" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Desconto (%)" value={form.discount_percent ?? 5} onChange={(v) => setForm({ ...form, discount_percent: v })} />
          <Field label="Código do cupom" value={form.coupon_code ?? ""} placeholder="BEMVINDO5" onChange={(v) => setForm({ ...form, coupon_code: v })} />
        </div>
        <Field label="Título" value={form.title ?? ""} placeholder="5% OFF na primeira compra!" onChange={(v) => setForm({ ...form, title: v })} />
        <Field label="Descrição" value={form.description ?? ""} placeholder="Cadastre-se e ganhe desconto" onChange={(v) => setForm({ ...form, description: v })} />
        <label className="flex items-center justify-between text-sm font-medium">
          Pedir data de aniversário
          <input type="checkbox" checked={!!form.ask_birthday} onChange={(e) => setForm({ ...form, ask_birthday: e.target.checked })} className="h-5 w-9" />
        </label>
        <NumField label="Delay para exibir (segundos)" value={form.delay_seconds ?? 3} onChange={(v) => setForm({ ...form, delay_seconds: v })} />
      </div>
      <button onClick={save} className="rounded-lg bg-[#25d366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb959]">Salvar</button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
    </div>
  );
}
