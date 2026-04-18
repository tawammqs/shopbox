import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners/")({
  component: BannersPage,
});

function BannersPage() {
  const qc = useQueryClient();
  const { data: banners = [] } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").order("display_order");
      return data ?? [];
    },
  });

  const [draft, setDraft] = useState({ title: "", subtitle: "", button_label: "", button_link: "", desktop_url: "", mobile_url: "" });

  const upload = async (file: File, key: "desktop_url" | "mobile_url") => {
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "-")}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    setDraft((d) => ({ ...d, [key]: data.publicUrl }));
  };

  const add = async () => {
    if (!draft.desktop_url && !draft.mobile_url) return toast.error("Adicione ao menos uma imagem");
    const { error } = await supabase.from("banners").insert({ ...draft, display_order: banners.length, active: true });
    if (error) return toast.error(error.message);
    toast.success("Banner criado");
    setDraft({ title: "", subtitle: "", button_label: "", button_link: "", desktop_url: "", mobile_url: "" });
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners", "active"] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("banners").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners", "active"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    qc.invalidateQueries({ queryKey: ["banners", "active"] });
  };

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-bold">Banners</h1>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Novo banner</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Título" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="Subtítulo" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <input value={draft.button_label} onChange={(e) => setDraft({ ...draft, button_label: e.target.value })} placeholder="Texto do botão" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <input value={draft.button_link} onChange={(e) => setDraft({ ...draft, button_link: e.target.value })} placeholder="Link (ex: /categoria/meninos)" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-accent hover:text-accent">
            <Upload className="h-4 w-4" /> {draft.desktop_url ? "Desktop ✓" : "Banner desktop (1920×600)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "desktop_url")} />
          </label>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-accent hover:text-accent">
            <Upload className="h-4 w-4" /> {draft.mobile_url ? "Mobile ✓" : "Banner mobile (800×1000)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "mobile_url")} />
          </label>
        </div>
        <button onClick={add} className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">
          <Plus className="h-4 w-4" /> Criar banner
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-4 p-4 items-center">
              {b.desktop_url && <img src={b.desktop_url} alt="" className="h-24 w-full rounded object-cover md:w-48" />}
              <div>
                <div className="font-semibold">{b.title || "(sem título)"}</div>
                <div className="text-sm text-muted-foreground">{b.subtitle}</div>
                {b.button_link && <div className="text-xs text-accent mt-1">→ {b.button_link}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(b.id, b.active)} className={`rounded-full px-3 py-1 text-xs font-medium ${b.active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {b.active ? "Ativo" : "Inativo"}
                </button>
                <button onClick={() => remove(b.id)} className="grid h-9 w-9 place-items-center rounded text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
