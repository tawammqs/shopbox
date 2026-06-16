import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, X, Monitor, Smartphone, HelpCircle, ExternalLink, Eye, EyeOff, GripVertical, Upload } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  SECTION_LABELS,
  DEFAULT_SECTION_ORDER,
  getSectionConfig,
  getSectionsOrder,
  isSectionVisible,
  setSectionConfigPatch,
  setSectionVisibilityPatch,
  setSectionsOrderPatch,
  ADDON_HOMEPAGE_ITEMS,
  ADDON_ROW_KEYS,
  ADDON_ROW_KEY_TO_ITEM,
  type HomepageSectionKey,
  type AddonHomepageItem,
} from "@/lib/homepage-sections";
import { SectionEditor } from "@/components/admin/layout-editor/HomepageSectionPanels";
import {
  LegacySectionEditor,
  LEGACY_EDITABLE_SECTIONS,
} from "@/components/admin/layout-editor/TheShoesLegacyEditor";
import { useAllAddonStatus, useAddonConfig, saveAddonConfig, type AddonKey } from "@/lib/addons";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchTheShoesSettings,
  upsertTheShoesSettings,
  DEFAULT_THE_SHOES_SETTINGS,
  type TheShoesSettings,
} from "@/lib/the-shoes-theme";

export const Route = createFileRoute("/admin/loja/layout/editar")({
  head: () => ({ meta: [{ title: "Editor de layout — ShopBox" }] }),
  component: EditorPage,
});

// ---------- types ----------
type Customizations = {
  colors?: {
    background?: string;
    text?: string;
    accent?: string;
    primaryButtonBg?: string;
    primaryButtonText?: string;
    badge?: string;
  };
  typography?: {
    headingFont?: string;
    headingSize?: number;
    headingBold?: boolean;
    largeHeadingSize?: number;
    bodyFont?: string;
    bodySize?: number;
  };
  header?: {
    bg?: string;
    text?: string;
    scrolledBg?: string;
    logoPosition?: "left" | "center";
    logoSize?: number;
    transparent?: boolean;
    announcementEnabled?: boolean;
    announcementText?: string; // legacy single
    announcementMessages?: string[];
    announcementBg?: string;
    announcementText_color?: string;
    announcementFontSize?: number;
    announcementSpeed?: number;
  };
  homepage?: {
    sections?: { id: string; visible: boolean }[];
    popup?: { enabled?: boolean; title?: string; text?: string; image?: string; ctaText?: string; ctaLink?: string; delay?: number };
  };
  productList?: {
    mobilePerRow?: string;
    desktopPerRow?: string;
    paginationMode?: string;
    quickBuy?: boolean;
    showColorVariations?: boolean;
    filtersRight?: boolean;
    categoryImage?: string;
  };
  productDetail?: Record<string, any>;
  cart?: {
    showSeeMore?: boolean;
    minPurchase?: string;
    quickCart?: boolean;
    addAction?: string;
    suggestRelated?: boolean;
    shippingCalc?: boolean;
  };
  footer?: {
    useCustomColors?: boolean;
    bg?: string;
    text?: string;
    showLangCurrency?: boolean;
    primaryMenuEnabled?: boolean;
    primaryMenuId?: string;
    secondaryMenuEnabled?: boolean;
    secondaryMenuId?: string;
    showContact?: boolean;
    phone?: string;
    email?: string;
  };
  customCss?: string;
};

const FONTS = [
  "Inter", "DM Sans", "Poppins", "Montserrat", "Playfair Display",
  "Big Shoulders Display", "Chivo", "Oswald", "Raleway", "Lato", "Nunito", "Source Sans Pro",
];

const DEFAULT_SECTIONS = [
  { id: "banners-rotativos", label: "Banners rotativos", visible: true },
  { id: "produtos-oferta", label: "Produtos em oferta", visible: true },
  { id: "mensagem-anuncios", label: "Mensagem de anúncios", visible: true },
  { id: "produtos-destaque", label: "Produtos em destaque", visible: true },
  { id: "mensagem-boas-vindas", label: "Mensagem de boas vindas", visible: true },
  { id: "produtos-novos", label: "Produtos novos", visible: true },
  { id: "banners-categorias", label: "Banners de categorias", visible: false },
  { id: "banners-promocionais", label: "Banners promocionais", visible: false },
  { id: "banners-novidades", label: "Banners de novidades", visible: false },
  { id: "produto-principal", label: "Produto principal", visible: false },
  { id: "info-frete", label: "Informações de frete, pagamento e compra", visible: false },
  { id: "marcas", label: "Marcas", visible: false },
  { id: "instagram", label: "Postagens do Instagram", visible: false },
  { id: "mensagem-institucional", label: "Mensagem institucional", visible: false },
  { id: "newsletter", label: "Newsletter", visible: false },
  { id: "categorias-principais", label: "Categorias principais", visible: false },
  { id: "video", label: "Vídeo", visible: false },
  { id: "depoimentos", label: "Depoimentos", visible: false },
  { id: "modulos-imagem-texto", label: "Módulos de imagem e texto", visible: false },
];

