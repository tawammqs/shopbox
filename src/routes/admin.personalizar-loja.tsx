import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMyStore } from "@/hooks/useMyStore";
import {
  fetchTheShoesSettings,
  upsertTheShoesSettings,
  DEFAULT_THE_SHOES_SETTINGS,
  type TheShoesSettings,
} from "@/lib/the-shoes-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/personalizar-loja")({
  head: () => ({ meta: [{ title: "Personalizar Loja — ShopBox" }] }),
  component: PersonalizarPage,
});

function PersonalizarPage() {
  const { data: store, isLoading } = useMyStore();
  const [s, setS] = useState<TheShoesSettings>(DEFAULT_THE_SHOES_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    fetchTheShoesSettings(store.id).then((data) => {
      setS(data);
      setLoaded(true);
    });
  }, [store?.id]);

  if (isLoading || !store) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (store.slug !== "the-shoes") {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-xl font-bold">Personalização exclusiva</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este editor de tema é exclusivo da loja The Shoes.
        </p>
        <Button asChild className="mt-4"><Link to="/admin/dashboard">Voltar</Link></Button>
      </div>
    );
  }

  const update = <K extends keyof TheShoesSettings>(key: K, value: TheShoesSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await upsertTheShoesSettings(store.id, s);
      toast.success("Configurações salvas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Personalizar Loja</h1>
          <p className="text-sm text-muted-foreground">Editor exclusivo do tema The Shoes</p>
        </div>
        <Button onClick={save} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </header>

      {/* Announcement bar */}
      <Card title="Barra de avisos (topo)">
        <Row>
          <Label>Ativar barra</Label>
          <Switch
            checked={s.announcement_bar.enabled}
            onCheckedChange={(v) => update("announcement_bar", { ...s.announcement_bar, enabled: v })}
          />
        </Row>
        <ColorRow label="Cor de fundo" value={s.announcement_bar.bg_color}
          onChange={(v) => update("announcement_bar", { ...s.announcement_bar, bg_color: v })} />
        <ColorRow label="Cor do texto" value={s.announcement_bar.text_color}
          onChange={(v) => update("announcement_bar", { ...s.announcement_bar, text_color: v })} />
        <StringList
          label="Itens (um por linha)"
          values={s.announcement_bar.items}
          onChange={(items) => update("announcement_bar", { ...s.announcement_bar, items })}
        />
      </Card>

      {/* Section 1 */}
      <Card title="Seção 1 — Carrossel de produtos">
        <TextField label="Título" value={s.section1_title} onChange={(v) => update("section1_title", v)} />
        <TextField label="Texto do link 'ver mais'" value={s.section1_subtitle} onChange={(v) => update("section1_subtitle", v)} />
        <TextField label="Tag/categoria dos produtos" value={s.section1_tag} onChange={(v) => update("section1_tag", v)} />
      </Card>

      {/* Marquee 1 */}
      <Card title="Marquee 1 (texto rolante)">
        <ColorRow label="Cor de fundo" value={s.marquee1.bg_color}
          onChange={(v) => update("marquee1", { ...s.marquee1, bg_color: v })} />
        <ColorRow label="Cor do texto" value={s.marquee1.text_color}
          onChange={(v) => update("marquee1", { ...s.marquee1, text_color: v })} />
        <TextField label="Texto" value={s.marquee1.text}
          onChange={(v) => update("marquee1", { ...s.marquee1, text: v })} />
      </Card>

      {/* Promo banner */}
      <Card title="Banner promocional clicável">
        <div>
          <Label className="mb-2 block">Imagem</Label>
          <ImageUpload
            bucket="banners"
            storeId={store.id}
            value={s.promo_banner.image_url || null}
            onChange={(url) => update("promo_banner", { ...s.promo_banner, image_url: url ?? "" })}
            aspect="aspect-[3/1]"
          />
        </div>
        <TextField label="Link (URL)" value={s.promo_banner.link}
          onChange={(v) => update("promo_banner", { ...s.promo_banner, link: v })} />
      </Card>

      {/* Section 2 */}
      <Card title="Seção 2 — Segundo carrossel de produtos">
        <TextField label="Texto pequeno acima do título" value={s.section2_description}
          onChange={(v) => update("section2_description", v)} />
        <TextField label="Título" value={s.section2_title} onChange={(v) => update("section2_title", v)} />
        <TextField label="Texto do link 'ver mais'" value={s.section2_subtitle} onChange={(v) => update("section2_subtitle", v)} />
        <TextField label="Tag/categoria dos produtos" value={s.section2_tag} onChange={(v) => update("section2_tag", v)} />
      </Card>

      {/* Marquee 2 */}
      <Card title="Marquee 2 (texto rolante VIP)">
        <ColorRow label="Cor de fundo" value={s.marquee2.bg_color}
          onChange={(v) => update("marquee2", { ...s.marquee2, bg_color: v })} />
        <ColorRow label="Cor do texto" value={s.marquee2.text_color}
          onChange={(v) => update("marquee2", { ...s.marquee2, text_color: v })} />
        <TextField label="Texto" value={s.marquee2.text}
          onChange={(v) => update("marquee2", { ...s.marquee2, text: v })} />
      </Card>

      {/* Whatsapp / cart upsell */}
      <Card title="WhatsApp & Carrinho">
        <TextField label="WhatsApp (com DDI, só números)" value={s.whatsapp_button}
          onChange={(v) => update("whatsapp_button", v)} />
        <TextField label="Mensagem de upsell do carrinho" value={s.cart_upsell_message}
          onChange={(v) => update("cart_upsell_message", v)} />
        <div>
          <Label className="mb-1 block">Valor mínimo (R$)</Label>
          <Input
            type="number"
            value={s.cart_upsell_threshold}
            onChange={(e) => update("cart_upsell_threshold", Number(e.target.value) || 0)}
          />
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" className="shadow-lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="flex-1">{label}</Label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 cursor-pointer rounded-md border border-border"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-32" />
    </div>
  );
}

function StringList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Textarea
        value={values.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
        rows={Math.max(3, values.length + 1)}
      />
    </div>
  );
}
