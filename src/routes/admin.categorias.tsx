import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const cats = useQuery({
    queryKey: ["admin-cats-tree", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", store!.id)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-cats-tree"] }); },
  });

  const reorder = useMutation({
    mutationFn: async ({ id, order }: { id: string; order: number }) => {
      await supabase.from("categories").update({ display_order: order }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats-tree"] }),
  });

  const all = cats.data ?? [];
  const roots = all.filter((c: any) => !c.parent_id);
  const childrenOf = (pid: string) => all.filter((c: any) => c.parent_id === pid);

  function move(c: any, dir: -1 | 1) {
    const siblings = c.parent_id ? childrenOf(c.parent_id) : roots;
    const idx = siblings.findIndex((s: any) => s.id === c.id);
    const target = idx + dir;
    if (target < 0 || target >= siblings.length) return;
    reorder.mutate({ id: c.id, order: siblings[target].display_order });
    reorder.mutate({ id: siblings[target].id, order: c.display_order });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize seus produtos</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-2">
        {cats.isLoading && <p className="p-4 text-sm text-muted-foreground">Carregando…</p>}
        {!cats.isLoading && roots.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma categoria. Crie a primeira!</p>
        )}
        {roots.map((c: any) => (
          <CatRow key={c.id} cat={c} childrenList={childrenOf(c.id)} onEdit={(x) => { setEditing(x); setOpen(true); }} onDelete={(id) => {
            if (confirm("Excluir categoria?")) remove.mutate(id);
          }} onMove={move} />
        ))}
      </div>

      <CategoryDialog open={open} onOpenChange={setOpen} editing={editing} categories={all} storeId={store?.id ?? ""} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-cats-tree"] })} />
    </div>
  );
}

function CatRow({ cat, childrenList, onEdit, onDelete, onMove, depth = 0 }: any) {
  return (
    <>
      <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/40" style={{ paddingLeft: 8 + depth * 24 }}>
        {cat.image_url ? <img src={cat.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted" />}
        <span className="font-medium">{cat.name}</span>
        <span className="text-xs text-muted-foreground">/{cat.slug}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(cat, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(cat, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(cat)}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(cat.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </div>
      {childrenList.map((sub: any) => (
        <CatRow key={sub.id} cat={sub} childrenList={[]} onEdit={onEdit} onDelete={onDelete} onMove={onMove} depth={depth + 1} />
      ))}
    </>
  );
}

function CategoryDialog({ open, onOpenChange, editing, categories, storeId, onSaved }: any) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // reset on open
  useState(() => {
    if (editing) {
      setName(editing.name); setSlug(editing.slug);
      setParentId(editing.parent_id ?? ""); setImageUrl(editing.image_url ?? null);
    } else { setName(""); setSlug(""); setParentId(""); setImageUrl(null); }
  });

  // sync when editing changes
  if (open && editing && editing.id !== (Object as any)._lastEditId) {
    (Object as any)._lastEditId = editing.id;
  }

  async function save() {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    const payload = {
      store_id: storeId, name: name.trim(),
      slug: slug || slugify(name),
      parent_id: parentId || null,
      image_url: imageUrl,
    };
    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Salvo");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (o && editing) {
        setName(editing.name); setSlug(editing.slug);
        setParentId(editing.parent_id ?? ""); setImageUrl(editing.image_url ?? null);
      } else if (o) { setName(""); setSlug(""); setParentId(""); setImageUrl(null); }
      onOpenChange(o);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar" : "Nova"} categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
          <div>
            <Label>Subcategoria de</Label>
            <Select value={parentId || "_none"} onValueChange={(v) => setParentId(v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Nenhuma (raiz)</SelectItem>
                {categories.filter((c: any) => !c.parent_id && c.id !== editing?.id).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Imagem (opcional)</Label>
            <div className="mt-1 max-w-[160px]">
              <ImageUpload bucket="categories" storeId={storeId} value={imageUrl} onChange={setImageUrl} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
