import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus, useAddonConfig, saveAddonConfig } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";

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
  return <Config storeId={store!.id} />;
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
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-[#111827]">Grupo VIP</h1>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex items-center justify-between text-sm font-medium">
          Ativar seção na loja
          <input type="checkbox" checked={!!form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-9" />
        </label>
        <Field label="Link do grupo do WhatsApp" value={form.whatsapp_group_link ?? ""} placeholder="https://chat.whatsapp.com/..." onChange={(v) => setForm({ ...form, whatsapp_group_link: v })} />
        <Field label="Título da seção" value={form.section_title ?? ""} placeholder="Ofertas Secretas" onChange={(v) => setForm({ ...form, section_title: v })} />
        <Field label="Texto descritivo" value={form.description ?? ""} placeholder="novidades, promoções e descontos exclusivos" onChange={(v) => setForm({ ...form, description: v })} />
        <Field label="Texto do botão" value={form.button_text ?? ""} placeholder="Entrar no grupo" onChange={(v) => setForm({ ...form, button_text: v })} />
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
