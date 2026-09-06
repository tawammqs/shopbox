import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Upload, X as XIcon, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SECTION_LABELS,
  type HomepageSectionKey,
  type BannerRotativoCfg,
  type ProductsTagCfg,
  type ProductsCategoryCfg,
  type MarqueeCfg,
  type FretePagamentoCfg,
  type BannerCategoriasCfg,
  type InstagramCfg,
  type FaqCfg,
  type DepoimentosCfg,
  type VideoSectionCfg,
  type ProdutoPrincipalCfg,
  type CategoriasPrincipaisCfg,
  type CategoriaPrincipalItem,
} from "@/lib/homepage-sections";
import { hasProductSection } from "@/lib/product-sections";
import { Link } from "@tanstack/react-router";

// ---------------- shared mini UI ----------------
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
function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#25d366]",
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
function Slider({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#25d366]" />
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="h-8 w-16 rounded border border-gray-200 px-2 text-xs" />
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full transition", checked ? "bg-[#25d366]" : "bg-gray-300")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}

// ---------------- upload helper ----------------
async function uploadHomepageImage(
  storeId: string,
  sectionKey: HomepageSectionKey,
  file: File,
): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem maior que 5MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^\w]/g, "") || "jpg";
  // RLS on storage.objects requires the FIRST folder to equal the store id.
  const path = `${storeId}/homepage/${sectionKey}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("banners").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}

function ImageUploadBox({
  storeId,
  sectionKey,
  value,
  onChange,
  hint,
  height = 80,
}: {
  storeId: string;
  sectionKey: HomepageSectionKey;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  height?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadHomepageImage(storeId, sectionKey, f);
      onChange(url);
    } catch (e: any) {
      toast.error(e.message || "Erro no upload");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div
        className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-2"
        style={{ minHeight: height }}
      >
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
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <XIcon className="h-3 w-3" /> Remover
            </button>
          )}
        </div>
        <input ref={ref} hidden type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#9ca3af]">{hint}</p>}
    </div>
  );
}

// ---------------- 1. Banners rotativos ----------------
function BannersRotativosPanel({ storeId, cfg, onChange }: { storeId: string; cfg: BannerRotativoCfg; onChange: (c: BannerRotativoCfg) => void }) {
  const items = cfg.items ?? [];
  const updateItem = (i: number, patch: any) => onChange({ ...cfg, items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ ...cfg, items: items.filter((_, k) => k !== i) });
  const add = () => {
    if (items.length >= 5) return toast.error("Máximo de 5 banners");
    onChange({ ...cfg, items: [...items, { desktop_url: "", mobile_url: "", link: "" }] });
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#111827]">Banner {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Imagem Desktop</FieldLabel>
          <ImageUploadBox storeId={storeId} sectionKey="banners_rotativos" value={it.desktop_url} onChange={(u) => updateItem(i, { desktop_url: u })} hint="Recomendado: 1920×600px" />
          <FieldLabel>Imagem Mobile</FieldLabel>
          <ImageUploadBox storeId={storeId} sectionKey="banners_rotativos" value={it.mobile_url} onChange={(u) => updateItem(i, { mobile_url: u })} hint="Recomendado: 750×1000px" />
          <FieldLabel>Link ao clicar</FieldLabel>
          <TextInput value={it.link} onChange={(e) => updateItem(i, { link: e.target.value })} placeholder="/categoria/lancamentos" />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-[#374151] hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar banner
      </button>
      <div>
        <FieldLabel>Intervalo de rotação (segundos)</FieldLabel>
        <Slider value={cfg.interval_seconds ?? 5} min={3} max={10} onChange={(v) => onChange({ ...cfg, interval_seconds: v })} />
      </div>
      <Toggle checked={!!cfg.autoplay} onChange={(v) => onChange({ ...cfg, autoplay: v })} label="Autoplay" />
    </div>
  );
}

// ---------------- 2/3. Produtos por tag ----------------
function DisplayModeToggle({ value, onChange }: { value: "grid" | "carousel"; onChange: (v: "grid" | "carousel") => void }) {
  return (
    <div>
      <FieldLabel>Formato de exibição</FieldLabel>
      <div className="flex gap-2">
        {(["carousel", "grid"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
              value === m ? "border-[#25d366] bg-[#f0fdf4] text-[#16a34a]" : "border-gray-200 bg-white text-[#374151] hover:bg-gray-50",
            )}
          >
            {m === "carousel" ? "Carrossel" : "Grade"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductsTagPanel({ cfg, onChange, fixedTag }: { cfg: ProductsTagCfg; onChange: (c: ProductsTagCfg) => void; fixedTag?: string }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>Quantidade de produtos</FieldLabel>
        <SelectInput value={String(cfg.limit ?? 8)} onChange={(e) => onChange({ ...cfg, limit: Number(e.target.value) })}>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </SelectInput>
      </div>
      <DisplayModeToggle value={cfg.display_mode ?? "carousel"} onChange={(v) => onChange({ ...cfg, display_mode: v })} />
      {!fixedTag && (
        <div>
          <FieldLabel>Tag dos produtos</FieldLabel>
          <TextInput value={cfg.tag ?? ""} onChange={(e) => onChange({ ...cfg, tag: e.target.value })} placeholder="destaques" />
          <p className="mt-1 text-[11px] text-[#9ca3af]">Produtos com esta tag aparecem aqui.</p>
        </div>
      )}
      <Toggle checked={cfg.show_more_button !== false} onChange={(v) => onChange({ ...cfg, show_more_button: v })} label="Mostrar botão 'Ver mais'" />
    </div>
  );
}

// ---------------- 4. Produtos novos (por categoria) ----------------
function ProductsCategoryPanel({ storeId, cfg, onChange }: { storeId: string; cfg: ProductsCategoryCfg; onChange: (c: ProductsCategoryCfg) => void }) {
  const cats = useQuery({
    queryKey: ["editor-categories", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").eq("store_id", storeId).order("name");
      return data ?? [];
    },
    staleTime: 60_000,
  });
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>Categoria de origem</FieldLabel>
        <SelectInput value={cfg.category_id ?? ""} onChange={(e) => onChange({ ...cfg, category_id: e.target.value || null })}>
          <option value="">— Sem categoria (produtos mais recentes) —</option>
          {(cats.data ?? []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectInput>
      </div>
      <div>
        <FieldLabel>Quantidade de produtos</FieldLabel>
        <SelectInput value={String(cfg.limit ?? 8)} onChange={(e) => onChange({ ...cfg, limit: Number(e.target.value) })}>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
        </SelectInput>
      </div>
      <DisplayModeToggle value={cfg.display_mode ?? "carousel"} onChange={(v) => onChange({ ...cfg, display_mode: v })} />
    </div>
  );
}

// ---------------- 5/6. Marquee ----------------
function MarqueePanel({ cfg, onChange }: { cfg: MarqueeCfg; onChange: (c: MarqueeCfg) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Texto</FieldLabel>
        <TextInput value={cfg.text ?? ""} onChange={(e) => onChange({ ...cfg, text: e.target.value })} placeholder="Frete grátis acima de R$199" />
      </div>
      <ColorRow label="Cor de fundo" value={cfg.background ?? "#111827"} onChange={(v) => onChange({ ...cfg, background: v })} />
      <ColorRow label="Cor do texto" value={cfg.text_color ?? "#ffffff"} onChange={(v) => onChange({ ...cfg, text_color: v })} />
      <div>
        <FieldLabel>Tamanho do texto (px)</FieldLabel>
        <Slider value={cfg.font_size ?? 16} min={12} max={32} onChange={(v) => onChange({ ...cfg, font_size: v })} />
      </div>
      <Toggle checked={!!cfg.uppercase} onChange={(v) => onChange({ ...cfg, uppercase: v })} label="Texto em CAIXA ALTA" />
      <div>
        <FieldLabel>Velocidade (segundos para uma volta)</FieldLabel>
        <Slider value={cfg.speed ?? 15} min={10} max={40} onChange={(v) => onChange({ ...cfg, speed: v })} />
      </div>
    </div>
  );
}

// ---------------- 7. Frete / pagamento ----------------
const ICON_OPTIONS = ["Truck", "CreditCard", "ShieldCheck", "Tag", "Package", "Percent", "Gift", "Clock"];
function FretePagamentoPanel({ cfg, onChange }: { cfg: FretePagamentoCfg; onChange: (c: FretePagamentoCfg) => void }) {
  const items = cfg.items ?? [];
  const updateItem = (i: number, patch: any) => onChange({ ...cfg, items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ ...cfg, items: items.filter((_, k) => k !== i) });
  const add = () => {
    if (items.length >= 4) return toast.error("Máximo de 4 itens");
    onChange({ ...cfg, items: [...items, { icon: "Truck", title: "", description: "" }] });
  };
  return (
    <div className="space-y-3">
      <ColorRow label="Cor de fundo" value={cfg.background ?? "#dfdac8"} onChange={(v) => onChange({ ...cfg, background: v })} />
      <ColorRow label="Cor dos ícones" value={cfg.icon_color ?? "#ffffff"} onChange={(v) => onChange({ ...cfg, icon_color: v })} />
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Item {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Ícone</FieldLabel>
          <SelectInput value={it.icon} onChange={(e) => updateItem(i, { icon: e.target.value })}>
            {ICON_OPTIONS.map((ic) => <option key={ic}>{ic}</option>)}
          </SelectInput>
          <FieldLabel>Título</FieldLabel>
          <TextInput value={it.title} onChange={(e) => updateItem(i, { title: e.target.value })} />
          <FieldLabel>Descrição</FieldLabel>
          <TextInput value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar item
      </button>
    </div>
  );
}

// ---------------- 8. Banners de categorias ----------------
function BannersCategoriasPanel({ storeId, cfg, onChange }: { storeId: string; cfg: BannerCategoriasCfg; onChange: (c: BannerCategoriasCfg) => void }) {
  const cats = useQuery({
    queryKey: ["editor-categories", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").eq("store_id", storeId).order("name");
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const items = cfg.items ?? [];
  const updateItem = (i: number, patch: any) => onChange({ ...cfg, items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ ...cfg, items: items.filter((_, k) => k !== i) });
  const add = () => onChange({ ...cfg, items: [...items, { category_id: "", desktop_url: "", mobile_url: "" }] });
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Banner {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Categoria</FieldLabel>
          <SelectInput value={it.category_id} onChange={(e) => updateItem(i, { category_id: e.target.value })}>
            <option value="">— escolher —</option>
            {(cats.data ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectInput>
          <FieldLabel>Imagem Desktop</FieldLabel>
          <ImageUploadBox storeId={storeId} sectionKey="banners_categorias" value={it.desktop_url} onChange={(u) => updateItem(i, { desktop_url: u })} hint="Recomendado: 600×400px" />
          <FieldLabel>Imagem Mobile</FieldLabel>
          <ImageUploadBox storeId={storeId} sectionKey="banners_categorias" value={it.mobile_url} onChange={(u) => updateItem(i, { mobile_url: u })} hint="Recomendado: 360×240px" />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar banner de categoria
      </button>
    </div>
  );
}

// ---------------- 9. Instagram ----------------
function InstagramPanel({ storeId, cfg, onChange }: { storeId: string; cfg: InstagramCfg; onChange: (c: InstagramCfg) => void }) {
  const photos = cfg.photos ?? [];
  const addPhoto = (url: string) => {
    if (photos.length >= 12) return toast.error("Máximo de 12 fotos");
    onChange({ ...cfg, photos: [...photos, url] });
  };
  const removePhoto = (i: number) => onChange({ ...cfg, photos: photos.filter((_, k) => k !== i) });

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>@ do perfil</FieldLabel>
        <TextInput value={cfg.handle ?? ""} onChange={(e) => onChange({ ...cfg, handle: e.target.value })} placeholder="@minhaloja" />
      </div>
      <FieldLabel>Fotos (até 12)</FieldLabel>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-gray-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button onClick={() => removePhoto(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/80 text-red-600 hover:bg-white">
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < 12 && <AddPhotoTile storeId={storeId} onAdd={addPhoto} />}
      </div>
    </div>
  );
}
function AddPhotoTile({ storeId, onAdd }: { storeId: string; onAdd: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="grid aspect-square place-items-center rounded-md border border-dashed border-gray-300 text-[#6b7280] hover:bg-gray-50"
      >
        {busy ? "…" : <Plus className="h-5 w-5" />}
      </button>
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
            const url = await uploadHomepageImage(storeId, "instagram", f);
            onAdd(url);
          } catch (err: any) {
            toast.error(err.message || "Erro no upload");
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
    </>
  );
}

// ---------------- 10. FAQ ----------------
function FaqPanel({ cfg, onChange }: { cfg: FaqCfg; onChange: (c: FaqCfg) => void }) {
  const items = cfg.items ?? [];
  const updateItem = (i: number, patch: any) => onChange({ ...cfg, items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ ...cfg, items: items.filter((_, k) => k !== i) });
  const add = () => onChange({ ...cfg, items: [...items, { question: "", answer: "" }] });
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>Subtítulo</FieldLabel>
        <TextInput value={cfg.subtitle ?? ""} onChange={(e) => onChange({ ...cfg, subtitle: e.target.value })} />
      </div>
      <ColorRow label="Cor de fundo da caixa" value={cfg.background ?? "#dfdac8"} onChange={(v) => onChange({ ...cfg, background: v })} />
      <ColorRow label="Cor do texto" value={cfg.text_color ?? "#0f0f0f"} onChange={(v) => onChange({ ...cfg, text_color: v })} />
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Pergunta {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <TextInput value={it.question} onChange={(e) => updateItem(i, { question: e.target.value })} placeholder="Pergunta" />
          <TextArea value={it.answer} onChange={(e) => updateItem(i, { answer: e.target.value })} placeholder="Resposta" />
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar pergunta
      </button>
    </div>
  );
}

// ---------------- 11. Depoimentos ----------------
function DepoimentosPanel({ cfg, onChange }: { cfg: DepoimentosCfg; onChange: (c: DepoimentosCfg) => void }) {
  const items = cfg.items ?? [];
  const updateItem = (i: number, patch: any) => onChange({ ...cfg, items: items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const remove = (i: number) => onChange({ ...cfg, items: items.filter((_, k) => k !== i) });
  const add = () => onChange({ ...cfg, items: [...items, { name: "", text: "", rating: 5 }] });
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} placeholder="O que dizem nossos clientes" />
      </div>
      <ColorRow label="Cor de fundo" value={cfg.background ?? "#ffffff"} onChange={(v) => onChange({ ...cfg, background: v })} />
      <ColorRow label="Cor do texto" value={cfg.text_color ?? "#111111"} onChange={(v) => onChange({ ...cfg, text_color: v })} />
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">Depoimento {i + 1}</p>
            <button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <FieldLabel>Nome do cliente</FieldLabel>
          <TextInput value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
          <FieldLabel>Depoimento</FieldLabel>
          <TextArea value={it.text} onChange={(e) => updateItem(i, { text: e.target.value })} />
          <FieldLabel>Estrelas (1-5)</FieldLabel>
          <SelectInput value={String(it.rating ?? 5)} onChange={(e) => updateItem(i, { rating: Number(e.target.value) })}>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
          </SelectInput>
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Adicionar depoimento
      </button>
    </div>
  );
}

// ---------------- 12. Vídeo ----------------
function VideoSectionPanel({ cfg, onChange }: { cfg: VideoSectionCfg; onChange: (c: VideoSectionCfg) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} placeholder="Veja mais detalhes em vídeo" />
      </div>
      <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-[#6b7280]">
        Os vídeos exibidos aqui são gerenciados em <span className="font-semibold">Marketing → Video Commerce → Carrossel da home</span>. Cadastre os vídeos lá e eles aparecerão automaticamente.
      </p>
    </div>
  );
}

// ---------------- Produto Principal ----------------
function ProdutoPrincipalPanel({ storeId, cfg, onChange }: { storeId: string; cfg: ProdutoPrincipalCfg; onChange: (c: ProdutoPrincipalCfg) => void }) {
  const products = useQuery({
    queryKey: ["editor-products-mais-vendido", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, featured_sections, tags")
        .eq("store_id", storeId)
        .eq("active", true)
        .order("title");
      return (data ?? []).filter((p: any) => hasProductSection(p.featured_sections, "mais_vendido") || hasProductSection(p.tags, "mais_vendido"));
    },
    staleTime: 30_000,
  });

  // Convert ISO ↔ local datetime-local input value
  const localValue = (() => {
    if (!cfg.promotion_ends_at) return "";
    const d = new Date(cfg.promotion_ends_at);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const list = products.data ?? [];

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título da seção</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} placeholder="Oferta imperdível" />
      </div>

      <div>
        <FieldLabel>Produto</FieldLabel>
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Marque um produto como <strong>“Mais vendido”</strong> em{" "}
            <Link to="/admin/produtos" className="underline">Produtos</Link> para poder selecioná-lo aqui.
          </div>
        ) : (
          <SelectInput
            value={cfg.product_id ?? ""}
            onChange={(e) => onChange({ ...cfg, product_id: e.target.value || null })}
          >
            <option value="">— escolher produto —</option>
            {list.map((p: any) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </SelectInput>
        )}
        <p className="mt-1 text-[11px] text-[#9ca3af]">A lista mostra apenas produtos marcados como “Mais vendido”.</p>
      </div>

      <div>
        <FieldLabel>Data e hora de término da promoção</FieldLabel>
        <TextInput
          type="datetime-local"
          value={localValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...cfg, promotion_ends_at: v ? new Date(v).toISOString() : null });
          }}
        />
        <p className="mt-1 text-[11px] text-[#9ca3af]">A seção desaparece sozinha quando a data passar.</p>
      </div>

      <Toggle
        checked={cfg.show_countdown !== false}
        onChange={(v) => onChange({ ...cfg, show_countdown: v })}
        label="Mostrar cronômetro regressivo"
      />
    </div>
  );
}

// ---------------- Categorias principais ----------------
const newCatItem = (): CategoriaPrincipalItem => ({
  id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  title: "",
  image_url: "",
  link_type: "category",
  category_id: null,
  url: "",
});

function SortableCatItem({
  item, index, storeId, cats, onChange, onRemove,
}: {
  item: CategoriaPrincipalItem;
  index: number;
  storeId: string;
  cats: { id: string; name: string; parent_id: string | null }[];
  onChange: (patch: Partial<CategoriaPrincipalItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" {...attributes} {...listeners} className="cursor-grab text-[#9ca3af] hover:text-[#374151]" aria-label="Arrastar">
            <GripVertical className="h-4 w-4" />
          </button>
          <p className="text-xs font-semibold">Categoria {index + 1}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700" aria-label="Remover">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#dfdac8] text-sm font-bold uppercase text-[#111]">{(item.title || "?").slice(0, 1)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <FieldLabel>Título</FieldLabel>
            <TextInput value={item.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Ex.: Tênis" />
          </div>
        </div>
      </div>
      <div>
        <FieldLabel>Imagem (redonda)</FieldLabel>
        <ImageUploadBox storeId={storeId} sectionKey="categorias_principais" value={item.image_url} onChange={(u) => onChange({ image_url: u })} hint="Recomendado: 400×400px (quadrada)" />
        <TextInput className="mt-1.5" value={item.image_url} onChange={(e) => onChange({ image_url: e.target.value })} placeholder="ou cole a URL da imagem" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Link</FieldLabel>
          <SelectInput value={item.link_type} onChange={(e) => onChange({ link_type: e.target.value as any })}>
            <option value="category">Categoria da loja</option>
            <option value="url">Página / URL</option>
          </SelectInput>
        </div>
        <div>
          {item.link_type === "category" ? (
            <>
              <FieldLabel>Categoria</FieldLabel>
              <SelectInput value={item.category_id ?? ""} onChange={(e) => {
                const id = e.target.value || null;
                const c = cats.find((x) => x.id === id);
                onChange({ category_id: id, ...(c && !item.title ? { title: c.name } : {}) });
              }}>
                <option value="">— escolher —</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.parent_id ? "↳ " : ""}{c.name}</option>
                ))}
              </SelectInput>
            </>
          ) : (
            <>
              <FieldLabel>URL</FieldLabel>
              <TextInput value={item.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="/sobre ou https://…" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriasPrincipaisPanel({ storeId, cfg, onChange }: { storeId: string; cfg: CategoriasPrincipaisCfg; onChange: (c: CategoriasPrincipaisCfg) => void }) {
  const cats = useQuery({
    queryKey: ["editor-categories-full", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, image_url, parent_id").eq("store_id", storeId).order("display_order");
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const items = cfg.items ?? [];
  const setItems = (next: CategoriaPrincipalItem[]) => onChange({ ...cfg, items: next });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    setItems(arrayMove(items, from, to));
  };
  const importFromStore = () => {
    const top = (cats.data ?? []).filter((c: any) => !c.parent_id);
    if (top.length === 0) return toast.error("Nenhuma categoria cadastrada");
    setItems([
      ...items,
      ...top.map((c: any) => ({ ...newCatItem(), id: `c${c.id.slice(0, 8)}${Math.random().toString(36).slice(2, 5)}`, title: c.name, image_url: c.image_url ?? "", link_type: "category" as const, category_id: c.id })),
    ]);
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Título</FieldLabel>
        <TextInput value={cfg.title ?? ""} onChange={(e) => onChange({ ...cfg, title: e.target.value })} />
      </div>
      <div>
        <FieldLabel>Formato</FieldLabel>
        <SelectInput value={cfg.display_mode ?? "carousel"} onChange={(e) => onChange({ ...cfg, display_mode: e.target.value as any })}>
          <option value="carousel">Carrossel horizontal</option>
          <option value="grid">Grade centralizada</option>
        </SelectInput>
      </div>
      <div>
        <FieldLabel>Categorias exibidas</FieldLabel>
        <p className="mb-2 text-[11px] text-[#6b7280]">Monte manualmente: imagem redonda, título e link de cada uma. Arraste pela alça para reordenar.</p>
        {items.length === 0 && (
          <p className="mb-2 rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-[#6b7280]">Nenhuma categoria configurada. A seção não aparece na loja até adicionar ao menos uma.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((it, i) => (
                <SortableCatItem
                  key={it.id}
                  item={it}
                  index={i}
                  storeId={storeId}
                  cats={(cats.data ?? []) as any}
                  onChange={(patch) => setItems(items.map((x, k) => (k === i ? { ...x, ...patch } : x)))}
                  onRemove={() => setItems(items.filter((_, k) => k !== i))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setItems([...items, newCatItem()])} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium hover:bg-gray-50">
            <Plus className="h-4 w-4" /> Adicionar categoria
          </button>
          <button type="button" onClick={importFromStore} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50" title="Preenche com as categorias principais cadastradas">
            Importar da loja
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Router ----------------
export function SectionEditor({
  storeId,
  sectionKey,
  cfg,
  onChange,
}: {
  storeId: string;
  sectionKey: HomepageSectionKey;
  cfg: any;
  onChange: (c: any) => void;
}) {
  switch (sectionKey) {
    case "banners_rotativos":
      return <BannersRotativosPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    case "produtos_oferta":
      return <ProductsTagPanel cfg={cfg} onChange={onChange} fixedTag="ofertas" />;
    case "produtos_destaque":
      return <ProductsTagPanel cfg={cfg} onChange={onChange} />;
    case "produtos_novos":
      return <ProductsCategoryPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    case "boas_vindas_marquee":
    case "anuncios_marquee":
      return <MarqueePanel cfg={cfg} onChange={onChange} />;
    case "frete_pagamento":
      return <FretePagamentoPanel cfg={cfg} onChange={onChange} />;
    case "banners_categorias":
      return <BannersCategoriasPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    case "instagram":
      return <InstagramPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    case "faq":
      return <FaqPanel cfg={cfg} onChange={onChange} />;
    case "depoimentos":
      return <DepoimentosPanel cfg={cfg} onChange={onChange} />;
    case "video":
      return <VideoSectionPanel cfg={cfg} onChange={onChange} />;
    case "produto_principal":
      return <ProdutoPrincipalPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    case "categorias_principais":
      return <CategoriasPrincipaisPanel storeId={storeId} cfg={cfg} onChange={onChange} />;
    default:
      return (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-[#6b7280]">
          Esta seção ({SECTION_LABELS[sectionKey]}) ainda não possui configurações adicionais. Use o botão de olho na lista para ativar/desativar.
        </p>
      );
  }
}
