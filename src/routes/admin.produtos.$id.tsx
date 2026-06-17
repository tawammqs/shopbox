import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, X, Save, Trash2, Pencil, Check, ChevronDown, ChevronRight,
  Sparkles, Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiImageUpload } from "@/components/admin/ImageUpload";
import { PlanGate } from "@/components/admin/PlanGate";
import { VariationsBuilder } from "@/components/admin/VariationsBuilder";
import { VideoSourcePicker } from "@/components/admin/VideoSourcePicker";
import type { VideoType } from "@/lib/video";
import { slugify } from "@/lib/format";
import { generateProductContent } from "@/lib/ai-product.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProductFormPage,
});

const FEATURED_SECTIONS = [
  { id: "destaque", label: "⭐ Destaque" },
  { id: "lancamento", label: "🆕 Lançamento" },
  { id: "mais_vendido", label: "🔥 Mais vendido" },
  { id: "promocao", label: "🎯 Promoção" },
] as const;

type ColorRow = { id?: string; name: string; hex: string; position: number };
type SizeRow = { id?: string; label: string; position: number };
type VideoRow = { id?: string; video_url: string; kind: "youtube" | "mp4"; customer_name: string; quote: string; rating: number; position: number };

function ProductFormPage() {
  const { id } = useParams({ from: "/admin/produtos/$id" });
  const isNew = id === "novo";
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const aiGen = useServerFn(generateProductContent);

  // Basic
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");

  // Pricing
  const [price, setPrice] = useState<string>("");
  const [promoPrice, setPromoPrice] = useState<string>("");
  const [costPrice, setCostPrice] = useState<string>("");
  const [showPrice, setShowPrice] = useState(true);

  // Type & inventory
  const [productType, setProductType] = useState<"physical" | "digital">("physical");
  const [stockMode, setStockMode] = useState<"infinite" | "limited">("infinite");
  const [stockQuantity, setStockQuantity] = useState<string>("");

  // Categorization
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [featuredSections, setFeaturedSections] = useState<string[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  // Flags
  const [active, setActive] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [lowStock, setLowStock] = useState("5");

  // Media
  const [images, setImages] = useState<{ url: string; position: number }[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [productVideoUrl, setProductVideoUrl] = useState<string | null>(null);
  const [productVideoType, setProductVideoType] = useState<VideoType | null>(null);
  const [externalVideoOpen, setExternalVideoOpen] = useState(false);

  // AI loading states
  const [aiBusy, setAiBusy] = useState<Record<string, boolean>>({});
  const setBusy = (k: string, v: boolean) => setAiBusy((s) => ({ ...s, [k]: v }));

  const planSlug = store?.plan?.slug as any;

  const categoriesQ = useQuery({
    queryKey: ["admin-cats", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, parent_id").eq("store_id", store!.id).order("name");
      return data ?? [];
    },
  });

  const productQ = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew && !!store,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, product_images(*), product_colors(*), product_sizes(*), product_stock(*), product_video_testimonials(*), product_categories(category_id)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "adjusted">("idle");

  useEffect(() => {
    if (productQ.data) {
      const p: any = productQ.data;
      setTitle(p.title); setSlug(p.slug); setSlugEdited(true);
      setBrand(p.brand_name ?? p.brand ?? "");
      setDescription(p.description ?? "");
      setPrice(String(p.price ?? ""));
      setPromoPrice(p.promo_price ? String(p.promo_price) : "");
      setCostPrice(p.cost_price ? String(p.cost_price) : "");
      setShowPrice(p.show_price !== false);
      setProductType((p.product_type === "digital" ? "digital" : "physical"));
      setStockMode((p.stock_mode === "limited" ? "limited" : "infinite"));
      setStockQuantity(p.stock_quantity != null ? String(p.stock_quantity) : "");
      const linked = ((p.product_categories ?? []) as any[]).map((r) => r.category_id).filter(Boolean);
      setCategoryIds(linked.length ? linked : (p.category_id ? [p.category_id] : []));
      setTags(p.tags ?? []);
      setFeaturedSections(p.featured_sections ?? []);
      setSeoTitle(p.seo_title ?? p.meta_title ?? "");
      setSeoDesc(p.seo_description ?? p.meta_description ?? "");
      setActive(p.active);
      setFreeShipping(!!p.free_shipping);
      setOnSale(!!p.on_sale || p.featured_sections?.includes("promocao") || p.featured_sections?.includes("ofertas") || p.promo_price != null);
      setLowStock(String(p.low_stock_threshold ?? 5));
      setProductVideoUrl(p.video_url ?? null);
      setProductVideoType((p.video_type ?? null) as VideoType | null);
      setExternalVideoOpen(!!p.video_url);
      setImages((p.product_images ?? []).sort((a: any, b: any) => a.position - b.position).map((i: any) => ({ url: i.url, position: i.position })));
      const sortedColors = (p.product_colors ?? []).sort((a: any, b: any) => a.position - b.position);
      const sortedSizes = (p.product_sizes ?? []).sort((a: any, b: any) => a.position - b.position);
      setColors(sortedColors);
      setSizes(sortedSizes);
      const colorNameById = new Map<string, string>(sortedColors.map((c: any) => [c.id, c.name]));
      const sizeLabelById = new Map<string, string>(sortedSizes.map((s: any) => [s.id, s.label]));
      const sm: Record<string, number> = {};
      (p.product_stock ?? []).forEach((s: any) => {
        const ck = s.color_id ? colorNameById.get(s.color_id) ?? "_" : "_";
        const sk = s.size_id ? sizeLabelById.get(s.size_id) ?? "_" : "_";
        sm[`${ck}|${sk}`] = s.quantity;
      });
      setStock(sm);
      setVideos((p.product_video_testimonials ?? []).sort((a: any, b: any) => a.position - b.position).map((v: any) => ({
        id: v.id, video_url: v.video_url, kind: v.kind, customer_name: v.customer_name ?? "", quote: v.quote ?? "", rating: v.rating, position: v.position,
      })));
    }
  }, [productQ.data]);

  // Auto-slug from title when user hasn't manually edited the slug
  useEffect(() => {
    if (!slugEdited && title) setSlug(slugify(title));
  }, [title, slugEdited]);

  // Debounced slug availability check
  useEffect(() => {
    if (!store?.id || !slug) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      let q = supabase.from("products").select("id").eq("store_id", store.id).eq("slug", slug).limit(1);
      if (!isNew && id) q = q.neq("id", id);
      const { data } = await q.maybeSingle();
      setSlugStatus(data ? "adjusted" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [slug, store?.id, isNew, id]);

  async function buildUniqueSlug(baseInput: string, storeId: string, ignoreId: string | null): Promise<string> {
    const base = slugify(baseInput).slice(0, 80) || "produto";
    let q = supabase.from("products").select("slug").eq("store_id", storeId).like("slug", `${base}%`);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data } = await q;
    const taken = new Set((data ?? []).map((r: any) => r.slug));
    if (!taken.has(base)) return base;
    return `${base}-${Date.now().toString(36)}`;
  }

  const margin = useMemo(() => {
    const p = Number(price);
    const c = Number(costPrice);
    if (!p || !c || c <= 0) return null;
    return (((p - c) / p) * 100).toFixed(1) + "%";
  }, [price, costPrice]);

  // ---- AI helpers ----
  async function aiDescription() {
    if (!title.trim()) { toast.error("Informe o nome do produto primeiro"); return; }
    setBusy("desc", true);
    try {
      const r: any = await aiGen({ data: { kind: "description", productName: title, productDescription: description } });
      setDescription(r.text);
      toast.success("Descrição gerada!");
    } catch (e: any) { toast.error(e?.message ?? "Falha ao gerar"); } finally { setBusy("desc", false); }
  }
  async function aiSeo() {
    if (!title.trim()) { toast.error("Informe o nome do produto primeiro"); return; }
    setBusy("seo", true);
    try {
      const r: any = await aiGen({ data: { kind: "seo", productName: title, productDescription: description } });
      setSeoTitle(r.title); setSeoDesc(r.description);
      toast.success("SEO gerado!");
    } catch (e: any) { toast.error(e?.message ?? "Falha ao gerar"); } finally { setBusy("seo", false); }
  }
  async function aiTags() {
    if (!title.trim()) { toast.error("Informe o nome do produto primeiro"); return; }
    setBusy("tags", true);
    try {
      const r: any = await aiGen({ data: { kind: "tags", productName: title, productDescription: description } });
      const merged = Array.from(new Set([...(tags ?? []), ...(r.tags ?? [])]));
      setTags(merged);
      toast.success("Tags geradas!");
    } catch (e: any) { toast.error(e?.message ?? "Falha ao gerar"); } finally { setBusy("tags", false); }
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("Loja não carregada");
      if (!title.trim()) throw new Error("Nome obrigatório");

      const baseSlug = slug || slugify(title);
      let finalSlug = await buildUniqueSlug(baseSlug, store.id, isNew ? null : (id as string));

      let productId = isNew ? null : id;
      const buildPayload = (s: string) => ({
        store_id: store.id,
        title: title.trim(),
        slug: s,
        brand: brand || null,
        brand_name: brand || null,
        description: description || null,
        price: Number(price) || 0,
        promo_price: promoPrice ? Number(promoPrice) : null,
        cost_price: costPrice ? Number(costPrice) : null,
        show_price: showPrice,
        product_type: productType,
        stock_mode: stockMode,
        stock_quantity: stockMode === "limited" && stockQuantity ? Number(stockQuantity) : null,
        category_id: categoryIds[0] ?? null,
        tags: tags as any,
        featured_sections: Array.from(new Set([...(featuredSections as string[]), ...(onSale ? ["promocao"] : [])])) as any,
        on_sale: onSale,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
        meta_title: seoTitle || null,
        meta_description: seoDesc || null,
        active,
        is_visible: active,
        free_shipping: freeShipping,
        low_stock_threshold: Number(lowStock) || 5,
        video_url: productVideoUrl,
        video_type: productVideoType,
      } as any);

      if (isNew) {
        let { data, error } = await supabase.from("products").insert(buildPayload(finalSlug)).select("id").single();
        if (error && (error as any).code === "23505") {
          finalSlug = `${slugify(baseSlug)}-${Date.now().toString(36)}`;
          ({ data, error } = await supabase.from("products").insert(buildPayload(finalSlug)).select("id").single());
        }
        if (error) throw error;
        productId = data!.id;
        setSlug(finalSlug);
      } else {
        let { error } = await supabase.from("products").update(buildPayload(finalSlug)).eq("id", id);
        if (error && (error as any).code === "23505") {
          finalSlug = `${slugify(baseSlug)}-${Date.now().toString(36)}`;
          ({ error } = await supabase.from("products").update(buildPayload(finalSlug)).eq("id", id));
        }
        if (error) throw error;
        setSlug(finalSlug);
      }

      await supabase.from("product_categories").delete().eq("product_id", productId!);
      if (categoryIds.length) {
        await supabase.from("product_categories").insert(
          categoryIds.map((cid) => ({ product_id: productId!, category_id: cid })),
        );
      }

      await supabase.from("product_images").delete().eq("product_id", productId!);
      if (images.length) {
        await supabase.from("product_images").insert(images.map((img) => ({ ...img, product_id: productId! })));
      }

      await supabase.from("product_colors").delete().eq("product_id", productId!);
      const insertedColors: { id: string; name: string }[] = [];
      if (colors.length) {
        const { data: ic } = await supabase.from("product_colors").insert(
          colors.map((c, i) => ({ product_id: productId!, name: c.name, hex: c.hex, position: i }))
        ).select("id, name");
        insertedColors.push(...(ic ?? []));
      }

      await supabase.from("product_sizes").delete().eq("product_id", productId!);
      const insertedSizes: { id: string; label: string }[] = [];
      if (sizes.length) {
        const { data: is } = await supabase.from("product_sizes").insert(
          sizes.map((s, i) => ({ product_id: productId!, label: s.label, position: i }))
        ).select("id, label");
        insertedSizes.push(...(is ?? []));
      }

      await supabase.from("product_stock").delete().eq("product_id", productId!);
      const stockRows: any[] = [];
      const colorById = new Map(insertedColors.map((c) => [c.name, c.id]));
      const sizeById = new Map(insertedSizes.map((s) => [s.label, s.id]));
      const colorKeys = colors.length ? colors.map((c) => c.name) : [null];
      const sizeKeys = sizes.length ? sizes.map((s) => s.label) : [null];
      for (const ck of colorKeys) {
        for (const sk of sizeKeys) {
          const key = `${ck ?? "_"}|${sk ?? "_"}`;
          const qty = stock[key] ?? 0;
          if (qty > 0 || (ck === null && sk === null)) {
            stockRows.push({
              product_id: productId!,
              color_id: ck ? colorById.get(ck) ?? null : null,
              size_id: sk ? sizeById.get(sk) ?? null : null,
              quantity: qty,
            });
          }
        }
      }
      if (stockRows.length) await supabase.from("product_stock").insert(stockRows);

      await supabase.from("product_video_testimonials").delete().eq("product_id", productId!);
      if (videos.length) {
        await supabase.from("product_video_testimonials").insert(
          videos.map((v, i) => ({
            product_id: productId!,
            video_url: v.video_url, kind: v.kind,
            customer_name: v.customer_name || null, quote: v.quote || null,
            rating: v.rating, position: i,
          }))
        );
      }
      return productId;
    },
    onSuccess: () => {
      toast.success(isNew ? "Produto criado!" : "Produto atualizado!");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/produtos" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!store) return null;

  const colorKeys = colors.length ? colors.map((c) => c.name) : [null];
  const sizeKeys = sizes.length ? sizes.map((s) => s.label) : [null];

  const slugBase = `${typeof window !== "undefined" ? window.location.origin : ""}/loja/${store.slug}/produto/`;

  function addTag(value: string) {
    const v = value.trim();
    if (!v) return;
    if (tags.includes(v)) return;
    setTags([...tags, v]);
  }

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border md:px-5">
        <h1 className="min-w-0 truncate font-display text-xl font-bold md:text-2xl">
          {isNew ? "Novo produto" : title || "Editar produto"}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild><Link to="/admin/produtos">Cancelar</Link></Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="bg-[#25d366] text-white hover:bg-[#20bd5a]"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {save.isPending ? "Salvando…" : "Salvar produto"}
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* MAIN COLUMN */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Card 1 — Nome e descrição */}
          <Section title="Nome e descrição">
            <div className="space-y-4">
              <Field label="Nome">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Jaqueta de couro" />
              </Field>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs">Descrição</Label>
                  <AiButton busy={aiBusy.desc} onClick={aiDescription} />
                </div>
                <Textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o produto, materiais, diferenciais…"
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground">
                  P · {description.length} caracteres
                </p>
              </div>
            </div>
          </Section>

          {/* Card 2 — Fotos e vídeo */}
          <Section title="Fotos e vídeo">
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-[#bfdbfe] bg-blue-50/30 p-4">
                <MultiImageUpload bucket="products" storeId={store.id} images={images} onChange={setImages} />
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Tamanho mínimo recomendado: 1280px · Formatos: WEBP, PNG, JPEG ou GIF
                </p>
              </div>

              <button
                type="button"
                onClick={() => setExternalVideoOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm hover:bg-muted/40"
              >
                <span>
                  <span className="font-medium">Link para vídeo externo</span>
                  <span className="ml-2 text-xs text-muted-foreground">YouTube ou Vimeo</span>
                </span>
                {externalVideoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {externalVideoOpen && (
                <div className="rounded-lg border border-border p-3">
                  <VideoSourcePicker
                    storeId={store.id}
                    videoUrl={productVideoUrl}
                    videoType={productVideoType}
                    onChange={({ url, type }) => { setProductVideoUrl(url); setProductVideoType(type); }}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Card 3 — Preços */}
          <Section title="Preços">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Preço de venda">
                  <CurrencyInput value={price} onChange={setPrice} />
                </Field>
                <Field label="Preço promocional">
                  <CurrencyInput value={promoPrice} onChange={setPromoPrice} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={showPrice} onCheckedChange={(v) => setShowPrice(!!v)} />
                Exibir o preço na loja
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Field label="Custo">
                    <CurrencyInput value={costPrice} onChange={setCostPrice} />
                  </Field>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    É para uso interno, os seus clientes não o verão na loja.
                  </p>
                </div>
                <Field label="Margem de lucro">
                  <Input value={margin ?? "--"} readOnly className="bg-muted/40" />
                </Field>
              </div>
            </div>
          </Section>

          {/* Card 4 — Tipo */}
          <Section title="Tipo de produto">
            <div className="space-y-2">
              <RadioRow
                checked={productType === "physical"}
                onSelect={() => setProductType("physical")}
                label="Físico"
              />
              <RadioRow
                checked={productType === "digital"}
                onSelect={() => setProductType("digital")}
                label="Digital / serviço"
              />
            </div>
          </Section>

          {/* Card 5 — Inventário */}
          <Section title="Inventário">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs">Estoque</Label>
                <div className="space-y-2">
                  <RadioRow checked={stockMode === "infinite"} onSelect={() => setStockMode("infinite")} label="Infinito" />
                  <RadioRow checked={stockMode === "limited"} onSelect={() => setStockMode("limited")} label="Limitado" />
                </div>
                {stockMode === "limited" && (
                  <div className="mt-3">
                    <Field label="Quantidade em estoque">
                      <Input type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <Label className="mb-2 block text-xs">Variações</Label>
                <VariationsBuilder
                  colors={colors}
                  sizes={sizes}
                  onColorsChange={setColors}
                  onSizesChange={setSizes}
                />
              </div>

              {(colors.length > 0 || sizes.length > 0) && (
                <div className="border-t border-border pt-4">
                  <Label className="mb-2 block text-xs">Estoque por variação</Label>
                  <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-border p-2 text-left">Cor \ Tamanho</th>
                          {sizeKeys.map((sk, i) => <th key={i} className="border-b border-border p-2">{sk ?? "—"}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {colorKeys.map((ck, ci) => (
                          <tr key={ci}>
                            <td className="border-b border-border p-2 font-medium">{ck ?? "—"}</td>
                            {sizeKeys.map((sk, si) => {
                              const key = `${ck ?? "_"}|${sk ?? "_"}`;
                              return (
                                <td key={si} className="border-b border-border p-1">
                                  <Input
                                    type="number" min={0}
                                    value={stock[key] ?? 0}
                                    onChange={(e) => setStock({ ...stock, [key]: Number(e.target.value) || 0 })}
                                    className="h-8 w-20 text-center"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Field label="Avisar quando estoque ≤">
                <Input type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Vídeos depoimento (gated) */}
          <Section title="Vídeos depoimento">
            <PlanGate plan={planSlug} feature="video_testimonials">
              <div className="space-y-3">
                {videos.map((v, i) => {
                  const pickerType: VideoType | null = v.video_url ? (v.kind === "youtube" ? "youtube" : "mp4") : null;
                  return (
                    <div key={i} className="space-y-3 rounded-lg border border-border p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <VideoSourcePicker
                            storeId={store.id}
                            videoUrl={v.video_url || null}
                            videoType={pickerType}
                            onChange={({ url, type }) => {
                              const next = [...videos];
                              next[i].video_url = url ?? "";
                              next[i].kind = type === "youtube" ? "youtube" : "mp4";
                              setVideos(next);
                            }}
                          />
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => setVideos(videos.filter((_, j) => j !== i))} aria-label="Remover vídeo">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Cliente" value={v.customer_name} onChange={(e) => {
                          const next = [...videos]; next[i].customer_name = e.target.value; setVideos(next);
                        }} />
                        <Select value={String(v.rating)} onValueChange={(val) => {
                          const next = [...videos]; next[i].rating = Number(val); setVideos(next);
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[5,4,3,2,1].map((r) => <SelectItem key={r} value={String(r)}>{"⭐".repeat(r)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea placeholder="Depoimento" rows={2} value={v.quote} onChange={(e) => {
                        const next = [...videos]; next[i].quote = e.target.value; setVideos(next);
                      }} />
                    </div>
                  );
                })}
                <Button size="sm" variant="outline" onClick={() => setVideos([...videos, { video_url: "", kind: "youtube", customer_name: "", quote: "", rating: 5, position: videos.length }])}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar vídeo
                </Button>
              </div>
            </PlanGate>
          </Section>

          {/* Card 6 — SEO e busca na loja */}
          <Section
            title="SEO e busca na loja"
            action={<AiButton busy={aiBusy.seo} onClick={aiSeo} />}
          >
            <div className="space-y-5">
              {/* Tags */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs">Tags</Label>
                  <AiButton busy={aiBusy.tags} onClick={aiTags} />
                </div>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Adicione palavras-chave para ajudar seus clientes a encontrar este produto na loja.
                </p>
                <TagsInput value={tags} onChange={setTags} onAdd={addTag} />
              </div>

              {/* Marca */}
              <div>
                <Label className="mb-1.5 block text-xs">Marca</Label>
                <p className="mb-2 text-[11px] text-muted-foreground">Informe a marca para identificar o produto.</p>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Exemplo: Nike" />
              </div>

              {/* SEO */}
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs">SEO</Label>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Melhore a visibilidade desse produto no Google, marketplaces e redes sociais.
                  </p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Título SEO</Label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value.slice(0, 70))}
                    placeholder="Exemplo: Camisetas estampadas"
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">{seoTitle.length}/70 caracteres</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Descrição SEO</Label>
                  <Textarea
                    rows={3}
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value.slice(0, 160))}
                    placeholder="Exemplo: Todo o site em promoção e frete grátis!"
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">{seoDesc.length}/160 caracteres</p>
                </div>
              </div>

              {/* URL */}
              <div>
                <Label className="mb-1.5 block text-xs">URL do produto</Label>
                <p className="mb-2 text-[11px] text-muted-foreground">Defina uma URL simples para facilitar sua busca.</p>
                <div className="flex items-stretch overflow-hidden rounded-md border border-input">
                  <span className="hidden items-center bg-muted px-3 text-[11px] text-muted-foreground sm:flex">
                    {slugBase}
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                    placeholder="slug-do-produto"
                    className="border-0 font-mono text-sm focus-visible:ring-0"
                  />
                </div>
                {slugStatus === "available" && <p className="mt-1 text-[11px] text-emerald-600">✓ URL disponível</p>}
                {slugStatus === "adjusted" && <p className="mt-1 text-[11px] text-amber-600">⚠ URL em uso — será ajustada automaticamente</p>}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Caso não defina, ou já exista uma igual, adicionaremos caracteres aleatórios ou números.
                </p>
              </div>
            </div>
          </Section>

          {/* Card 7 — Destacar produto */}
          <Section title="Destacar produto">
            <p className="mb-3 text-xs text-muted-foreground">
              Escolha em quais seções da sua loja você quer destacar este produto para dar-lhe mais visibilidade.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURED_SECTIONS.map((s) => {
                const checked = featuredSections.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      checked ? "border-[#25d366] bg-[#25d366]/5" : "border-border hover:bg-muted/40",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setFeaturedSections(v ? [...featuredSections, s.id] : featuredSections.filter((x) => x !== s.id));
                        if (s.id === "promocao") setOnSale(!!v);
                      }}
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Footer checkboxes + buttons */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={freeShipping} onCheckedChange={(v) => setFreeShipping(!!v)} />
              Esse produto possui frete grátis
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={active} onCheckedChange={(v) => setActive(!!v)} />
              Exibir na minha loja
            </label>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="outline" asChild><Link to="/admin/produtos">Cancelar</Link></Button>
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="bg-[#25d366] text-white hover:bg-[#20bd5a]"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {save.isPending ? "Salvando…" : "Salvar produto"}
              </Button>
            </div>
          </div>
        </div>

        {/* ASIDE COLUMN */}
        <div className="min-w-0 space-y-4">
          <Section title="Organização">
            <Label className="mb-2 block text-xs">Categorias</Label>
            <CategoryTreePicker
              storeId={store.id}
              categories={(categoriesQ.data ?? []) as any[]}
              selectedIds={categoryIds}
              onToggle={(id, checked) =>
                setCategoryIds(checked ? [...categoryIds, id] : categoryIds.filter((x) => x !== id))
              }
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin-cats", store.id] })}
              onAutoSelect={(id) => setCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]))}
              onDeleted={(id) => setCategoryIds((prev) => prev.filter((x) => x !== id))}
            />
          </Section>

          <Section title="Visibilidade">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">Exibir na loja</div>
                <div className="text-xs text-muted-foreground">
                  {active ? "Visível para os clientes" : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px]">Oculto</span>
                  )}
                </div>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </Section>

          <Section title="Produto em destaque">
            <div className="flex items-center justify-between">
              <div className="text-sm">Destacar na página inicial</div>
              <Switch
                checked={featuredSections.includes("destaque")}
                onCheckedChange={(v) =>
                  setFeaturedSections(
                    v
                      ? Array.from(new Set([...featuredSections, "destaque"]))
                      : featuredSections.filter((x) => x !== "destaque"),
                  )
                }
              />
            </div>
          </Section>

          <Section title="Promoção">
            <div className="flex items-center justify-between">
              <div className="text-sm">Mostrar em vitrines de promoção</div>
              <Switch
                checked={onSale}
                onCheckedChange={(v) => {
                  setOnSale(v);
                  setFeaturedSections(v ? Array.from(new Set([...featuredSections, "promocao"])) : featuredSections.filter((x) => x !== "promocao"));
                }}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function AiButton({ busy, onClick, label = "Gerar com IA" }: { busy?: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#25d366] hover:bg-[#25d366]/10 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {busy ? "Gerando…" : `✨ ${label}`}
    </button>
  );
}

function RadioRow({ checked, onSelect, label }: { checked: boolean; onSelect: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        checked ? "border-[#25d366] bg-[#25d366]/5" : "border-border hover:bg-muted/40",
      )}
    >
      <span className={cn(
        "flex h-4 w-4 items-center justify-center rounded-full border-2",
        checked ? "border-[#25d366]" : "border-muted-foreground/40",
      )}>
        {checked && <span className="h-2 w-2 rounded-full bg-[#25d366]" />}
      </span>
      {label}
    </button>
  );
}

function CurrencyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-input">
      <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground">R$</span>
      <Input
        type="number"
        step="0.01"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        className="border-0 focus-visible:ring-0"
      />
    </div>
  );
}

function TagsInput({
  value, onChange, onAdd,
}: { value: string[]; onChange: (v: string[]) => void; onAdd: (v: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input p-2 focus-within:ring-1 focus-within:ring-ring">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded-full hover:bg-background">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (draft.trim()) { onAdd(draft); setDraft(""); }
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => { if (draft.trim()) { onAdd(draft); setDraft(""); } }}
        placeholder={value.length ? "" : "Digite e pressione Enter"}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="form-card form-section product-form-section min-w-0 rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

type CategoryNode = { id: string; name: string; parent_id: string | null };

function CategoryTreePicker({
  storeId,
  categories,
  selectedIds,
  onToggle,
  onChanged,
  onAutoSelect,
  onDeleted,
}: {
  storeId: string;
  categories: CategoryNode[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  onChanged: () => void;
  onAutoSelect: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [creatingFor, setCreatingFor] = useState<string | "root" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const roots = categories.filter((c) => !c.parent_id);
  const childrenOf = (pid: string) => categories.filter((c) => c.parent_id === pid);

  function isDuplicate(name: string, parentId: string | null, ignoreId?: string) {
    const target = name.trim().toLowerCase();
    const targetSlug = slugify(name);
    return categories.some(
      (c) =>
        c.id !== ignoreId &&
        (c.parent_id ?? null) === (parentId ?? null) &&
        (c.name.trim().toLowerCase() === target || slugify(c.name) === targetSlug),
    );
  }

  async function createCategory(name: string, parentId: string | null) {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Informe o nome");
      return false;
    }
    if (isDuplicate(trimmed, parentId)) {
      toast.error("Já existe uma categoria com esse nome neste nível");
      return false;
    }
    const { data, error } = await supabase
      .from("categories")
      .insert({ store_id: storeId, name: trimmed, slug: slugify(trimmed), parent_id: parentId })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(parentId ? "Subcategoria criada" : "Categoria criada");
    onAutoSelect(data.id);
    onChanged();
    return true;
  }

  async function renameCategory(id: string, name: string, parentId: string | null) {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Nome obrigatório");
      return false;
    }
    if (isDuplicate(trimmed, parentId, id)) {
      toast.error("Já existe uma categoria com esse nome neste nível");
      return false;
    }
    const { error } = await supabase
      .from("categories")
      .update({ name: trimmed, slug: slugify(trimmed) })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Categoria renomeada");
    onChanged();
    return true;
  }

  async function deleteCategory(id: string) {
    const subs = childrenOf(id);
    const msg = subs.length
      ? `Esta categoria tem ${subs.length} subcategoria(s). Excluir mesmo assim?`
      : "Excluir esta categoria?";
    if (!confirm(msg)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categoria excluída");
    onDeleted(id);
    subs.forEach((s) => onDeleted(s.id));
    onChanged();
  }

  function renderRow(c: CategoryNode, depth: number) {
    const checked = selectedIds.includes(c.id);
    const isEditing = editingId === c.id;

    return (
      <div key={c.id}>
        <div
          className="group flex items-center gap-2 rounded-md py-1 pr-1 text-sm hover:bg-muted/40"
          style={{ paddingLeft: 4 + depth * 16 }}
        >
          {isEditing ? (
            <InlineEdit
              initial={c.name}
              onSave={async (val) => {
                const ok = await renameCategory(c.id, val, c.parent_id);
                if (ok) setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(c.id, !!v)} />
              <span className="flex-1 truncate">{c.name}</span>
              <div className="category-row-actions flex items-center gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                {depth === 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Adicionar subcategoria"
                    onClick={() => setCreatingFor(c.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Renomear"
                  onClick={() => setEditingId(c.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Excluir"
                  onClick={() => deleteCategory(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </>
          )}
        </div>

        {creatingFor === c.id && (
          <div style={{ paddingLeft: 4 + (depth + 1) * 16 }} className="py-1">
            <InlineCreate
              placeholder="Nome da subcategoria"
              onSave={async (val) => {
                const ok = await createCategory(val, c.id);
                if (ok) setCreatingFor(null);
              }}
              onCancel={() => setCreatingFor(null)}
            />
          </div>
        )}

        {childrenOf(c.id).map((sub) => renderRow(sub, depth + 1))}
      </div>
    );
  }

  const selectedCats = categories.filter((c) => selectedIds.includes(c.id));

  const treeBody = (
    <div className="space-y-2">
      <div className="max-h-[60vh] space-y-0.5 overflow-y-auto pr-1 md:max-h-72">
        {roots.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma categoria encontrada. Crie a primeira abaixo.</p>
        )}
        {roots.map((c) => renderRow(c, 0))}
      </div>

      {creatingFor === "root" ? (
        <InlineCreate
          placeholder="Nome da nova categoria"
          onSave={async (val) => {
            const ok = await createCategory(val, null);
            if (ok) setCreatingFor(null);
          }}
          onCancel={() => setCreatingFor(null)}
        />
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setCreatingFor("root")}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova categoria
        </Button>
      )}
    </div>
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline tree */}
      <div className="hidden md:block">{treeBody}</div>

      {/* Mobile: chips + Sheet trigger */}
      <div className="md:hidden space-y-2">
        {selectedCats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCats.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => onToggle(c.id, false)}
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remover ${c.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between text-base h-11">
              <span className="truncate">
                {selectedCats.length === 0
                  ? "Selecionar categorias"
                  : `${selectedCats.length} categoria${selectedCats.length > 1 ? "s" : ""} selecionada${selectedCats.length > 1 ? "s" : ""}`}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle>Categorias</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">{treeBody}</div>
            <SheetFooter className="border-t border-border p-4">
              <SheetClose asChild>
                <Button type="button" className="w-full" size="lg">Concluir</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function InlineCreate({
  placeholder,
  onSave,
  onCancel,
}: {
  placeholder: string;
  onSave: (val: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    await onSave(val);
    setBusy(false);
  }
  return (
    <div className="flex gap-1.5 rounded-lg border border-border bg-muted/30 p-1.5">
      <Input
        autoFocus
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="h-7 text-sm"
      />
      <Button size="icon" className="h-7 w-7 shrink-0" onClick={submit} disabled={busy}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function InlineEdit({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (val: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    await onSave(val);
    setBusy(false);
  }
  return (
    <div className="flex flex-1 items-center gap-1.5">
      <Input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="h-7 text-sm"
      />
      <Button size="icon" className="h-7 w-7 shrink-0" onClick={submit} disabled={busy}>
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
