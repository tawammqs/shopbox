import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GripVertical, Edit2, Trash2, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loja/menus")({
  head: () => ({ meta: [{ title: "Menus — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [linkDialog, setLinkDialog] = useState<{ menuId: string; item?: any } | null>(null);

  const menus = useQuery({
    queryKey: ["store_menus", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data: ms } = await supabase.from("store_menus").select("*").eq("store_id", store!.id).order("created_at");
      const all = ms ?? [];
      const items = await Promise.all(all.map(async (m) => {
        const { data: its } = await supabase.from("store_menu_items").select("*").eq("menu_id", m.id).order("position");
        return { ...m, items: its ?? [] };
      }));
      return items;
    },
  });

  async function createMenu() {
    const name = prompt("Nome do menu");
    if (!name) return;
    await supabase.from("store_menus").insert({ store_id: store!.id, name });
    qc.invalidateQueries({ queryKey: ["store_menus"] });
  }

  async function deleteMenu(id: string) {
    if (!confirm("Excluir menu inteiro?")) return;
    await supabase.from("store_menus").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["store_menus"] });
  }

  async function deleteItem(id: string) {
    await supabase.from("store_menu_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["store_menus"] });
  }

  const list = menus.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Menus</h1>
        <button onClick={createMenu} className="h-10 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]">+ Criar menu</button>
      </header>
      <p className="text-sm text-[#6b7280]">Personalize sua loja adicionando links ao menu principal ou criando um novo.</p>

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-[#6b7280]">
          Nenhum menu criado ainda.
        </div>
      )}

      {list.map((m: any) => (
        <div key={m.id} className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-[#111827]">{m.name}</h3>
            <button onClick={() => deleteMenu(m.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
          <ul className="divide-y divide-gray-100">
            {m.items.length === 0 && <li className="px-5 py-4 text-xs text-[#6b7280]">Sem links.</li>}
            {m.items.map((it: any) => (
              <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                <GripVertical className="h-4 w-4 cursor-grab text-gray-400" />
                <span className="flex-1 text-sm text-[#111827]">{it.label}</span>
                <span className="text-xs text-[#6b7280]">{it.url}</span>
                <button onClick={() => setLinkDialog({ menuId: m.id, item: it })} className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => deleteItem(it.id)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-5 py-3">
            <button onClick={() => setLinkDialog({ menuId: m.id })} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#25d366] hover:underline">
              <PlusCircle className="h-4 w-4" /> Adicionar link
            </button>
          </div>
        </div>
      ))}

      {linkDialog && (
        <LinkDialog
          menuId={linkDialog.menuId}
          item={linkDialog.item}
          onClose={() => setLinkDialog(null)}
          onSaved={() => { setLinkDialog(null); qc.invalidateQueries({ queryKey: ["store_menus"] }); }}
        />
      )}
    </div>
  );
}

function LinkDialog({ menuId, item, onClose, onSaved }: { menuId: string; item?: any; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState(item?.label ?? "");
  const [url, setUrl] = useState(item?.url ?? "");

  async function save() {
    if (!label.trim()) return toast.error("Nome obrigatório");
    if (item) {
      await supabase.from("store_menu_items").update({ label, url }).eq("id", item.id);
    } else {
      await supabase.from("store_menu_items").insert({ menu_id: menuId, label, url, position: 0 });
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[#111827]">{item ? "Editar" : "Adicionar"} link</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Nome do link</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Destino (URL)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/categoria/calcados ou https://…" className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onClick={save} className="h-10 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959]">Salvar</button>
        </div>
      </div>
    </div>
  );
}
