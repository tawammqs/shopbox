import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Check, Settings2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { PlanGate } from "@/components/admin/PlanGate";
import {
  ALL_SECTIONS, DEFAULT_TOKENS, FONT_PAIRS, formatBRL, mergeTokens,
  type ThemeCustomizations, type ThemeTokens,
} from "@/lib/themes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/temas")({
  component: AdminThemesPage,
});

function AdminThemesPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const themeQ = useStoreTheme(store?.id);
  const [editing, setEditing] = useState<any | null>(null);

  const themesQ = useQuery({
    queryKey: ["my-themes", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const [{ data: purchases }, { data: allThemes }] = await Promise.all([
        supabase.from("theme_purchases").select("theme_id, status").eq("store_id", store!.id).eq("status", "completed"),
        supabase.from("themes").select("*").eq("status", "approved").order("display_order"),
      ]);
      const ownedIds = new Set((purchases ?? []).map((p) => p.theme_id));
      return (allThemes ?? []).filter((t: any) => t.is_free || ownedIds.has(t.id));
    },
  });

  const activate = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase.from("store_theme_settings").upsert({
        store_id: store!.id, active_theme_id: themeId, customizations: {},
      }, { onConflict: "store_id" });
      if (error) throw error;
      await supabase.rpc("increment_theme_installs", { _theme_id: themeId });
    },
    onSuccess: () => {
      toast.success("Tema ativado!");
      qc.invalidateQueries({ queryKey: ["store-theme"] });
      qc.invalidateQueries({ queryKey: ["my-themes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeId = themeQ.data?.themeId;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Meus Temas</h1>
          <p className="text-sm text-muted-foreground">Ative um tema ou personalize o atual</p>
        </div>
        <Button asChild variant="outline"><Link to="/temas">Explorar mais temas</Link></Button>
      </div>

      {themesQ.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(themesQ.data ?? []).map((t: any) => {
          const isActive = activeId === t.id;
          const c = t.tokens?.colors ?? DEFAULT_TOKENS.colors;
          return (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}22)` }}>
                {t.preview_desktop_url ? (
                  <img src={t.preview_desktop_url} alt={t.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-xl font-bold" style={{ color: c.primary }}>{t.name}</div>
                )}
                {isActive && (
                  <Badge className="absolute right-2 top-2 gap-1"><Check className="h-3 w-3" /> Ativo</Badge>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{t.name}</h3>
                  {t.is_free ? <Badge variant="secondary">Grátis</Badge> : <Badge variant="outline">{formatBRL(t.price_cents)}</Badge>}
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{t.tagline}</p>
                <div className="mt-3 flex gap-2">
                  {isActive ? (
                    <Button size="sm" className="flex-1" onClick={() => setEditing(t)}>
                      <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Personalizar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                      if (confirm(`Ativar tema ${t.name}? Suas configurações de personalização serão resetadas.`)) activate.mutate(t.id);
                    }}>
                      Ativar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(themesQ.data ?? []).length === 0 && !themesQ.isLoading && (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não tem temas. Explore o marketplace!</p>
          <Button asChild className="mt-4"><Link to="/temas">Ver temas</Link></Button>
        </div>
      )}

      {editing && store && (
        <ThemeCustomizerDialog theme={editing} storeId={store.id} planSlug={store.plan?.slug as any} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function ThemeCustomizerDialog({
  theme, storeId, planSlug, onClose,
}: { theme: any; storeId: string; planSlug: any; onClose: () => void }) {
  const qc = useQueryClient();
  const baseTokens: ThemeTokens = (theme.tokens as ThemeTokens) ?? DEFAULT_TOKENS;
  const defaultSections = (Array.isArray(theme.default_sections) ? theme.default_sections : []).map((s: any, i: number) => ({
    id: s.id, enabled: s.enabled !== false, order: s.order ?? i,
  }));

  const settingsQ = useQuery({
    queryKey: ["store-theme-settings", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("store_theme_settings").select("*").eq("store_id", storeId).maybeSingle();
      return data;
    },
  });

  const initial: ThemeCustomizations = (settingsQ.data?.customizations as any) ?? {};
  const [cust, setCust] = useState<ThemeCustomizations>(initial);
  const [dirty, setDirty] = useState(false);

  // Sync once when settings load
  useState(() => {
    if (settingsQ.data?.customizations) setCust(settingsQ.data.customizations as any);
  });

  const merged = mergeTokens(baseTokens, cust);
  const sections = cust.sections ?? defaultSections;

  function patch(p: Partial<ThemeCustomizations>) {
    setCust((prev) => ({ ...prev, ...p }));
    setDirty(true);
  }
  function patchColors(p: Partial<ThemeTokens["colors"]>) {
    setCust((prev) => ({ ...prev, colors: { ...(prev.colors ?? {}), ...p } }));
    setDirty(true);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    patch({ sections: next.map((s, i) => ({ ...s, order: i })) });
  }
  function toggleSection(id: string) {
    const next = sections.map((s: { id: string; enabled: boolean; order: number }) => s.id === id ? { ...s, enabled: !s.enabled } : s);
    patch({ sections: next });
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("store_theme_settings").upsert({
        store_id: storeId, active_theme_id: theme.id, customizations: cust as any,
      }, { onConflict: "store_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Personalização salva");
      qc.invalidateQueries({ queryKey: ["store-theme"] });
      setDirty(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const fontPairValue = `${merged.fonts.display}|${merged.fonts.body}`;

  return (
    <Dialog open onOpenChange={(o) => !o && (dirty ? confirm("Descartar alterações?") && onClose() : onClose())}>
      <DialogContent className="max-w-6xl p-0 h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="font-display">Personalizar — {theme.name}</DialogTitle>
          <DialogDescription>Edite cores, fontes e seções. As mudanças aparecem na pré-visualização.</DialogDescription>
        </DialogHeader>

        <div className="grid h-[calc(90vh-160px)] grid-cols-[340px_1fr]">
          {/* LEFT: Controls */}
          <div className="overflow-y-auto border-r border-border p-4">
            <Tabs defaultValue="colors">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="fonts">Fontes</TabsTrigger>
                <TabsTrigger value="sections">Seções</TabsTrigger>
                <TabsTrigger value="style">Estilo</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4 pt-4">
                <ColorField label="Primária" value={merged.colors.primary} onChange={(v) => patchColors({ primary: v })} />
                <ColorField label="Secundária" value={merged.colors.secondary} onChange={(v) => patchColors({ secondary: v })} />
                <PlanGate plan={planSlug} feature="seo_per_product">
                  <ColorField label="Destaque" value={merged.colors.accent} onChange={(v) => patchColors({ accent: v })} />
                </PlanGate>
                <ColorField label="Fundo" value={merged.colors.bg} onChange={(v) => patchColors({ bg: v })} />
                <ColorField label="Texto" value={merged.colors.fg} onChange={(v) => patchColors({ fg: v })} />
              </TabsContent>

              <TabsContent value="fonts" className="space-y-4 pt-4">
                <div>
                  <Label>Combinação de fontes</Label>
                  <Select value={fontPairValue} onValueChange={(v) => {
                    const [d, b] = v.split("|");
                    patch({ fonts: { display: d, body: b } });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_PAIRS.map((p) => (
                        <SelectItem key={p.label} value={`${p.display}|${p.body}`}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Logo da loja</Label>
                  <ImageUpload bucket="logo" storeId={storeId} value={cust.logoUrl ?? null} onChange={(url) => patch({ logoUrl: url })} aspect="aspect-[3/1]" />
                </div>
              </TabsContent>

              <TabsContent value="sections" className="space-y-2 pt-4">
                <p className="text-xs text-muted-foreground">Reordene e habilite/desabilite seções da home</p>
                {sections.map((s: { id: string; enabled: boolean; order: number }, idx: number) => {
                  const meta = ALL_SECTIONS.find((x) => x.id === s.id);
                  if (!meta) return null;
                  return (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveSection(idx, -1)} className="text-xs">↑</button>
                        <button onClick={() => moveSection(idx, 1)} className="text-xs">↓</button>
                      </div>
                      <span className="flex-1 text-sm">{meta.label}</span>
                      <Switch checked={s.enabled} onCheckedChange={() => toggleSection(s.id)} />
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="style" className="space-y-4 pt-4">
                <div>
                  <Label>Estilo dos botões</Label>
                  <Select value={cust.buttonStyle ?? "rounded"} onValueChange={(v) => patch({ buttonStyle: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rounded">Arredondado</SelectItem>
                      <SelectItem value="square">Quadrado</SelectItem>
                      <SelectItem value="pill">Pílula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estilo dos cards de produto</Label>
                  <Select value={cust.cardStyle ?? "shadow"} onValueChange={(v) => patch({ cardStyle: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                      <SelectItem value="shadow">Com sombra</SelectItem>
                      <SelectItem value="border">Com borda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Preview */}
          <div className="overflow-y-auto bg-muted/20 p-6">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Pré-visualização</p>
            <div className="overflow-hidden rounded-2xl border border-border" style={{ background: merged.colors.bg, color: merged.colors.fg, fontFamily: `'${merged.fonts.body}',sans-serif` }}>
              <div className="flex items-center justify-between p-4" style={{ background: merged.colors.primary, color: "#fff" }}>
                <span style={{ fontFamily: `'${merged.fonts.display}',sans-serif`, fontWeight: 700 }}>{cust.logoUrl ? <img src={cust.logoUrl} alt="" className="h-8" /> : "Sua Loja"}</span>
                <span className="text-xs">Carrinho · 0</span>
              </div>
              <div className="p-6">
                <h2 style={{ fontFamily: `'${merged.fonts.display}',sans-serif`, fontWeight: 700, fontSize: 28 }}>Bem-vindo</h2>
                <p className="mt-1 text-sm" style={{ opacity: 0.7 }}>Veja nossas novidades</p>
                <button className="mt-4 px-5 py-2 text-white" style={{
                  background: merged.colors.accent,
                  borderRadius: cust.buttonStyle === "pill" ? 999 : cust.buttonStyle === "square" ? 0 : 8,
                }}>Comprar agora</button>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square overflow-hidden" style={{
                      borderRadius: merged.radius,
                      background: merged.colors.secondary, opacity: 0.1,
                      border: cust.cardStyle === "border" ? `1px solid ${merged.colors.fg}22` : "none",
                      boxShadow: cust.cardStyle === "shadow" ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button variant="outline" onClick={() => { setCust(initial); setDirty(false); }} disabled={!dirty}>
            Descartar alterações
          </Button>
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Salvar e publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-border bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}
