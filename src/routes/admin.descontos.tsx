import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlanGate } from "@/components/admin/PlanGate";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/descontos")({
  component: DiscountsPage,
});

function DiscountsPage() {
  const { data: store } = useMyStore();
  const planSlug = store?.plan?.slug as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Descontos</h1>
        <p className="text-sm text-muted-foreground">Cupons, promoções, combos e popup de boas-vindas</p>
      </div>

      <PlanGate plan={planSlug} feature="discounts">
        <Tabs defaultValue="coupons">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="promos">Promoções</TabsTrigger>
            <TabsTrigger value="combos">Combos</TabsTrigger>
            <TabsTrigger value="popup">Popup</TabsTrigger>
          </TabsList>
          <TabsContent value="coupons"><CouponsTab storeId={store!.id} /></TabsContent>
          <TabsContent value="promos"><PromosTab storeId={store!.id} /></TabsContent>
          <TabsContent value="combos"><CombosTab storeId={store!.id} /></TabsContent>
          <TabsContent value="popup"><PopupTab /></TabsContent>
        </Tabs>
      </PlanGate>
    </div>
  );
}

function CouponsTab({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const list = useQuery({
    queryKey: ["coupons", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("coupons").delete().eq("id", id); },
    onSuccess: () => { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["coupons"] }); },
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Novo cupom</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr><th className="p-3 text-left">Código</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Valor</th><th className="p-3 text-left">Usos</th><th className="p-3 text-left">Ativo</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {(list.data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum cupom</td></tr>}
            {(list.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3">{c.type === "percent" ? "%" : "R$"}</td>
                <td className="p-3">{c.value}</td>
                <td className="p-3">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="p-3">{c.active ? "✅" : "❌"}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir?")) remove.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CouponDialog open={open} onOpenChange={setOpen} editing={editing} storeId={storeId} onSaved={() => qc.invalidateQueries({ queryKey: ["coupons"] })} />
    </div>
  );
}

function CouponDialog({ open, onOpenChange, editing, storeId, onSaved }: any) {
  const [code, setCode] = useState(""); const [type, setType] = useState<"fixed" | "percent">("percent");
  const [value, setValue] = useState("10"); const [minCart, setMinCart] = useState("0");
  const [maxUses, setMaxUses] = useState(""); const [expires, setExpires] = useState("");
  const [active, setActive] = useState(true); const [firstOnly, setFirstOnly] = useState(false);

  useEffect(() => {
    if (open && editing) {
      setCode(editing.code); setType(editing.type); setValue(String(editing.value));
      setMinCart(String(editing.min_cart)); setMaxUses(editing.max_uses ? String(editing.max_uses) : "");
      setExpires(editing.expires_at ? editing.expires_at.slice(0, 10) : "");
      setActive(editing.active); setFirstOnly(editing.first_purchase_only);
    } else if (open) {
      setCode(""); setType("percent"); setValue("10"); setMinCart("0"); setMaxUses(""); setExpires(""); setActive(true); setFirstOnly(false);
    }
  }, [open, editing]);

  async function save() {
    if (!code.trim()) return toast.error("Código obrigatório");
    const payload = {
      store_id: storeId, code: code.toUpperCase().trim(), type, value: Number(value),
      min_cart: Number(minCart) || 0, max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
      active, first_purchase_only: firstOnly,
    };
    const { error } = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); onSaved(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} cupom</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Código *</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" /></div>
          <div><Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent">Percentual (%)</SelectItem><SelectItem value="fixed">Fixo (R$)</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Valor</Label><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></div>
          <div><Label>Carrinho mínimo (R$)</Label><Input type="number" value={minCart} onChange={(e) => setMinCart(e.target.value)} /></div>
          <div><Label>Limite de usos</Label><Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="ilimitado" /></div>
          <div><Label>Expira em</Label><Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></div>
          <div className="flex items-center gap-2"><Switch checked={firstOnly} onCheckedChange={setFirstOnly} /><Label>Só 1ª compra</Label></div>
          <div className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Ativo</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromosTab({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["promos", storeId],
    queryFn: async () => (await supabase.from("promotions").select("*").eq("store_id", storeId)).data ?? [],
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Promoções por categoria/escopo aplicadas automaticamente.</p>
      <div className="rounded-2xl border border-border bg-card">
        {(list.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma promoção. Em breve: criar promoções.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(list.data ?? []).map((p: any) => (
              <li key={p.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.type} · {p.value}{p.type === "percent" ? "%" : ""}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("promotions").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["promos"] }); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CombosTab({ storeId }: { storeId: string }) {
  const list = useQuery({
    queryKey: ["combos", storeId],
    queryFn: async () => (await supabase.from("combo_promotions").select("*").eq("store_id", storeId)).data ?? [],
  });
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Ex.: Leve 2 Pague 1, 3x R$ 100, etc.</p>
      <div className="rounded-2xl border border-border bg-card">
        {(list.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum combo configurado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(list.data ?? []).map((c: any) => (
              <li key={c.id} className="p-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">Min {c.min_quantity} · {c.discount_kind}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PopupTab() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const popup = (store?.welcome_popup ?? {}) as any;
  const [enabled, setEnabled] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState("15");
  const [frequency, setFrequency] = useState("session");

  useEffect(() => {
    setEnabled(!!popup.enabled);
    setCoupon(popup.coupon ?? "");
    setMessage(popup.message ?? "");
    setDelay(String(popup.delaySeconds ?? 15));
    setFrequency(popup.frequency ?? "session");
  }, [store?.id]);

  async function save() {
    if (!store) return;
    const { error } = await supabase.from("stores").update({
      welcome_popup: { enabled, coupon, message, delaySeconds: Number(delay) || 15, frequency },
    }).eq("id", store.id);
    if (error) return toast.error(error.message);
    toast.success("Popup atualizado");
    qc.invalidateQueries({ queryKey: ["my-store-full"] });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2"><Switch checked={enabled} onCheckedChange={setEnabled} /><Label>Ativar popup</Label></div>
      <div><Label>Código do cupom</Label><Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /></div>
      <div><Label>Mensagem</Label><Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Delay (s)</Label><Input type="number" value={delay} onChange={(e) => setDelay(e.target.value)} /></div>
        <div><Label>Frequência</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="session">Por sessão</SelectItem>
              <SelectItem value="once">Uma vez</SelectItem>
              <SelectItem value="always">Sempre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={save}>Salvar popup</Button>
    </div>
  );
}
