import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Copy, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
        facebook_pixel_id: store.facebook_pixel_id ?? "",
        meta_conversion_token: store.meta_conversion_token ?? "",
        google_analytics_id: store.google_analytics_id ?? "",
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
          <TabsTrigger value="integracoes" id="integracoes">Integrações</TabsTrigger>
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

        <TabsContent value="integracoes" className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <p>
              Conecte seu Pixel do Facebook, API de Conversões da Meta, Google Analytics e
              sincronize seus produtos com o Catálogo do Meta para anúncios e remarketing.
            </p>
          </div>

          {/* Facebook Pixel */}
          <PlanGate plan={planSlug} feature="meta_pixel">
            <div className="space-y-2">
              <Label>ID do Pixel do Facebook</Label>
              <Input
                value={form.facebook_pixel_id ?? ""}
                onChange={(e) => set("facebook_pixel_id", e.target.value.trim())}
                placeholder="Ex: 1234567890123456"
                inputMode="numeric"
                maxLength={32}
              />
              <p className="text-xs text-muted-foreground">
                Cole aqui o ID do seu Pixel. Encontre em: Meta Business → Gerenciador de Eventos → seu Pixel → Configurações.
              </p>
            </div>
          </PlanGate>

          {/* Conversion API token */}
          <PlanGate plan={planSlug} feature="meta_capi">
            <div className="space-y-2">
              <Label>Token da API de Conversões (opcional)</Label>
              <Input
                type="password"
                value={form.meta_conversion_token ?? ""}
                onChange={(e) => set("meta_conversion_token", e.target.value.trim())}
                placeholder="Token de acesso..."
                autoComplete="off"
                maxLength={512}
              />
              <p className="text-xs text-muted-foreground">
                Melhora a precisão do rastreamento mesmo com bloqueadores. Opcional, mas recomendado.
              </p>
            </div>
          </PlanGate>

          {/* Product feed */}
          <PlanGate plan={planSlug} feature="meta_feed">
            <FeedUrlField slug={store.slug} />
          </PlanGate>

          {/* GA4 */}
          <div className="space-y-2 border-t border-border pt-6">
            <Label>ID do Google Analytics 4</Label>
            <Input
              value={form.google_analytics_id ?? ""}
              onChange={(e) => set("google_analytics_id", e.target.value.trim())}
              placeholder="Ex: G-XXXXXXXXXX"
              maxLength={32}
            />
            <p className="text-xs text-muted-foreground">
              Injeta o GA4 na sua loja e dispara os principais eventos automaticamente.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => save.mutate({})} disabled={save.isPending}>
        <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </div>
  );
}

function FeedUrlField({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const url =
    (typeof window !== "undefined" ? window.location.origin : "https://shopboxapp.com.br") +
    `/feed/${slug}/meta.xml`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };
  return (
    <div className="space-y-2">
      <Label>Feed de Produtos para Meta</Label>
      <div className="flex gap-2">
        <Input value={url} readOnly className="font-mono text-xs" />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Cole esta URL no Gerenciador de Catálogos do Meta para sincronizar seus produtos
        automaticamente. Atualizado a cada hora.
      </p>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            Como configurar o catálogo no Meta
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="mt-2 list-decimal space-y-1 rounded-lg bg-muted/40 p-3 pl-7 text-xs text-muted-foreground">
            <li>Acesse business.facebook.com</li>
            <li>Clique em "Catálogos" no menu</li>
            <li>Clique em "Criar catálogo" → "E-commerce"</li>
            <li>Escolha "Feed de dados programado"</li>
            <li>Cole a URL acima e defina frequência: "A cada hora"</li>
            <li>Pronto! Seus produtos serão importados automaticamente.</li>
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
