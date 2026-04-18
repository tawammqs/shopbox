import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2, DollarSign, Download, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatBRL, SEGMENT_OPTIONS, STYLE_OPTIONS, DEFAULT_TOKENS } from "@/lib/themes";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/temas")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!roles?.some((r) => r.role === "platform_admin")) throw redirect({ to: "/" });
  },
  component: SuperadminThemesPage,
});

function SuperadminThemesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const themesQ = useQuery({
    queryKey: ["sa-themes"],
    queryFn: async () => {
      const { data } = await supabase.from("themes").select("*, theme_partners(display_name)").order("display_order");
      return data ?? [];
    },
  });

  const purchasesQ = useQuery({
    queryKey: ["sa-purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("theme_purchases").select("*, themes(name)").eq("status", "completed");
      return data ?? [];
    },
  });

  const partnersQ = useQuery({
    queryKey: ["sa-partners"],
    queryFn: async () => {
      const { data } = await supabase.from("theme_partners").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("themes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tema excluído"); qc.invalidateQueries({ queryKey: ["sa-themes"] }); },
  });

  const totalRevenue = (purchasesQ.data ?? []).reduce((s, p: any) => s + (p.price_cents ?? 0), 0);
  const totalPlatform = (purchasesQ.data ?? []).reduce((s, p: any) => s + (p.platform_earnings_cents ?? 0), 0);
  const totalPartner = (purchasesQ.data ?? []).reduce((s, p: any) => s + (p.partner_earnings_cents ?? 0), 0);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Superadmin — Temas</h1>
          <p className="text-sm text-muted-foreground">Gerencie temas, parceiros e receita</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Novo tema
        </Button>
      </div>

      {/* Revenue cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <RevCard icon={DollarSign} label="Receita total" value={formatBRL(totalRevenue)} />
        <RevCard icon={DollarSign} label="Plataforma" value={formatBRL(totalPlatform)} />
        <RevCard icon={DollarSign} label="Parceiros" value={formatBRL(totalPartner)} />
      </div>

      <Tabs defaultValue="themes">
        <TabsList>
          <TabsTrigger value="themes">Temas ({themesQ.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="purchases">Vendas ({purchasesQ.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="partners">Parceiros ({partnersQ.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="themes">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {(themesQ.data ?? []).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3">
                {t.preview_desktop_url ? <img src={t.preview_desktop_url} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-muted" />}
                <div className="flex-1">
                  <p className="font-semibold">{t.name} <Badge variant={t.status === "approved" ? "default" : "secondary"} className="ml-2 text-[10px]">{t.status}</Badge></p>
                  <p className="text-xs text-muted-foreground">{t.is_free ? "Grátis" : formatBRL(t.price_cents)} · {t.install_count} instalações · ⭐ {t.rating_avg.toFixed(1)} {t.theme_partners?.display_name ? `· Parceiro: ${t.theme_partners.display_name}` : ""}</p>
                </div>
                {t.status === "pending_review" && (
                  <>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await supabase.from("themes").update({ status: "approved" }).eq("id", t.id);
                      qc.invalidateQueries({ queryKey: ["sa-themes"] });
                    }}>Aprovar</Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await supabase.from("themes").update({ status: "rejected" }).eq("id", t.id);
                      qc.invalidateQueries({ queryKey: ["sa-themes"] });
                    }}>Rejeitar</Button>
                  </>
                )}
                <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir tema?")) remove.mutate(t.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="purchases">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {(purchasesQ.data ?? []).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="flex-1 font-medium">{p.themes?.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="font-semibold">{formatBRL(p.price_cents)}</span>
                <span className="text-xs text-muted-foreground">Parceiro: {formatBRL(p.partner_earnings_cents)} · Plataforma: {formatBRL(p.platform_earnings_cents)}</span>
              </div>
            ))}
            {(purchasesQ.data ?? []).length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma venda ainda.</p>}
          </div>
        </TabsContent>

        <TabsContent value="partners">
          <PartnersList partners={partnersQ.data ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["sa-partners"] })} />
        </TabsContent>
      </Tabs>

      {open && <ThemeFormDialog editing={editing} partners={partnersQ.data ?? []} onClose={() => setOpen(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["sa-themes"] }); setOpen(false); }} />}
    </div>
  );
}

function RevCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function PartnersList({ partners, onChange }: { partners: any[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [commission, setCommission] = useState("70");

  async function add() {
    if (!name) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("theme_partners").insert({ display_name: name, email, commission_percent: Number(commission) });
    if (error) return toast.error(error.message);
    setName(""); setEmail(""); setCommission("70");
    onChange();
    toast.success("Parceiro adicionado");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">Novo parceiro</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_auto]">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="number" placeholder="Comissão %" value={commission} onChange={(e) => setCommission(e.target.value)} />
          <Button onClick={add}>Adicionar</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {partners.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 text-sm">
            <span className="flex-1 font-medium">{p.display_name}</span>
            <span className="text-xs text-muted-foreground">{p.email}</span>
            <Badge variant="outline">{p.commission_percent}%</Badge>
          </div>
        ))}
        {partners.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhum parceiro.</p>}
      </div>
    </div>
  );
}

function ThemeFormDialog({ editing, partners, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ?? {
    slug: "", name: "", tagline: "", description: "", price_cents: 0, is_free: true,
    preview_desktop_url: "", preview_mobile_url: "", carousel_urls: [], demo_url: "",
    segment_tags: [], style_tags: [], features: [], required_plan: "inicial",
    tokens: DEFAULT_TOKENS, default_sections: [], status: "approved", partner_id: null,
  });

  async function save() {
    if (!form.slug || !form.name) return toast.error("Slug e nome obrigatórios");
    const payload = { ...form, price_cents: Number(form.price_cents) || 0 };
    const { error } = editing
      ? await supabase.from("themes").update(payload).eq("id", editing.id)
      : await supabase.from("themes").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar tema" : "Novo tema"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          </div>
          <div><Label>Tagline</Label><Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} /><Label>Gratuito</Label></div>
            <div><Label>Preço (centavos)</Label><Input type="number" disabled={form.is_free} value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} /></div>
            <div><Label>Plano mínimo</Label>
              <Select value={form.required_plan} onValueChange={(v) => setForm({ ...form, required_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inicial">Inicial</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Preview desktop URL</Label><Input value={form.preview_desktop_url ?? ""} onChange={(e) => setForm({ ...form, preview_desktop_url: e.target.value })} /></div>
          <div><Label>Preview mobile URL</Label><Input value={form.preview_mobile_url ?? ""} onChange={(e) => setForm({ ...form, preview_mobile_url: e.target.value })} /></div>
          <div><Label>Demo URL</Label><Input value={form.demo_url ?? ""} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} /></div>
          <div>
            <Label>Segmentos (separados por vírgula)</Label>
            <Input value={(form.segment_tags ?? []).join(", ")} onChange={(e) => setForm({ ...form, segment_tags: e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean) })} />
            <p className="mt-1 text-[10px] text-muted-foreground">Sugestões: {SEGMENT_OPTIONS.join(", ")}</p>
          </div>
          <div>
            <Label>Estilos (separados por vírgula)</Label>
            <Input value={(form.style_tags ?? []).join(", ")} onChange={(e) => setForm({ ...form, style_tags: e.target.value.split(",").map((x: string) => x.trim()).filter(Boolean) })} />
            <p className="mt-1 text-[10px] text-muted-foreground">Sugestões: {STYLE_OPTIONS.join(", ")}</p>
          </div>
          <div>
            <Label>Parceiro</Label>
            <Select value={form.partner_id ?? "_none"} onValueChange={(v) => setForm({ ...form, partner_id: v === "_none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Sem parceiro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sem parceiro</SelectItem>
                {partners.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending_review">Pendente</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
