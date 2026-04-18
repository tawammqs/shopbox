import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { PlanGate } from "@/components/admin/PlanGate";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const planSlug = store?.plan?.slug as any;

  const [form, setForm] = useState<any>({});
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name, tagline: store.tagline ?? "", logo_url: store.logo_url, favicon_url: store.favicon_url,
        accent_color: store.accent_color, whatsapp: store.whatsapp, whatsapp_greeting: store.whatsapp_greeting ?? "",
        instagram: store.instagram ?? "", facebook: store.facebook ?? "", tiktok: store.tiktok ?? "", youtube: store.youtube ?? "",
        custom_domain: store.custom_domain ?? "",
        seo_title: (store.seo_meta as any)?.title ?? "", seo_desc: (store.seo_meta as any)?.description ?? "",
      });
      setBadges(store.trust_badges ?? []);
    }
  }, [store?.id]);

  const save = useMutation({
    mutationFn: async (overrides: any = {}) => {
      if (!store) return;
      const payload: any = { ...form, trust_badges: badges, seo_meta: { title: form.seo_title, description: form.seo_desc }, ...overrides };
      delete payload.seo_title; delete payload.seo_desc;
      const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["my-store-full"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!store) return null;
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua loja</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="social">Redes</TabsTrigger>
          <TabsTrigger value="badges">Selos</TabsTrigger>
          <TabsTrigger value="domain">Domínio</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div><Label>Nome da loja</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label>Slogan</Label><Input value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Logo</Label><div className="mt-1 max-w-[200px]"><ImageUpload bucket="logo" storeId={store.id} value={form.logo_url} onChange={(v) => set("logo_url", v)} /></div></div>
            <div><Label>Favicon</Label><div className="mt-1 max-w-[80px]"><ImageUpload bucket="logo" storeId={store.id} value={form.favicon_url} onChange={(v) => set("favicon_url", v)} /></div></div>
          </div>
          <div><Label>Cor de destaque</Label><Input type="color" value={form.accent_color ?? "#1a6b4a"} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-24" /></div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <div><Label>WhatsApp (com DDI)</Label><Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="5511999998888" /></div>
          <div><Label>Saudação inicial</Label><Textarea rows={2} value={form.whatsapp_greeting ?? ""} onChange={(e) => set("whatsapp_greeting", e.target.value)} placeholder="Olá! Vi sua loja e tenho interesse em…" /></div>
        </TabsContent>

        <TabsContent value="social" className="space-y-3">
          {(["instagram", "facebook", "tiktok", "youtube"] as const).map((k) => (
            <div key={k}><Label className="capitalize">{k}</Label><Input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder="https://…" /></div>
          ))}
        </TabsContent>

        <TabsContent value="badges" className="space-y-3">
          <p className="text-sm text-muted-foreground">Até 4 selos exibidos no rodapé e na página do produto.</p>
          {[0, 1, 2, 3].map((i) => (
            <Input key={i} value={badges[i] ?? ""} placeholder={`Selo ${i + 1}`} onChange={(e) => {
              const next = [...badges]; next[i] = e.target.value;
              setBadges(next.filter(Boolean));
            }} />
          ))}
        </TabsContent>

        <TabsContent value="domain">
          <PlanGate plan={planSlug} feature="custom_domain">
            <div className="space-y-3">
              <Label>Domínio personalizado</Label>
              <Input value={form.custom_domain ?? ""} onChange={(e) => set("custom_domain", e.target.value)} placeholder="loja.minhamarca.com.br" />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-semibold mb-1">DNS:</p>
                <p>Tipo A · Nome @ · Valor 185.158.133.1</p>
                <p>Tipo CNAME · Nome www · Valor seu-dominio.com</p>
              </div>
            </div>
          </PlanGate>
        </TabsContent>

        <TabsContent value="seo" className="space-y-3">
          <div><Label>Meta título padrão</Label><Input value={form.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} /></div>
          <div><Label>Meta descrição padrão</Label><Textarea rows={3} value={form.seo_desc ?? ""} onChange={(e) => set("seo_desc", e.target.value)} /></div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => save.mutate({})} disabled={save.isPending}>
        <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </div>
  );
}