// ---------- main ----------
function EditorPage() {
  const navigate = useNavigate();
  const { data: store } = useMyStore();
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [section, setSection] = useState<string>("root");
  const [customizations, setCustomizations] = useState<Customizations>({});
  const [legacySettings, setLegacySettings] = useState<TheShoesSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [legacyDirty, setLegacyDirty] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isLegacyTheShoes = store?.slug === "the-shoes";

  // load existing
  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const { data } = await supabase
        .from("store_theme_settings")
        .select("customizations")
        .eq("store_id", store.id)
        .maybeSingle();
      setCustomizations(((data?.customizations as any) ?? {}) as Customizations);
      if (store.slug === "the-shoes") {
        try {
          const s = await fetchTheShoesSettings(store.id);
          setLegacySettings(s);
        } catch {
          setLegacySettings(DEFAULT_THE_SHOES_SETTINGS);
        }
      }
      setLoaded(true);
    })();
  }, [store?.id, store?.slug]);

  const update = (patch: Partial<Customizations> | ((c: Customizations) => Customizations)) => {
    setCustomizations((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      return next;
    });
    setDirty(true);
  };

  const updateLegacy = (patch: Partial<TheShoesSettings>) => {
    setLegacySettings((prev) => ({ ...(prev ?? DEFAULT_THE_SHOES_SETTINGS), ...patch }));
    setLegacyDirty(true);
  };

  const save = async () => {
    if (!store?.id) return;
    setSaving(true);
    try {
      if (dirty) {
        const { error } = await supabase
          .from("store_theme_settings")
          .upsert(
            { store_id: store.id, customizations: customizations as any },
            { onConflict: "store_id" },
          );
        if (error) throw error;
      }
      if (legacyDirty && legacySettings) {
        await upsertTheShoesSettings(store.id, legacySettings);
      }
      toast.success("Alterações publicadas");
      setDirty(false);
      setLegacyDirty(false);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center text-sm text-[#6b7280]">Carregando editor…</div>;
  }

  const canSave = dirty || legacyDirty;

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/admin/loja/layout" })}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[#111827] hover:bg-gray-50"
          >
            <X className="h-4 w-4" /> Editar layout
          </button>
          <span className="flex items-center gap-1.5 rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-[11px] font-medium text-[#16a34a]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#25d366]" /> Layout atual
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
          <button
            onClick={() => setDevice("mobile")}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", device === "mobile" ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]")}
          >
            <Smartphone className="h-3.5 w-3.5" /> Celulares
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", device === "desktop" ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280]")}
          >
            <Monitor className="h-3.5 w-3.5" /> Computadores
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#6b7280] hover:bg-gray-50">
            <HelpCircle className="h-4 w-4" /> Ajuda
          </button>
          {store && (
            <a
              href={`/loja/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#6b7280] hover:bg-gray-50"
            >
              Ver loja <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="flex w-[320px] flex-col border-r border-gray-200 bg-white">
          <div className="flex-1 overflow-y-auto">
            <Panel
              section={section}
              setSection={setSection}
              store={store}
              customizations={customizations}
              update={update}
              isLegacyTheShoes={isLegacyTheShoes}
              legacySettings={legacySettings}
              updateLegacy={updateLegacy}
            />
          </div>
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={save}
              disabled={saving || !canSave}
              className="h-11 w-full rounded-lg bg-[#25d366] text-sm font-bold text-white hover:bg-[#1fb959] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Publicando…" : "Publicar alterações"}
            </button>
          </div>
        </aside>

        {/* Preview */}
        <main className="flex-1 overflow-hidden bg-[#f5f5f5] p-4">
          {store ? (
            <div className={cn("mx-auto h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", device === "mobile" ? "w-[390px]" : "w-full")}>
              <iframe
                ref={iframeRef}
                key={reloadKey}
                src={`/loja/${store.slug}?preview=true`}
                className="h-full w-full"
                title="Preview da loja"
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

// ---------- Panel router ----------
function Panel({ section, setSection, store, customizations, update, isLegacyTheShoes, legacySettings, updateLegacy }: any) {
  const back = (to = "root") => (
    <button onClick={() => setSection(to)} className="mb-4 flex items-center gap-1 text-sm font-medium text-[#111827] hover:text-[#25d366]">
      <ChevronLeft className="h-4 w-4" /> {section === to ? "Voltar" : "Voltar"}
    </button>
  );

  // Section-specific drilling for homepage sub-sections (e.g. "homepage:banners_rotativos")
  if (section.startsWith("homepage:")) {
    const key = section.slice("homepage:".length) as HomepageSectionKey;
    return (
      <>
        <div className="p-4">
          <button onClick={() => setSection("homepage")} className="mb-4 flex items-center gap-1 text-sm font-medium text-[#111827] hover:text-[#25d366]">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">{SECTION_LABELS[key] ?? key}</h2>
        </div>
        <div className="px-4 pb-6">
          {isLegacyTheShoes && legacySettings ? (
            <LegacySectionEditor
              storeId={store?.id}
              sectionKey={key}
              settings={legacySettings}
              onChange={updateLegacy}
            />
          ) : (
            <SectionEditor
              storeId={store?.id}
              sectionKey={key}
              cfg={getSectionConfig(customizations, key)}
              onChange={(nextCfg) => update((prev: any) => ({ ...prev, ...setSectionConfigPatch(prev, key, nextCfg) }))}
            />
          )}
        </div>
      </>
    );
  }

  switch (section) {
    case "root":
      return <RootPanel setSection={setSection} store={store} update={update} customizations={customizations} />;
    case "colors":
      return <><div className="p-4">{back()}</div><ColorsPanel customizations={customizations} update={update} /></>;
    case "typography":
      return <><div className="p-4">{back()}</div><TypographyPanel customizations={customizations} update={update} /></>;
    case "header":
      return <><div className="p-4">{back()}</div><HeaderPanel customizations={customizations} update={update} /></>;
    case "homepage":
      return <><div className="p-4">{back()}</div><HomepagePanel customizations={customizations} update={update} setSection={setSection} isLegacyTheShoes={isLegacyTheShoes} store={store} /></>;
    case "product-list":
      return <><div className="p-4">{back()}</div><ProductListPanel customizations={customizations} update={update} /></>;
    case "product-detail":
      return <><div className="p-4">{back()}</div><ProductDetailPanel customizations={customizations} update={update} /></>;
    case "cart":
      return <><div className="p-4">{back()}</div><CartPanel customizations={customizations} update={update} /></>;
    case "footer":
      return <><div className="p-4">{back()}</div><FooterPanel customizations={customizations} update={update} storeId={store?.id} /></>;
    case "css":
      return <><div className="p-4">{back()}</div><CssPanel customizations={customizations} update={update} /></>;
    default:
      return null;
  }
}

// ---------- Root ----------
function RootPanel({ setSection, store, update }: any) {
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleLogo(file: File) {
    if (!store?.id || file.size > 2 * 1024 * 1024) {
      toast.error("Imagem maior que 2MB");
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${store.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("logo").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("logo").getPublicUrl(path);
      const { error } = await supabase.from("stores").update({ logo_url: data.publicUrl }).eq("id", store.id);
      if (error) throw error;
      toast.success("Logo atualizada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro no upload");
    } finally {
      setLogoUploading(false);
    }
  }

  return (
    <div className="p-3">
      <Group>
        <UploadRow label="Imagem da sua marca" hint="PNG, JPG, SVG · máximo 2MB" busy={logoUploading} onFile={handleLogo} preview={store?.logo_url} />
        <Row label="Cores da sua marca" onClick={() => setSection("colors")} />
        <Row label="Tipo de Letra" onClick={() => setSection("typography")} />
      </Group>
      <p className="mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">Configurações avançadas</p>
      <Group>
        <Row label="Cabeçalho" onClick={() => setSection("header")} />
        <Row label="Página inicial" onClick={() => setSection("homepage")} />
        <Row label="Lista de produtos" onClick={() => setSection("product-list")} />
        <Row label="Detalhe do produto" onClick={() => setSection("product-detail")} />
        <Row label="Carrinho de compras" onClick={() => setSection("cart")} />
        <Row label="Rodapé da página" onClick={() => setSection("footer")} />
        <Row label="Edição de CSS avançada" onClick={() => setSection("css")} />
      </Group>
    </div>
  );
}

// ---------- shared UI ----------
function Group({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-gray-200">{children}</div>;
}

function Row({ label, hint, leading, onClick }: { label: string; hint?: string; leading?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        {leading}
        <div>
          <p className="text-sm font-medium text-[#111827]">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-[#6b7280]">{hint}</p>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[#9ca3af]" />
    </button>
  );
}

function UploadRow({ label, hint, busy, onFile, preview }: { label: string; hint?: string; busy?: boolean; onFile: (f: File) => void; preview?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border-b border-gray-100 bg-white px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#111827]">{label}</p>
        <button onClick={() => inputRef.current?.click()} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50">
          {busy ? "Enviando…" : preview ? "Trocar" : "Enviar"}
        </button>
      </div>
      {preview && <img src={preview} alt="" className="mt-3 h-16 rounded border border-gray-100 bg-gray-50 object-contain p-1" />}
      {hint && <p className="mt-1.5 text-xs text-[#6b7280]">{hint}</p>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

function ColorSwatchRow({ label, value, defaultColor, hint, onChange }: { label: string; value?: string; defaultColor: string; hint?: string; onChange: (v: string) => void }) {
  const v = value ?? defaultColor;
  return (
    <div className="border-b border-gray-100 bg-white px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-block h-6 w-6 rounded-full border border-gray-200" style={{ background: v }} />
          <p className="text-sm font-medium text-[#111827]">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={v} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-gray-200" />
          <input
            value={v}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-20 rounded border border-gray-200 px-2 text-xs"
          />
        </div>
      </div>
      {hint && <p className="mt-1.5 text-xs text-[#6b7280]">{hint}</p>}
    </div>
  );
}

function FieldLabel({ children }: any) {
  return <label className="mb-1.5 block text-xs font-medium text-[#374151]">{children}</label>;
}
function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]", props.className)} />;
}
function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#25d366]", props.className)} />;
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
function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-[#374151]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
      <span>{label}</span>
    </label>
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

// ---------- Colors ----------
function ColorsPanel({ customizations, update }: any) {
  const c = customizations.colors ?? {};
  const set = (k: string, v: string) => update({ colors: { ...c, [k]: v } });
  const palettes = [
    { name: "Clássica", bg: "#ffffff", text: "#111111", accent: "#25d366" },
    { name: "Escura", bg: "#0f172a", text: "#f1f5f9", accent: "#22d3ee" },
    { name: "Quente", bg: "#fffaf0", text: "#1f2937", accent: "#f97316" },
    { name: "Pastel", bg: "#fef3f2", text: "#1f1147", accent: "#a855f7" },
  ];
  return (
    <div className="px-3 pb-6">
      <h2 className="mb-3 px-1 text-base font-semibold text-[#111827]">Cores da sua marca</h2>
      <Group>
        <ColorSwatchRow label="Cor de fundo" defaultColor="#ffffff" value={c.background} onChange={(v) => set("background", v)} />
        <ColorSwatchRow label="Cor dos textos" defaultColor="#111111" value={c.text} onChange={(v) => set("text", v)} />
        <ColorSwatchRow
          label="Cor de destaque"
          defaultColor="#25d366"
          value={c.accent}
          hint="Aparece nos textos de desconto, frete grátis e parcelamento sem juros."
          onChange={(v) => set("accent", v)}
        />
        <ColorSwatchRow label="Botão principal — fundo" defaultColor="#111111" value={c.primaryButtonBg} onChange={(v) => set("primaryButtonBg", v)} />
        <ColorSwatchRow label="Botão principal — texto" defaultColor="#ffffff" value={c.primaryButtonText} onChange={(v) => set("primaryButtonText", v)} />
        <ColorSwatchRow label="Etiquetas de promoção" defaultColor="#ef4444" value={c.badge} onChange={(v) => set("badge", v)} />
      </Group>
      <p className="mt-5 mb-2 px-1 text-xs font-semibold uppercase text-[#9ca3af]">Combinações pré-definidas</p>
      <div className="grid grid-cols-2 gap-2">
        {palettes.map((p) => (
          <button
            key={p.name}
            onClick={() => update({ colors: { ...c, background: p.bg, text: p.text, accent: p.accent } })}
            className="rounded-lg border border-gray-200 p-2 text-left hover:border-[#25d366]"
          >
            <div className="flex gap-1">
              <span className="h-6 w-6 rounded-full border border-gray-200" style={{ background: p.bg }} />
              <span className="h-6 w-6 rounded-full" style={{ background: p.text }} />
              <span className="h-6 w-6 rounded-full" style={{ background: p.accent }} />
            </div>
            <p className="mt-1.5 text-xs font-medium">{p.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Typography ----------
function TypographyPanel({ customizations, update }: any) {
  const t = customizations.typography ?? {};
  const set = (k: string, v: any) => update({ typography: { ...t, [k]: v } });
  return (
    <div className="space-y-5 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Tipo de Letra</h2>

      <section className="space-y-3">
        <p className="text-sm font-semibold">Títulos</p>
        <div>
          <FieldLabel>Fonte</FieldLabel>
          <SelectInput value={t.headingFont ?? "Inter"} onChange={(e) => set("headingFont", e.target.value)} style={{ fontFamily: t.headingFont }}>
            {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Tamanho</FieldLabel>
          <Slider value={t.headingSize ?? 28} min={16} max={48} onChange={(v) => set("headingSize", v)} />
        </div>
        <div>
          <FieldLabel>Estilo</FieldLabel>
          <div className="flex gap-2">
            <button onClick={() => set("headingBold", true)} className={cn("h-9 rounded-lg border px-3 text-sm font-bold", t.headingBold ? "border-[#25d366] bg-[#f0fdf4]" : "border-gray-200")}>B negrito</button>
            <button onClick={() => set("headingBold", false)} className={cn("h-9 rounded-lg border px-3 text-sm", !t.headingBold ? "border-[#25d366] bg-[#f0fdf4]" : "border-gray-200")}>Aa normal</button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold">Títulos grandes</p>
        <FieldLabel>Tamanho</FieldLabel>
        <Slider value={t.largeHeadingSize ?? 100} min={48} max={120} onChange={(v) => set("largeHeadingSize", v)} />
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold">Textos</p>
        <div>
          <FieldLabel>Fonte</FieldLabel>
          <SelectInput value={t.bodyFont ?? "Inter"} onChange={(e) => set("bodyFont", e.target.value)} style={{ fontFamily: t.bodyFont }}>
            {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </SelectInput>
        </div>
        <FieldLabel>Tamanho</FieldLabel>
        <Slider value={t.bodySize ?? 14} min={12} max={20} onChange={(v) => set("bodySize", v)} />
      </section>
    </div>
  );
}

// ---------- Header ----------
function HeaderPanel({ customizations, update }: any) {
  const h = customizations.header ?? {};
  const set = (k: string, v: any) => update({ header: { ...h, [k]: v } });
  return (
    <div className="space-y-4 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Cabeçalho</h2>

      <section>
        <p className="mb-2 text-sm font-semibold">Cores</p>
        <Group>
          <ColorSwatchRow label="Fundo" defaultColor="#ffffff" value={h.bg} onChange={(v) => set("bg", v)} />
          <ColorSwatchRow label="Texto e ícones" defaultColor="#111111" value={h.text} onChange={(v) => set("text", v)} />
          <ColorSwatchRow label="Fundo ao rolar" defaultColor="#ffffff" value={h.scrolledBg} onChange={(v) => set("scrolledBg", v)} />
        </Group>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold">Logo</p>
        <FieldLabel>Posição</FieldLabel>
        <SelectInput value={h.logoPosition ?? "left"} onChange={(e) => set("logoPosition", e.target.value)}>
          <option value="left">À esquerda</option>
          <option value="center">Centralizado</option>
        </SelectInput>
        <FieldLabel>Tamanho</FieldLabel>
        <Slider value={h.logoSize ?? 40} min={20} max={120} onChange={(v) => set("logoSize", v)} />
      </section>

      <section className="space-y-2">
        <Toggle checked={!!h.transparent} onChange={(v) => set("transparent", v)} label="Cabeçalho transparente (sobre o banner)" />
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 p-3">
        <p className="text-sm font-semibold">Barra de anúncio</p>
        <Toggle checked={!!h.announcementEnabled} onChange={(v) => set("announcementEnabled", v)} label="Ativar barra" />
        <FieldLabel>Mensagens (até 5)</FieldLabel>
        {(() => {
          const messages: string[] =
            (Array.isArray(h.announcementMessages) && h.announcementMessages.length
              ? h.announcementMessages
              : h.announcementText
              ? [h.announcementText]
              : [""]) as string[];
          const updateMessages = (next: string[]) => set("announcementMessages", next);
          return (
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextInput
                    value={msg}
                    onChange={(e) => {
                      const next = [...messages];
                      next[i] = e.target.value;
                      updateMessages(next);
                    }}
                    placeholder="PARCELE EM ATÉ 3X SEM JUROS"
                  />
                  <button
                    type="button"
                    onClick={() => updateMessages(messages.filter((_, idx) => idx !== i))}
                    className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    disabled={messages.length <= 1}
                  >
                    Remover
                  </button>
                </div>
              ))}
              {messages.length < 5 && (
                <button
                  type="button"
                  onClick={() => updateMessages([...messages, ""])}
                  className="rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  + Adicionar mensagem
                </button>
              )}
            </div>
          );
        })()}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Cor de fundo</FieldLabel>
            <input type="color" value={h.announcementBg ?? "#111111"} onChange={(e) => set("announcementBg", e.target.value)} className="h-9 w-full rounded border border-gray-200" />
          </div>
          <div>
            <FieldLabel>Cor do texto</FieldLabel>
            <input type="color" value={h.announcementText_color ?? "#ffffff"} onChange={(e) => set("announcementText_color", e.target.value)} className="h-9 w-full rounded border border-gray-200" />
          </div>
        </div>
        <div>
          <FieldLabel>Tamanho do texto ({h.announcementFontSize ?? 14}px)</FieldLabel>
          <Slider value={h.announcementFontSize ?? 14} min={12} max={20} onChange={(v) => set("announcementFontSize", v)} />
        </div>
        <div>
          <FieldLabel>Velocidade da animação ({h.announcementSpeed ?? 30}s)</FieldLabel>
          <Slider value={h.announcementSpeed ?? 30} min={10} max={120} onChange={(v) => set("announcementSpeed", v)} />
        </div>
      </section>
    </div>
  );
}

// ---------- Homepage ----------
function HomepagePanel({ customizations, update, setSection, isLegacyTheShoes, store }: any) {
  const navigate = useNavigate();
  const addonStatusQ = useAllAddonStatus(store?.id);
  const activeAddons = addonStatusQ.data ?? {};

  // Combine regular sections with addon rows (active addons only),
  // honoring sections_order positions for addon rows that have been placed.
  const baseOrder = useMemo(
    () => (isLegacyTheShoes ? DEFAULT_SECTION_ORDER : getSectionsOrder(customizations)),
    [customizations, isLegacyTheShoes],
  );

  const combinedOrder = useMemo<string[]>(() => {
    if (isLegacyTheShoes) return baseOrder;
    const stored = (customizations?.homepage?.sections_order ?? []) as string[];
    const result: string[] = [...baseOrder];
    // Insert addon rows already present in stored order at their stored index
    const addonsInStored = stored.filter((k) => ADDON_ROW_KEYS.includes(k));
    for (const k of addonsInStored) {
      if (!result.includes(k)) {
        const idx = stored.indexOf(k);
        // Insert at same position as in stored order if reasonable, else append
        result.splice(Math.min(idx, result.length), 0, k);
      }
    }
    // Append any active addons not yet in the order
    for (const item of ADDON_HOMEPAGE_ITEMS) {
      if (activeAddons[item.addonKey] && !result.includes(item.rowKey)) {
        result.push(item.rowKey);
      }
    }
    // Hide the regular "video" row — superseded by the video_commerce addon row
    return result.filter((k) => {
      if (k === "video") return false;
      if (ADDON_ROW_KEYS.includes(k)) {
        const item = ADDON_ROW_KEY_TO_ITEM[k];
        return !!activeAddons[item.addonKey];
      }
      return true;
    });
  }, [baseOrder, customizations, activeAddons, isLegacyTheShoes]);

  const persistOrder = (next: string[]) => {
    update((prev: any) => ({ ...prev, ...setSectionsOrderPatch(prev, next as any) }));
  };

  const toggleSection = (key: HomepageSectionKey) => {
    if (isLegacyTheShoes) {
      toast.info("Visibilidade não é editável nesta loja (layout legado).");
      return;
    }
    const next = !isSectionVisible(customizations, key);
    update((prev: any) => ({ ...prev, ...setSectionVisibilityPatch(prev, key, next) }));
  };

  const move = (idx: number, dir: -1 | 1) => {
    if (isLegacyTheShoes) {
      toast.info("Ordem das seções não é editável nesta loja (layout legado).");
      return;
    }
    const j = idx + dir;
    if (j < 0 || j >= combinedOrder.length) return;
    const next = [...combinedOrder];
    [next[idx], next[j]] = [next[j], next[idx]];
    persistOrder(next);
  };

  const popup = customizations.homepage?.popup ?? {};
  const setPopup = (patch: any) =>
    update({ homepage: { ...(customizations.homepage ?? {}), popup: { ...popup, ...patch } } });

  return (
    <div className="space-y-4 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Página inicial</h2>
      <p className="text-xs text-[#6b7280]">
        {isLegacyTheShoes
          ? "Edite o conteúdo de cada seção. A ordem e o visual desta loja são fixos."
          : "Clique no nome de cada seção para configurar. Use o olho para mostrar/ocultar."}
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {combinedOrder.map((key, idx) => {
          if (ADDON_ROW_KEYS.includes(key)) {
            const item = ADDON_ROW_KEY_TO_ITEM[key];
            return (
              <AddonRow
                key={key}
                item={item}
                storeId={store?.id}
                isLegacyTheShoes={isLegacyTheShoes}
                onMoveUp={() => move(idx, -1)}
                onMoveDown={() => move(idx, 1)}
                onNavigate={() => navigate({ to: `/admin/marketing/${item.urlSlug}` as any })}
              />
            );
          }
          const sectionKey = key as HomepageSectionKey;
          const visible = isSectionVisible(customizations, sectionKey);
          const label = SECTION_LABELS[sectionKey] ?? sectionKey;
          const legacyEditable = LEGACY_EDITABLE_SECTIONS.includes(sectionKey);
          return (
            <div key={key} className="flex items-center gap-2 border-b border-gray-100 px-2 py-2 last:border-b-0">
              {!isLegacyTheShoes && (
                <>
                  <div className="flex flex-col">
                    <button onClick={() => move(idx, -1)} className="text-[10px] text-[#9ca3af] hover:text-[#111827]">▲</button>
                    <button onClick={() => move(idx, 1)} className="text-[10px] text-[#9ca3af] hover:text-[#111827]">▼</button>
                  </div>
                  <GripVertical className="h-4 w-4 text-[#d1d5db]" />
                  <button onClick={() => toggleSection(sectionKey)} className="shrink-0" aria-label={visible ? "Ocultar" : "Mostrar"}>
                    {visible ? <Eye className="h-4 w-4 text-[#25d366]" /> : <EyeOff className="h-4 w-4 text-[#9ca3af]" />}
                  </button>
                </>
              )}
              <button
                onClick={() => setSection(`homepage:${sectionKey}`)}
                className={cn(
                  "flex flex-1 items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-50",
                  isLegacyTheShoes && !legacyEditable ? "text-[#9ca3af]" : visible ? "text-[#111827]" : "text-[#9ca3af]",
                )}
              >
                <span>{label}</span>
                <div className="flex items-center gap-2">
                  {isLegacyTheShoes && !legacyEditable && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-[#6b7280]">não editável</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#d1d5db]" />
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {!isLegacyTheShoes && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Pop-up promocional</p>
            <Toggle checked={!!popup.enabled} onChange={(v) => setPopup({ enabled: v })} />
          </div>
          {popup.enabled && (
            <div className="mt-3 space-y-2">
              <TextInput placeholder="Título" value={popup.title ?? ""} onChange={(e) => setPopup({ title: e.target.value })} />
              <TextInput placeholder="Texto" value={popup.text ?? ""} onChange={(e) => setPopup({ text: e.target.value })} />
              <TextInput placeholder="URL da imagem" value={popup.image ?? ""} onChange={(e) => setPopup({ image: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <TextInput placeholder="CTA texto" value={popup.ctaText ?? ""} onChange={(e) => setPopup({ ctaText: e.target.value })} />
                <TextInput placeholder="CTA link" value={popup.ctaLink ?? ""} onChange={(e) => setPopup({ ctaLink: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Delay (segundos)</FieldLabel>
                <Slider value={popup.delay ?? 3} min={0} max={30} onChange={(v) => setPopup({ delay: v })} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddonRow({
  item, storeId, isLegacyTheShoes, onMoveUp, onMoveDown, onNavigate,
}: {
  item: AddonHomepageItem;
  storeId: string | undefined;
  isLegacyTheShoes: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNavigate: () => void;
}) {
  const qc = useQueryClient();
  const cfgQ = useAddonConfig<any>(storeId, item.addonKey as AddonKey);
  const cfg = cfgQ.data ?? {};
  // Default active=true when unset, so a freshly-purchased addon shows up.
  const active = cfg.active !== false;
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    try {
      const next = { ...cfg, active: !active };
      await saveAddonConfig(storeId, item.addonKey as AddonKey, next);
      qc.setQueryData(["store_addon_config", storeId, item.addonKey], next);
      qc.invalidateQueries({ queryKey: ["store_addon_config", storeId, item.addonKey] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar addon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-2 last:border-b-0">
      {!isLegacyTheShoes && (
        <>
          <div className="flex flex-col">
            <button onClick={onMoveUp} className="text-[10px] text-[#9ca3af] hover:text-[#111827]">▲</button>
            <button onClick={onMoveDown} className="text-[10px] text-[#9ca3af] hover:text-[#111827]">▼</button>
          </div>
          <GripVertical className="h-4 w-4 text-[#d1d5db]" />
          <button onClick={toggle} className="shrink-0" aria-label={active ? "Ocultar" : "Mostrar"} disabled={saving}>
            {active ? <Eye className="h-4 w-4 text-[#25d366]" /> : <EyeOff className="h-4 w-4 text-[#9ca3af]" />}
          </button>
        </>
      )}
      <button
        onClick={onNavigate}
        className={cn(
          "flex flex-1 items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-50",
          active ? "text-[#111827]" : "text-[#9ca3af]",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate">
            <span aria-hidden>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#9ca3af]">Configurado em Marketing</p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
      </button>
    </div>
  );
}

// ---------- Product list ----------
function ProductListPanel({ customizations, update }: any) {
  const p = customizations.productList ?? {};
  const set = (k: string, v: any) => update({ productList: { ...p, [k]: v } });
  return (
    <div className="space-y-4 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Lista de produtos</h2>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Imagem para as categorias</p>
        <div className="flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-[#6b7280] hover:border-[#25d366]">+ Selecionar imagem</div>
        <p className="text-xs text-[#6b7280]">Tamanho recomendado: 1580px x 220px</p>
        <Link to="/admin/categorias" className="text-xs font-medium text-[#25d366] hover:underline">Pode subir uma imagem diferente para cada categoria por aqui</Link>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Filtros</p>
        <Check checked={!!p.filtersRight} onChange={(v) => set("filtersRight", v)} label="Abrir filtros à direita da lista de produtos (só em computadores)" />
        <Link to="/admin/loja/filtros" className="text-xs font-medium text-[#25d366] hover:underline">Configure os filtros da sua loja no administrador</Link>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Produtos na lista</p>
        <FieldLabel>Quantidade em celulares</FieldLabel>
        <SelectInput value={p.mobilePerRow ?? "2"} onChange={(e) => set("mobilePerRow", e.target.value)}>
          <option value="1">1 produto</option>
          <option value="2">2 produtos</option>
          <option value="mixed">1 e 2 produtos (intercalados)</option>
        </SelectInput>
        <FieldLabel>Quantidade em computadores</FieldLabel>
        <SelectInput value={p.desktopPerRow ?? "4"} onChange={(e) => set("desktopPerRow", e.target.value)}>
          <option value="2">2 produtos</option>
          <option value="3">3 produtos</option>
          <option value="4">4 produtos</option>
          <option value="5">5 produtos</option>
        </SelectInput>
        <FieldLabel>Mostrar produtos usando</FieldLabel>
        <SelectInput value={p.paginationMode ?? "pagination"} onChange={(e) => set("paginationMode", e.target.value)}>
          <option value="pagination">Paginação</option>
          <option value="infinite">Carregamento infinito</option>
          <option value="see-more">Botão ver mais</option>
        </SelectInput>
      </section>

      <Check checked={!!p.quickBuy} onChange={(v) => set("quickBuy", v)} label="Permitir compra rápida na lista de produtos" />
      <Check checked={!!p.showColorVariations} onChange={(v) => set("showColorVariations", v)} label="Mostrar variações de cor na lista de produtos" />
    </div>
  );
}

// ---------- Product detail ----------
function ProductDetailPanel({ customizations, update }: any) {
  const p = customizations.productDetail ?? {};
  const set = (k: string, v: any) => update({ productDetail: { ...p, [k]: v } });
  const items: { key: string; label: string; render?: () => React.ReactNode }[] = [
    { key: "gallery", label: "Fotos do produto", render: () => (
      <>
        <FieldLabel>Posição</FieldLabel>
        <SelectInput value={p.galleryPosition ?? "side"} onChange={(e) => set("galleryPosition", e.target.value)}>
          <option value="side">Lateral</option><option value="carousel">Carrossel</option>
        </SelectInput>
        <Check checked={!!p.galleryZoom} onChange={(v) => set("galleryZoom", v)} label="Zoom ao passar o mouse" />
      </>
    )},
    { key: "shipping", label: "Formas de entrega", render: () => (
      <Toggle checked={!!p.showShippingCalc} onChange={(v) => set("showShippingCalc", v)} label="Mostrar calculadora de frete" />
    )},
    { key: "installments", label: "Informações das parcelas", render: () => (
      <>
        <Toggle checked={!!p.showInstallments} onChange={(v) => set("showInstallments", v)} label="Mostrar parcelas" />
        <FieldLabel>Máx. parcelas</FieldLabel>
        <SelectInput value={p.maxInstallments ?? "12"} onChange={(e) => set("maxInstallments", e.target.value)}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1)}>{i + 1}x</option>)}
        </SelectInput>
        <Check checked={!!p.noInterest} onChange={(v) => set("noInterest", v)} label="Sem juros" />
      </>
    )},
    { key: "pix", label: "Desconto por meio de pagamento", render: () => (
      <>
        <Toggle checked={!!p.showPixDiscount} onChange={(v) => set("showPixDiscount", v)} label="Mostrar desconto PIX" />
        <FieldLabel>% desconto</FieldLabel>
        <Slider value={p.pixDiscount ?? 5} min={0} max={20} onChange={(v) => set("pixDiscount", v)} />
      </>
    )},
    { key: "variations", label: "Variações do produto", render: () => (
      <>
        <FieldLabel>Estilo</FieldLabel>
        <SelectInput value={p.variationStyle ?? "buttons"} onChange={(e) => set("variationStyle", e.target.value)}>
          <option value="buttons">Botões</option><option value="dropdown">Dropdown</option>
        </SelectInput>
        <FieldLabel>Label</FieldLabel>
        <TextInput value={p.variationLabel ?? "Selecione o tamanho"} onChange={(e) => set("variationLabel", e.target.value)} />
      </>
    )},
    { key: "sizeguide", label: "Guia de medidas", render: () => (
      <>
        <Toggle checked={!!p.sizeGuide} onChange={(v) => set("sizeGuide", v)} label="Ativar guia" />
        <TextInput placeholder="URL da imagem" value={p.sizeGuideImage ?? ""} onChange={(e) => set("sizeGuideImage", e.target.value)} />
      </>
    )},
    { key: "sku", label: "SKU", render: () => <Toggle checked={!!p.showSku} onChange={(v) => set("showSku", v)} label="Mostrar SKU" /> },
    { key: "stock", label: "Estoque", render: () => (
      <>
        <Toggle checked={!!p.showStock} onChange={(v) => set("showStock", v)} label="Mostrar quantidade em estoque" />
        <TextInput placeholder="Últimas unidades disponíveis!" value={p.lowStockMessage ?? ""} onChange={(e) => set("lowStockMessage", e.target.value)} />
      </>
    )},
    { key: "description", label: "Descrição do produto", render: () => (
      <>
        <Check checked={!!p.descExpandable} onChange={(v) => set("descExpandable", v)} label="Expandir/recolher" />
        <FieldLabel>Posição</FieldLabel>
        <SelectInput value={p.descPosition ?? "below"} onChange={(e) => set("descPosition", e.target.value)}>
          <option value="below">Abaixo das fotos</option><option value="tab">Aba separada</option>
        </SelectInput>
      </>
    )},
    { key: "facebook", label: "Facebook", render: () => <Toggle checked={!!p.showFacebookShare} onChange={(v) => set("showFacebookShare", v)} label="Mostrar botão Facebook" /> },
    { key: "related", label: "Produtos relacionados", render: () => (
      <>
        <Toggle checked={!!p.showRelated} onChange={(v) => set("showRelated", v)} label="Mostrar relacionados" />
        <TextInput placeholder="Título da seção" value={p.relatedTitle ?? "Você também pode gostar"} onChange={(e) => set("relatedTitle", e.target.value)} />
        <FieldLabel>Quantidade</FieldLabel>
        <SelectInput value={p.relatedCount ?? "4"} onChange={(e) => set("relatedCount", e.target.value)}>
          <option value="4">4</option><option value="8">8</option>
        </SelectInput>
      </>
    )},
  ];
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2 px-3 pb-6">
      <h2 className="mb-2 px-1 text-base font-semibold text-[#111827]">Detalhe do produto</h2>
      {items.map((it) => (
        <div key={it.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <button onClick={() => setOpen(open === it.key ? null : it.key)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-gray-50">
            {it.label}
            <ChevronRight className={cn("h-4 w-4 text-[#9ca3af] transition-transform", open === it.key && "rotate-90")} />
          </button>
          {open === it.key && it.render && <div className="space-y-2 border-t border-gray-100 p-4">{it.render()}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------- Cart ----------
function CartPanel({ customizations, update }: any) {
  const c = customizations.cart ?? {};
  const set = (k: string, v: any) => update({ cart: { ...c, [k]: v } });
  return (
    <div className="space-y-4 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Carrinho de compras</h2>
      <Check checked={!!c.showSeeMore} onChange={(v) => set("showSeeMore", v)} label="Mostrar o botão 'Ver mais produtos' no carrinho" />

      <section className="space-y-2">
        <p className="text-sm font-semibold">Valor mínimo de compra</p>
        <p className="text-xs text-[#6b7280]">Preencha somente se a loja for do tipo atacado.</p>
        <TextInput placeholder="Ex: 3000" value={c.minPurchase ?? ""} onChange={(e) => set("minPurchase", e.target.value.replace(/\D/g, ""))} />
        <p className="text-xs text-[#6b7280]">Insira apenas números.</p>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Carrinho de compra rápida</p>
        <Check checked={!!c.quickCart} onChange={(v) => set("quickCart", v)} label="Permitir adicionar produtos sem precisar ir a outra página" />
        <FieldLabel>Ação ao adicionar</FieldLabel>
        <SelectInput value={c.addAction ?? "notify"} onChange={(e) => set("addAction", e.target.value)}>
          <option value="notify">Mostrar uma notificação</option>
          <option value="drawer">Abrir o carrinho lateral</option>
          <option value="page">Ir para o carrinho</option>
        </SelectInput>
      </section>

      <section className="space-y-1">
        <p className="text-sm font-semibold">Recomendações de produtos</p>
        <Check checked={!!c.suggestRelated} onChange={(v) => set("suggestRelated", v)} label="Sugerir produtos complementares ao adicionar ao carrinho" />
      </section>

      <section className="space-y-1">
        <p className="text-sm font-semibold">Formas de entrega</p>
        <Check checked={!!c.shippingCalc} onChange={(v) => set("shippingCalc", v)} label="Mostrar calculadora de frete e lojas físicas no carrinho" />
        <Link to="/admin/configuracoes" className="text-xs font-medium text-[#25d366] hover:underline">Adicionar meios de envio ou lojas físicas</Link>
      </section>
    </div>
  );
}

// ---------- Footer ----------
function FooterPanel({ customizations, update, storeId }: any) {
  const f = customizations.footer ?? {};
  const set = (k: string, v: any) => update({ footer: { ...f, [k]: v } });
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      const { data } = await supabase.from("store_menus").select("id, name").eq("store_id", storeId);
      setMenus((data as any) ?? []);
    })();
  }, [storeId]);

  return (
    <div className="space-y-4 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Rodapé da página</h2>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Cores</p>
        <Check checked={!!f.useCustomColors} onChange={(v) => set("useCustomColors", v)} label="Usar estas cores para o rodapé" />
        {f.useCustomColors && (
          <Group>
            <ColorSwatchRow label="Cor de fundo" defaultColor="#111111" value={f.bg} onChange={(v) => set("bg", v)} />
            <ColorSwatchRow label="Cor dos textos e ícones" defaultColor="#ffffff" value={f.text} onChange={(v) => set("text", v)} />
          </Group>
        )}
      </section>

      <Check checked={!!f.showLangCurrency} onChange={(v) => set("showLangCurrency", v)} label="Mostrar idiomas e moedas no rodapé" />

      <section className="space-y-2">
        <p className="text-sm font-semibold">Menus</p>
        <p className="text-xs text-[#6b7280]">
          Escolher menu para o rodapé. Caso não tenha nenhum configurado, pode fazê-lo{" "}
          <Link to="/admin/loja/menus" className="font-medium text-[#25d366] hover:underline">aqui</Link>.
        </p>
        <div className="rounded-lg border border-gray-200 p-3">
          <Check checked={!!f.primaryMenuEnabled} onChange={(v) => set("primaryMenuEnabled", v)} label="Exibir menu principal" />
          {f.primaryMenuEnabled && (
            <SelectInput className="mt-2" value={f.primaryMenuId ?? ""} onChange={(e) => set("primaryMenuId", e.target.value)}>
              <option value="">Selecione…</option>
              {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectInput>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <Check checked={!!f.secondaryMenuEnabled} onChange={(v) => set("secondaryMenuEnabled", v)} label="Exibir menu secundário" />
          {f.secondaryMenuEnabled && (
            <SelectInput className="mt-2" value={f.secondaryMenuId ?? ""} onChange={(e) => set("secondaryMenuId", e.target.value)}>
              <option value="">Selecione…</option>
              {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectInput>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">Dados de contato</p>
        <Check checked={!!f.showContact} onChange={(v) => set("showContact", v)} label="Mostrar dados de contato no rodapé" />
        {f.showContact && (
          <>
            <TextInput placeholder="Telefone / WhatsApp" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            <TextInput placeholder="E-mail de contato" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </>
        )}
      </section>
    </div>
  );
}

// ---------- CSS ----------
function CssPanel({ customizations, update }: any) {
  return (
    <div className="space-y-3 px-4 pb-6">
      <h2 className="text-base font-semibold text-[#111827]">Edição de CSS avançada</h2>
      <p className="text-xs text-[#6b7280]">O CSS será aplicado em toda a sua loja. Use com cuidado.</p>
      <textarea
        value={customizations.customCss ?? ""}
        onChange={(e) => update({ customCss: e.target.value })}
        spellCheck={false}
        className="h-72 w-full rounded-lg border border-gray-200 bg-[#0f172a] p-3 font-mono text-xs text-[#e2e8f0] outline-none"
        placeholder="/* Seu CSS aqui */"
      />
    </div>
  );
}
