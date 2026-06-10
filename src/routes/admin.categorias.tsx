import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriesPage,
});

type Cat = {
  id: string; name: string; slug: string;
  parent_id: string | null; image_url: string | null;
  display_order: number;
};

function CategoriesPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Cat | null>(null);
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
      return (data ?? []) as Cat[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin-cats-tree"] }); },
  });

  const reorderMany = useMutation({
    mutationFn: async (updates: { id: string; display_order: number; parent_id: string | null }[]) => {
      await Promise.all(updates.map(u =>
        supabase.from("categories")
          .update({ display_order: u.display_order, parent_id: u.parent_id })
          .eq("id", u.id)
      ));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats-tree"] }),
  });

  const all = cats.data ?? [];
  const roots = useMemo(() => all.filter(c => !c.parent_id), [all]);
  const childrenOf = (pid: string) => all.filter(c => c.parent_id === pid);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(parentId: string | null, items: Cat[]) {
    return (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIdx = items.findIndex(i => i.id === active.id);
      const newIdx = items.findIndex(i => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const next = arrayMove(items, oldIdx, newIdx);
      const updates = next.map((c, i) => ({ id: c.id, display_order: i, parent_id: parentId }));
      // Optimistic
      qc.setQueryData<Cat[]>(["admin-cats-tree", store?.id], (prev) => {
        if (!prev) return prev;
        return prev.map(p => {
          const u = updates.find(x => x.id === p.id);
          return u ? { ...p, display_order: u.display_order } : p;
        });
      });
      reorderMany.mutate(updates);
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Arraste para reordenar</p>
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(null, roots)}>
          <SortableContext items={roots.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {roots.map(c => (
              <SortableCatRow key={c.id} cat={c}
                onEdit={(x) => { setEditing(x); setOpen(true); }}
                onDelete={(id) => { if (confirm("Excluir categoria?")) remove.mutate(id); }}
              >
                <ChildrenList
                  parent={c}
                  childrenList={childrenOf(c.id)}
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                  onEdit={(x) => { setEditing(x); setOpen(true); }}
                  onDelete={(id) => { if (confirm("Excluir categoria?")) remove.mutate(id); }}
                />
              </SortableCatRow>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <CategoryDialog open={open} onOpenChange={setOpen} editing={editing}
        categories={all} storeId={store?.id ?? ""}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin-cats-tree"] })} />
    </div>
  );
}

function ChildrenList({ parent, childrenList, sensors, onDragEnd, onEdit, onDelete }: any) {
  if (childrenList.length === 0) return null;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragEnd={onDragEnd(parent.id, childrenList)}>
      <SortableContext items={childrenList.map((c: Cat) => c.id)} strategy={verticalListSortingStrategy}>
        {childrenList.map((sub: Cat) => (
          <SortableCatRow key={sub.id} cat={sub} depth={1} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableCatRow({ cat, onEdit, onDelete, depth = 0, children }: {
  cat: Cat; onEdit: (c: Cat) => void; onDelete: (id: string) => void;
  depth?: number; children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <>
      <div ref={setNodeRef} style={{ ...style, paddingLeft: 8 + depth * 24 }}
        className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/40">
        <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground" aria-label="Arrastar">
          <GripVertical className="h-4 w-4" />
        </button>
        {cat.image_url
          ? <img src={cat.image_url} alt="" className="h-8 w-8 rounded object-cover" />
          : <div className="h-8 w-8 rounded bg-muted" />}
        <span className="font-medium">{cat.name}</span>
        <span className="text-xs text-muted-foreground">/{cat.slug}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(cat)}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(cat.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </div>
      {children}
    </>
  );
}

function CategoryDialog({ open, onOpenChange, editing, categories, storeId, onSaved }: any) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
