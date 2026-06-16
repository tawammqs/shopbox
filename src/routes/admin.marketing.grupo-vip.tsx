import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus, useAddonConfig, saveAddonConfig } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";
import { LeadsTable, useLeadsCount } from "@/components/admin/marketing/LeadsTable";

export const Route = createFileRoute("/admin/marketing/grupo-vip")({
  head: () => ({ meta: [{ title: "Grupo VIP — ShopBox" }] }),
  component: Page,
});

type Cfg = {
  active?: boolean;
  whatsapp_group_link?: string;
  section_title?: string;
  description?: string;
  button_text?: string;
  background_color?: string;
  icon_color?: string;
};

function Page() {
  const { data: store } = useMyStore();
  const { data: status, isLoading } = useAddonStatus(store?.id, "grupo_vip");
  const qc = useQueryClient();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("addon_success") === "true") {
      toast.success("Add-on ativado!");
      qc.invalidateQueries({ queryKey: ["store_addon"] });
    }
  }, [qc]);
  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!status?.isActive) return <AddonPaywall addonKey="grupo_vip" />;
  return <Tabs storeId={store!.id} />;
}

function Tabs({ storeId }: { storeId: string }) {
  const [tab, setTab] = useState<"config" | "leads">("config");
  const { data: count = 0 } = useLeadsCount(storeId, "vip_group_leads");
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-[#111827]">Grupo VIP</h1>
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
          table="vip_group_leads"
          columns={["whatsapp", "created_at"]}
          metrics={["total", "week"]}
          searchPlaceholder="Buscar por WhatsApp"
          emptyTitle="Ainda não há leads capturados pelo Grupo VIP."
          emptySubtitle='Quando alguém deixar o WhatsApp na seção "Ofertas Secretas" da sua loja, aparecerá aqui.'
          csvFilenamePrefix="vip_leads"
        />
      )}
    </div>
  );
}

function Config({ storeId }: { storeId: string }) {
  const { data: cfg = {} as Cfg } = useAddonConfig<Cfg>(storeId, "grupo_vip");
  const [form, setForm] = useState<Cfg>(cfg);
  const qc = useQueryClient();
  useEffect(() => { setForm(cfg); }, [cfg]);

  async function save() {
    await saveAddonConfig(storeId, "grupo_vip", form);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["store_addon_config"] });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex items-center justify-between text-sm font-medium">
          Ativar seção na loja
          <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-9" />
        </label>
        <Field label="Link do grupo do WhatsApp" value={form.whatsapp_group_link ?? ""} placeholder="https://chat.whatsapp.com/..." onChange={(v) => setForm({ ...form, whatsapp_group_link: v })} />
        <Field label="Título da seção" value={form.section_title ?? ""} placeholder="Ofertas Secretas" onChange={(v) => setForm({ ...form, section_title: v })} />
        <Field label="Texto descritivo" value={form.description ?? ""} placeholder="novidades, promoções e descontos exclusivos" onChange={(v) => setForm({ ...form, description: v })} />
        <Field label="Texto do botão" value={form.button_text ?? ""} placeholder="Entrar no grupo" onChange={(v) => setForm({ ...form, button_text: v })} />
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Cor de fundo" value={form.background_color ?? "#111111"} onChange={(v) => setForm({ ...form, background_color: v })} />
          <ColorField label="Cor do ícone" value={form.icon_color ?? "#ffffff"} onChange={(v) => setForm({ ...form, icon_color: v })} />
        </div>
      </div>
      <button onClick={save} className="rounded-lg bg-[#25d366] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb959]">Salvar</button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#374151]">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-gray-200" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm" />
      </div>
    </div>
  );
}
