/**
 * Legacy editor adapter for The Shoes (slug === "the-shoes").
 *
 * The Shoes still renders via LegacyTheShoesHomepage reading from
 * the_shoes_theme_settings.settings (TheShoesSettings shape). To let the
 * lojista edit content from the new "Página inicial" editor WITHOUT changing
 * the visual layout, this adapter exposes per-section forms that read and
 * write the legacy fields directly.
 *
 * Sections without a legacy equivalent show an explanatory note.
 */

import { useRef, useState } from "react";
import { Trash2, Plus, Upload, X as XIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SECTION_LABELS, type HomepageSectionKey } from "@/lib/homepage-sections";
import type { TheShoesSettings } from "@/lib/the-shoes-theme";

// ---------- mini UI (kept local to avoid coupling) ----------
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-[#374151]">{children}</label>;
}
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]",
        props.className,
      )}
    />
  );
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-gray-200 p-2 text-sm outline-none focus:border-[#25d366]",
        props.className,
      )}
    />
  );
}
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-gray-200"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
        />
      </div>
    </div>
  );
}

// ---------- upload (storage-RLS-safe path: storeId/<sub>/...) ----------
async function uploadLegacyImage(storeId: string, sub: string, file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem maior que 5MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^\w]/g, "") || "jpg";
  const path = `${storeId}/the-shoes/${sub}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("banners").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}

function ImageInline({
  storeId,
  sub,
  value,
  onChange,
}: {
  storeId: string;
  sub: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-2">
      {value ? (
        <img src={value} alt="" className="h-16 w-24 rounded object-cover" />
      ) : (
        <div className="grid h-16 w-24 place-items-center rounded bg-gray-50 text-[10px] text-[#9ca3af]">sem imagem</div>
      )}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50"
        >
          <Upload className="h-3 w-3" /> {busy ? "Enviando…" : value ? "Trocar" : "Enviar"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
            <XIcon className="h-3 w-3" /> Remover
          </button>
        )}
      </div>
      <input
        ref={ref}
        hidden
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            const url = await uploadLegacyImage(storeId, sub, f);
            onChange(url);
          } catch (err: any) {
            toast.error(err.message || "Erro no upload");
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
    </div>
  );
}

// ---------- not-editable placeholder ----------
function NotEditable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-[#6b7280]">
      {children}
    </div>
  );
}

// ============================================================
// Section forms — each reads/writes legacy TheShoesSettings
// ============================================================
type Props = {
  storeId: string;
  settings: TheShoesSettings;
  onChange: (patch: Partial<TheShoesSettings>) => void;
};

function ProductsSectionForm({
  settings, onChange, which,
}: Props & { which: 1 | 2 }) {
  const titleKey = which === 1 ? "section1_title" : "section2_title";
  const tagKey = which === 1 ? "section1_tag" : "section2_tag";
  const subKey = which === 1 ? "section1_subtitle" : "section2_subtitle";
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={(settings as any)[titleKey] ?? ""} onChange={(e) => onChange({ [titleKey]: e.target.value } as any)} />
      </div>
      <div>
        <FieldLabel>Tag dos produtos</FieldLabel>
        <TextInput value={(settings as any)[tagKey] ?? ""} onChange={(e) => onChange({ [tagKey]: e.target.value } as any)} placeholder="destaques" />
        <p className="mt-1 text-[11px] text-[#9ca3af]">Produtos com esta tag aparecem aqui. Gerencie tags no cadastro de cada produto.</p>
      </div>
      <div>
        <FieldLabel>Texto do link &quot;Ver mais&quot;</FieldLabel>
        <TextInput value={(settings as any)[subKey] ?? ""} onChange={(e) => onChange({ [subKey]: e.target.value } as any)} placeholder="ver mais" />
      </div>
      {which === 2 && (
        <div>
          <FieldLabel>Descrição (acima do título)</FieldLabel>
          <TextInput value={settings.section2_description ?? ""} onChange={(e) => onChange({ section2_description: e.target.value })} />
        </div>
      )}
    </div>
  );
}

function MarqueeForm({ settings, onChange, which }: Props & { which: 1 | 2 }) {
  const key = which === 1 ? "marquee1" : "marquee2";
  const m = (settings as any)[key] ?? { text: "", bg_color: "#ffffff", text_color: "#000000" };
  const set = (patch: any) => onChange({ [key]: { ...m, ...patch } } as any);
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Texto</FieldLabel>
        <TextInput value={m.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
      </div>
      <ColorRow label="Cor de fundo" value={m.bg_color ?? "#ffffff"} onChange={(v) => set({ bg_color: v })} />
      <ColorRow label="Cor do texto" value={m.text_color ?? "#000000"} onChange={(v) => set({ text_color: v })} />
    </div>
  );
}

function IconsBarForm({ settings, onChange }: Props) {
  const items = settings.icons_bar ?? [];
  const update = (i: number, patch: any) =>
    onChange({ icons_bar: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ icons_bar: items.filter((_, k) => k !== i) });
  const add = () => {
    if (items.length >= 4) return toast.error("Máximo de 4 itens");
    onChange({ icons_bar: [...items, { icon: "🚚", title: "", subtitle: "" }] });
  };
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#6b7280]">
        Use um emoji (🚚 🔄 🔒 💬) no campo Ícone. Este é o formato atual da loja.
      </p>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Item {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Ícone (emoji)</FieldLabel>
          <TextInput value={it.icon} onChange={(e) => update(i, { icon: e.target.value })} maxLength={4} />
          <FieldLabel>Título</FieldLabel>
          <TextInput value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
          <FieldLabel>Subtítulo</FieldLabel>
          <TextInput value={it.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar item
      </button>
    </div>
  );
}

function InstagramForm({ storeId, settings, onChange }: Props) {
  const images = settings.instagram_images ?? [];
  const update = (i: number, patch: any) =>
    onChange({ instagram_images: images.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ instagram_images: images.filter((_, k) => k !== i) });
  const add = () => {
    if (images.length >= 12) return toast.error("Máximo de 12 fotos");
    onChange({ instagram_images: [...images, { image_url: "", link: "" }] });
  };
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>@ do perfil</FieldLabel>
        <TextInput value={settings.instagram_handle ?? ""} onChange={(e) => onChange({ instagram_handle: e.target.value })} placeholder="@theshoes" />
      </div>
      {images.map((img, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Foto {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Imagem</FieldLabel>
          <ImageInline storeId={storeId} sub="instagram" value={img.image_url} onChange={(u) => update(i, { image_url: u })} />
          <FieldLabel>Link ao clicar</FieldLabel>
          <TextInput value={img.link ?? ""} onChange={(e) => update(i, { link: e.target.value })} placeholder="https://instagram.com/p/..." />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar foto
      </button>
    </div>
  );
}

function FaqForm({ settings, onChange }: Props) {
  const items = settings.faq_items ?? [];
  const update = (i: number, patch: any) =>
    onChange({ faq_items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ faq_items: items.filter((_, k) => k !== i) });
  const add = () => onChange({ faq_items: [...items, { question: "", answer: "" }] });
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título</FieldLabel>
        <TextInput value={settings.faq_title ?? ""} onChange={(e) => onChange({ faq_title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>WhatsApp para dúvidas</FieldLabel>
        <TextInput value={settings.faq_whatsapp ?? ""} onChange={(e) => onChange({ faq_whatsapp: e.target.value })} placeholder="5511999999999" />
      </div>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Pergunta {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <TextInput value={it.question} onChange={(e) => update(i, { question: e.target.value })} placeholder="Pergunta" />
          <TextArea value={it.answer} onChange={(e) => update(i, { answer: e.target.value })} placeholder="Resposta" />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar pergunta
      </button>
    </div>
  );
}

// ============================================================
// Router for legacy section editor
// ============================================================
export function LegacySectionEditor({
  storeId,
  sectionKey,
  settings,
  onChange,
}: {
  storeId: string;
  sectionKey: HomepageSectionKey;
  settings: TheShoesSettings;
  onChange: (patch: Partial<TheShoesSettings>) => void;
}) {
  const common = { storeId, settings, onChange };
  switch (sectionKey) {
    case "banners_rotativos":
      return (
        <NotEditable>
          Os banners rotativos da The Shoes vêm do painel{" "}
          <Link to="/admin/banners" className="font-medium text-[#25d366] underline">
            Banners
          </Link>
          . Edite-os por lá — o visual desta seção continua igual.
        </NotEditable>
      );
    case "produtos_destaque":
      return <ProductsSectionForm {...common} which={1} />;
    case "produtos_novos":
      return <ProductsSectionForm {...common} which={2} />;
    case "produtos_oferta":
      return (
        <NotEditable>
          Esta loja tem duas faixas de produtos (Destaques e Lançamentos). Use o painel{" "}
          <b>Produtos em destaque</b> ou <b>Produtos novos</b> para editá-las.
        </NotEditable>
      );
    case "boas_vindas_marquee":
      return <MarqueeForm {...common} which={1} />;
    case "anuncios_marquee":
      return <MarqueeForm {...common} which={2} />;
    case "frete_pagamento":
      return <IconsBarForm {...common} />;
    case "instagram":
      return <InstagramForm {...common} />;
    case "faq":
      return <FaqForm {...common} />;
    default:
      return (
        <NotEditable>
          A seção <b>{SECTION_LABELS[sectionKey] ?? sectionKey}</b> ainda não é editável para esta loja.
          Outras seções (promo banner, depoimentos, vídeos, achadinhos, cupom) continuam funcionando como
          estão e poderão ganhar painéis no futuro.
        </NotEditable>
      );
  }
}

// Sections that are actually editable for The Shoes (others show a note).
export const LEGACY_EDITABLE_SECTIONS: HomepageSectionKey[] = [
  "banners_rotativos",
  "produtos_destaque",
  "produtos_novos",
  "boas_vindas_marquee",
  "anuncios_marquee",
  "frete_pagamento",
  "instagram",
  "faq",
];
