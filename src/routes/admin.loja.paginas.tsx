import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loja/paginas")({
  head: () => ({ meta: [{ title: "Páginas — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useQuery({
    queryKey: ["static_pages", store?.id],
    enabled: !!store?.id,
    queryFn: async () => (await supabase.from("static_pages").select("*").eq("store_id", store!.id).order("updated_at", { ascending: false })).data ?? [],
  });

  const items = list.data ?? [];

  if (editing || creating) {
    return <PageForm editing={editing} storeId={store!.id} onDone={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["static_pages"] }); }} />;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Páginas</h1>
        <button onClick={() => setCreating(true)} className="h-10 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]">+ Criar</button>
      </header>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
            <tr><th className="px-4 py-3">Página</th><th className="px-4 py-3">Última atualização</th><th className="px-4 py-3 text-right">Eliminar</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-sm text-[#6b7280]">Nenhuma página criada.</td></tr>}
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><button onClick={() => setEditing(p)} className="font-medium text-[#25d366] hover:underline">{p.title}</button></td>
                <td className="px-4 py-3 text-[#6b7280]">{new Date(p.updated_at).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={async () => { if (confirm("Excluir página?")) { await supabase.from("static_pages").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["static_pages"] }); } }} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && <p className="text-xs text-[#6b7280]">Mostrando 1-{items.length} páginas de {items.length}</p>}
      <a href="#" className="inline-flex items-center gap-1 text-sm text-[#25d366] hover:underline"><Info className="h-3.5 w-3.5" /> Como criar páginas de conteúdo? ↗</a>
    </div>
  );
}

function PageForm({ editing, storeId, onDone }: { editing: any; storeId: string; onDone: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content_md ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return toast.error("Título obrigatório");
    setSaving(true);
    try {
      const payload = { store_id: storeId, title: title.trim(), content_md: content, slug: editing?.slug ?? slugify(title) };
      const { error } = editing
        ? await supabase.from("static_pages").update({ title: payload.title, content_md: payload.content_md, updated_at: new Date().toISOString() }).eq("id", editing.id)
        : await supabase.from("static_pages").insert(payload);
      if (error) throw error;
      toast.success("Salvo");
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{editing ? "Editar" : "Criar"} página</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-[#111827]">Título da página</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" />
        <label className="mt-4 block text-sm font-medium text-[#111827]">Conteúdo</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#25d366]" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button onClick={save} disabled={saving} className="h-10 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60">{saving ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}
