import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  component: BannersPage,
});

function BannersPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const banners = useQuery({
    queryKey: ["admin-banners", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("store_id", store!.id)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from("banners").update({ active }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("banners").delete().eq("id", id);
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); },
  });

  const reorder = useMutation({
    mutationFn: async ({ id, order }: { id: string; order: number }) => {
      await supabase.from("banners").update({ display_order: order }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  function move(b: any, dir: -1 | 1) {
    const list = banners.data ?? [];
    const idx = list.findIndex((x) => x.id === b.id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    reorder.mutate({ id: b.id, order: list[target].display_order });
    reorder.mutate({ id: list[target].id, order: b.display_order });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Banners</h1>
          <p className="text-sm text-muted-foreground">Carrossel da página inicial</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo banner
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {banners.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {(banners.data ?? []).length === 0 && !banners.isLoading && (
          <p className="col-span-2 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum banner. Crie o primeiro!
          </p>
        )}
        {(banners.data ?? []).map((b: any) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[16/6] bg-muted">
              {b.desktop_url && <img src={b.desktop_url} alt="" className="h-full w-full object-cover" />}
              {!b.active && <div className="absolute inset-0 bg-background/60 flex items-center justify-center text-xs font-medium">Desativado</div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium line-clamp-1">{b.title || "Sem título"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</p>
                </div>
                <Switch checked={b.active} onCheckedChange={(v) => toggle.mutate({ id: b.id, active: v })} />
              </div>
              <div className="mt-3 flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(b, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(b, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(b); setOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                  if (confirm("Excluir banner?")) remove.mutate(b.id);
                }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BannerDialog open={open} onOpenChange={setOpen} editing={editing} storeId={store?.id ?? ""} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-banners"] })} />
    </div>
  );
}

function BannerDialog({ open, onOpenChange, editing, storeId, onSaved }: any) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [desktop, setDesktop] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [order, setOrder] = useState("0");

  useEffect(() => {
    if (open && editing) {
      setTitle(editing.title ?? ""); setSubtitle(editing.subtitle ?? "");
      setButtonLabel(editing.button_label ?? ""); setButtonLink(editing.button_link ?? "");
      setDesktop(editing.desktop_url ?? null); setMobile(editing.mobile_url ?? null);
      setOrder(String(editing.display_order ?? 0));
    } else if (open) {
      setTitle(""); setSubtitle(""); setButtonLabel(""); setButtonLink("");
      setDesktop(null); setMobile(null); setOrder("0");
    }
  }, [open, editing]);

  async function save() {
    const payload = {
      store_id: storeId, title: title || null, subtitle: subtitle || null,
      button_label: buttonLabel || null, button_link: buttonLink || null,
      desktop_url: desktop, mobile_url: mobile,
      display_order: Number(order) || 0, active: true,
    };
    if (editing) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    onSaved(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} banner</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Imagem desktop (16:6)</Label>
            <div className="mt-1"><ImageUpload bucket="banners" storeId={storeId} value={desktop} onChange={setDesktop} aspect="aspect-[16/6]" /></div>
          </div>
          <div>
            <Label>Imagem mobile (4:5)</Label>
            <div className="mt-1"><ImageUpload bucket="banners" storeId={storeId} value={mobile} onChange={setMobile} aspect="aspect-[4/5]" /></div>
          </div>
          <div className="sm:col-span-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Subtítulo</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
          <div><Label>Texto do botão</Label><Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} /></div>
          <div><Label>Link do botão</Label><Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="/loja/..." /></div>
          <div><Label>Ordem</Label><Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
