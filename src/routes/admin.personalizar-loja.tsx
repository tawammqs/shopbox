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

      {/* Icons bar */}
      <Card title="Barra de ícones (benefícios)">
        <ListEditor
          items={s.icons_bar}
          onChange={(v) => update("icons_bar", v)}
          empty={{ icon: "✨", title: "", subtitle: "" }}
          render={(it, set) => (
            <>
              <TextField label="Ícone (emoji)" value={it.icon} onChange={(v) => set({ ...it, icon: v })} />
              <TextField label="Título" value={it.title} onChange={(v) => set({ ...it, title: v })} />
              <TextField label="Subtítulo" value={it.subtitle} onChange={(v) => set({ ...it, subtitle: v })} />
            </>
          )}
        />
      </Card>

      {/* Testimonials */}
      <Card title="Depoimentos">
        <TextField label="Título da seção" value={s.testimonials_title}
          onChange={(v) => update("testimonials_title", v)} />
        <ListEditor
          items={s.testimonials}
          onChange={(v) => update("testimonials", v)}
          empty={{ name: "", text: "", rating: 5, image_url: "" }}
          render={(it, set) => (
            <>
              <TextField label="Nome" value={it.name} onChange={(v) => set({ ...it, name: v })} />
              <div>
                <Label className="mb-1 block">Depoimento</Label>
                <Textarea value={it.text} onChange={(e) => set({ ...it, text: e.target.value })} rows={3} />
              </div>
              <div>
                <Label className="mb-1 block">Nota (1–5)</Label>
                <Input type="number" min={1} max={5} value={it.rating}
                  onChange={(e) => set({ ...it, rating: Number(e.target.value) || 5 })} />
              </div>
              <div>
                <Label className="mb-2 block">Imagem (opcional)</Label>
                <ImageUpload bucket="banners" storeId={store.id}
                  value={it.image_url || null}
                  onChange={(url) => set({ ...it, image_url: url ?? "" })}
                  aspect="aspect-square" />
              </div>
            </>
          )}
        />
      </Card>

      {/* Video section */}
      <Card title="Sessão de Vídeos">
        <p className="text-xs text-muted-foreground">
          Adicione vídeos curtos para sua loja e vincule cada um a um produto.
          Os clientes verão estes vídeos na seção "Veja mais detalhes em vídeo" da página inicial.
        </p>
        <TextField
          label="Título da seção"
          value={s.video_section.title}
          onChange={(v) => update("video_section", { ...s.video_section, title: v })}
        />
        <VideoSectionEditor
          storeId={store.id}
          videos={s.video_section.videos}
          onChange={(videos) => update("video_section", { ...s.video_section, videos })}
        />
      </Card>


      {/* FAQ */}
      <Card title="Dúvidas frequentes (FAQ)">
        <TextField label="Título" value={s.faq_title} onChange={(v) => update("faq_title", v)} />
        <TextField label="WhatsApp para dúvidas (com DDI)" value={s.faq_whatsapp}
          onChange={(v) => update("faq_whatsapp", v)} />
        <ListEditor
          items={s.faq_items}
          onChange={(v) => update("faq_items", v)}
          empty={{ question: "", answer: "" }}
          render={(it, set) => (
            <>
              <TextField label="Pergunta" value={it.question} onChange={(v) => set({ ...it, question: v })} />
              <div>
                <Label className="mb-1 block">Resposta</Label>
                <Textarea value={it.answer} onChange={(e) => set({ ...it, answer: e.target.value })} rows={3} />
              </div>
            </>
          )}
        />
      </Card>

      {/* Instagram */}
      <Card title="Instagram">
        <TextField label="@usuário" value={s.instagram_handle}
          onChange={(v) => update("instagram_handle", v)} />
        <div>
          <Label className="mb-2 block">Imagens do feed (até 12)</Label>
          <p className="mb-3 text-xs text-muted-foreground">
            Para mostrar seu feed real do Instagram, faça upload das suas fotos aqui.
          </p>
          <ListEditor
            items={s.instagram_images}
            onChange={(v) => update("instagram_images", v.slice(0, 12))}
            empty={{ image_url: "", link: "" }}
            render={(it, set) => (
              <>
                <div>
                  <Label className="mb-2 block">Imagem</Label>
                  <ImageUpload bucket="banners" storeId={store.id}
                    value={it.image_url || null}
                    onChange={(url) => set({ ...it, image_url: url ?? "" })}
                    aspect="aspect-square" />
                </div>
                <TextField label="Link (opcional)" value={it.link} onChange={(v) => set({ ...it, link: v })} />
              </>
            )}
          />
        </div>
      </Card>

      {/* Footer */}
      <Card title="Rodapé">
        <TextField label="Texto rolante do rodapé" value={s.footer_marquee_text}
          onChange={(v) => update("footer_marquee_text", v)} />
        <div>
          <Label className="mb-1 block">Sobre a loja</Label>
          <Textarea value={s.footer_about} onChange={(e) => update("footer_about", e.target.value)} rows={4} />
        </div>
        <ListEditor
          items={s.footer_links}
          onChange={(v) => update("footer_links", v)}
          empty={{ label: "", url: "" }}
          render={(it, set) => (
            <>
              <TextField label="Texto" value={it.label} onChange={(v) => set({ ...it, label: v })} />
              <TextField label="URL" value={it.url} onChange={(v) => set({ ...it, url: v })} />
            </>
          )}
        />
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

      {/* Cupom de boas-vindas (floating tab) */}
      <Card title="Cupom de Boas-vindas">
        <div className="flex items-center justify-between gap-3">
          <Label>Mostrar aba flutuante de cupom</Label>
          <Switch
            checked={s.coupon_popup.enabled}
            onCheckedChange={(v) => update("coupon_popup", { ...s.coupon_popup, enabled: v })}
          />
        </div>
        <TextField label="Texto da aba"
          value={s.coupon_popup.tab_text}
          onChange={(v) => update("coupon_popup", { ...s.coupon_popup, tab_text: v })} />
        <div>
          <Label className="mb-1 block">Descrição no popup</Label>
          <Textarea
            value={s.coupon_popup.description}
            onChange={(e) => update("coupon_popup", { ...s.coupon_popup, description: e.target.value })}
            rows={3}
          />
        </div>
        <TextField label="Código do cupom"
          value={s.coupon_popup.coupon_code}
          onChange={(v) => update("coupon_popup", { ...s.coupon_popup, coupon_code: v })} />
        <TextField label="Link do grupo VIP no WhatsApp"
          value={s.coupon_popup.whatsapp_group_url}
          onChange={(v) => update("coupon_popup", { ...s.coupon_popup, whatsapp_group_url: v })} />
        <div>
          <Label className="mb-1 block">Cor de fundo da aba</Label>
          <Input
            type="color"
            value={s.coupon_popup.tab_bg_color}
            onChange={(e) => update("coupon_popup", { ...s.coupon_popup, tab_bg_color: e.target.value })}
            className="h-10 w-24 p-1"
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

function ListEditor<T>({
  items, onChange, empty, render,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  empty: T;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
}) {
  const setAt = (i: number, next: T) => {
    const copy = [...items];
    copy[i] = next;
    onChange(copy);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, structuredClone(empty)]);
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {render(it, (n) => setAt(i, n))}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar
      </Button>
    </div>
  );
}
