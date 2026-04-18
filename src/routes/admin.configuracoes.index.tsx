import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    custom_domain: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
      if (data) {
        setId(data.id);
        setForm({
          name: data.name ?? "",
          logo_url: data.logo_url ?? "",
          whatsapp: data.whatsapp ?? "",
          instagram: data.instagram ?? "",
          facebook: data.facebook ?? "",
          tiktok: data.tiktok ?? "",
          youtube: data.youtube ?? "",
          custom_domain: data.custom_domain ?? "",
        });
      }
    })();
  }, []);

  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "-")}`;
    const { error } = await supabase.storage.from("logo").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("logo").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      logo_url: form.logo_url || null,
      whatsapp: form.whatsapp,
      instagram: form.instagram || null,
      facebook: form.facebook || null,
      tiktok: form.tiktok || null,
      youtube: form.youtube || null,
      custom_domain: form.custom_domain || null,
    };
    const { error } = id
      ? await supabase.from("store_settings").update(payload).eq("id", id)
      : await supabase.from("store_settings").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    qc.invalidateQueries({ queryKey: ["store_settings"] });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Configurações da loja</h1>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nome da loja</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Logo</label>
          <div className="flex items-center gap-3">
            {form.logo_url && <img src={form.logo_url} alt="" className="h-12 w-auto rounded" />}
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-accent hover:text-accent">
              <Upload className="h-4 w-4" /> Trocar logo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {form.logo_url && (
              <button onClick={() => setForm({ ...form, logo_url: "" })} className="text-sm text-destructive">Remover</button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">WhatsApp (com DDI/DDD, só números)</label>
          <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" className={inputCls} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Instagram URL"><input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputCls} /></Field>
          <Field label="Facebook URL"><input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} className={inputCls} /></Field>
          <Field label="TikTok URL"><input value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} className={inputCls} /></Field>
          <Field label="YouTube URL"><input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} className={inputCls} /></Field>
        </div>

        <Field label="Domínio personalizado (informativo)">
          <input value={form.custom_domain} onChange={(e) => setForm({ ...form, custom_domain: e.target.value })} className={inputCls} />
        </Field>

        <button onClick={save} disabled={saving} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
