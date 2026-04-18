import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/categorias/")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order");
      return data ?? [];
    },
  });

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const add = async () => {
    if (!name) return;
    const { error } = await supabase.from("categories").insert({
      name,
      slug: slugify(name) + (parentId ? `-${Date.now().toString(36).slice(-4)}` : ""),
      parent_id: parentId || null,
      image_url: imageUrl || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Categoria criada");
    setName(""); setParentId(""); setImageUrl("");
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta categoria? Subcategorias também serão removidas.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria removida");
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const upload = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "-")}`;
    const { error } = await supabase.storage.from("categories").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("categories").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  };

  const top = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold">Categorias</h1>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Adicionar categoria</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">— Categoria principal —</option>
            {top.map((c) => <option key={c.id} value={c.id}>Sub de: {c.name}</option>)}
          </select>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground hover:border-accent hover:text-accent">
            <Upload className="h-4 w-4" />
            {imageUrl ? "Imagem ✓" : "Imagem (opcional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        <button onClick={add} className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {top.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.image_url && <img src={c.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                </div>
              </div>
              <button onClick={() => remove(c.id)} className="grid h-9 w-9 place-items-center text-destructive hover:bg-destructive/10 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {childrenOf(c.id).length > 0 && (
              <div className="mt-3 space-y-1 border-t border-border pt-3">
                {childrenOf(c.id).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between pl-4 text-sm">
                    <span>↳ {sub.name} <span className="text-xs text-muted-foreground">/{sub.slug}</span></span>
                    <button onClick={() => remove(sub.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
