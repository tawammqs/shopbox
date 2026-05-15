import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Save, Trash2, Pencil, Check, ChevronDown } from "lucide-react";
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
import { ImageUpload, MultiImageUpload } from "@/components/admin/ImageUpload";
import { PlanGate } from "@/components/admin/PlanGate";
import { VariationsBuilder } from "@/components/admin/VariationsBuilder";
import { VideoSourcePicker } from "@/components/admin/VideoSourcePicker";
import type { VideoType } from "@/lib/video";
import { slugify } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProductFormPage,
});

const TAGS = ["destaques", "lancamentos", "ofertas", "principal"] as const;
const TAG_LABELS: Record<string, string> = {
  destaques: "Destaques", lancamentos: "Lançamentos", ofertas: "Ofertas", principal: "Principal",
};

type ColorRow = { id?: string; name: string; hex: string; position: number };
type SizeRow = { id?: string; label: string; position: number };
type StockRow = { color_id: string | null; size_id: string | null; quantity: number };
type VideoRow = { id?: string; video_url: string; kind: "youtube" | "mp4"; customer_name: string; quote: string; rating: number; position: number };

function ProductFormPage() {
  const { id } = useParams({ from: "/admin/produtos/$id" });
  const isNew = id === "novo";
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [promoPrice, setPromoPrice] = useState<string>("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [lowStock, setLowStock] = useState("5");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  const [images, setImages] = useState<{ url: string; position: number }[]>([]);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [sizes, setSizes] = useState<SizeRow[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [productVideoUrl, setProductVideoUrl] = useState<string | null>(null);
  const [productVideoType, setProductVideoType] = useState<VideoType | null>(null);

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

  useEffect(() => {
    if (productQ.data) {
      const p = productQ.data;
      setTitle(p.title); setSlug(p.slug); setBrand(p.brand ?? "");
      setDescription(p.description ?? ""); setSku(p.sku ?? "");
      setPrice(String(p.price)); setPromoPrice(p.promo_price ? String(p.promo_price) : "");
      const linked = ((p.product_categories ?? []) as any[]).map((r) => r.category_id).filter(Boolean);
      setCategoryIds(linked.length ? linked : (p.category_id ? [p.category_id] : []));
      setTags(p.tags ?? []);
      setActive(p.active); setLowStock(String(p.low_stock_threshold ?? 5));
      setMetaTitle(p.meta_title ?? ""); setMetaDesc(p.meta_description ?? "");
      setProductVideoUrl((p as any).video_url ?? null);
      setProductVideoType(((p as any).video_type ?? null) as VideoType | null);
      setImages((p.product_images ?? []).sort((a: any, b: any) => a.position - b.position).map((i: any) => ({ url: i.url, position: i.position })));
      const sortedColors = (p.product_colors ?? []).sort((a: any, b: any) => a.position - b.position);
      const sortedSizes = (p.product_sizes ?? []).sort((a: any, b: any) => a.position - b.position);
      setColors(sortedColors);
      setSizes(sortedSizes);
      // Map stock by color_id/size_id → key by color.name/size.label so it survives variation re-syncs on save.
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

  useEffect(() => {
    if (isNew && title && !slug) setSlug(slugify(title));
  }, [title, isNew, slug]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("Loja não carregada");
      if (!title.trim()) throw new Error("Título obrigatório");
      const finalSlug = slug || slugify(title);

      let productId = isNew ? null : id;
      const payload = {
        store_id: store.id,
        title: title.trim(),
        slug: finalSlug,
        brand: brand || null,
        description: description || null,
        sku: sku || null,
        price: Number(price) || 0,
        promo_price: promoPrice ? Number(promoPrice) : null,
        category_id: categoryIds[0] ?? null,
        tags: tags as any,
        active,
        low_stock_threshold: Number(lowStock) || 5,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
        video_url: productVideoUrl,
        video_type: productVideoType,
      };

      if (isNew) {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
      }

      // Sync category links (many-to-many)
      await supabase.from("product_categories").delete().eq("product_id", productId!);
      if (categoryIds.length) {
        await supabase.from("product_categories").insert(
          categoryIds.map((cid) => ({ product_id: productId!, category_id: cid })),
        );
      }

      // Sync images (delete all, re-insert)
      await supabase.from("product_images").delete().eq("product_id", productId!);
      if (images.length) {
        await supabase.from("product_images").insert(images.map((img) => ({ ...img, product_id: productId! })));
      }

      // Sync colors
      await supabase.from("product_colors").delete().eq("product_id", productId!);
      const insertedColors: { id: string; name: string }[] = [];
      if (colors.length) {
        const { data: ic } = await supabase.from("product_colors").insert(
          colors.map((c, i) => ({ product_id: productId!, name: c.name, hex: c.hex, position: i }))
        ).select("id, name");
        insertedColors.push(...(ic ?? []));
      }

      // Sync sizes
      await supabase.from("product_sizes").delete().eq("product_id", productId!);
      const insertedSizes: { id: string; label: string }[] = [];
      if (sizes.length) {
        const { data: is } = await supabase.from("product_sizes").insert(
          sizes.map((s, i) => ({ product_id: productId!, label: s.label, position: i }))
        ).select("id, label");
        insertedSizes.push(...(is ?? []));
      }

      // Sync stock — map old keys (using name/label) to new IDs
      await supabase.from("product_stock").delete().eq("product_id", productId!);
      const stockRows: any[] = [];
      const colorById = new Map(insertedColors.map((c) => [c.name, c.id]));
      const sizeById = new Map(insertedSizes.map((s) => [s.label, s.id]));

      // Build stock matrix: for each color × size combo (or just color, just size, or none)
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

      // Sync videos
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

  return (
    <div className="product-form-page admin-product-form mx-auto w-full max-w-5xl min-w-0 space-y-6 p-4 md:p-0">
      <div className="product-form-wrapper flex min-w-0 items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/admin/produtos"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="min-w-0 truncate font-display text-xl font-bold md:text-2xl">{isNew ? "Novo produto" : title || "Editar produto"}</h1>
      </div>

      <div className="product-form-container grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Section title="Informações básicas">
            <div className="grid gap-4">
              <Field label="Título *"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="Slug (URL)"><Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Marca"><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
                <Field label="SKU"><Input value={sku} onChange={(e) => setSku(e.target.value)} /></Field>
              </div>
              <Field label="Descrição"><Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Preço">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Preço *"><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              <Field label="Preço promocional"><Input type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} /></Field>
            </div>
          </Section>

          {/* Product video */}
          <Section title="Vídeo do produto">
            <VideoSourcePicker
              storeId={store.id}
              videoUrl={productVideoUrl}
              videoType={productVideoType}
              onChange={({ url, type }) => { setProductVideoUrl(url); setProductVideoType(type); }}
            />
          </Section>

          {/* Images */}
          <Section title="Galeria de imagens">
            <MultiImageUpload bucket="products" storeId={store.id} images={images} onChange={setImages} />
          </Section>

          {/* Variants — Nuvemshop-style flow */}
          <Section title="Variações">
            <VariationsBuilder
              colors={colors}
              sizes={sizes}
              onColorsChange={setColors}
              onSizesChange={setSizes}
            />
          </Section>

          {/* Stock matrix */}
          {(colors.length > 0 || sizes.length > 0) && (
            <Section title="Estoque por variação">
              <div className="stock-matrix overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-border p-2 text-left">Cor \\ Tamanho</th>
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
            </Section>
          )}

          {/* Video testimonials (gated) */}
          <Section title="Vídeos depoimento">
            <PlanGate plan={planSlug} feature="video_testimonials">
              <div className="space-y-3">
                {videos.map((v, i) => {
                  const pickerType: VideoType | null = v.video_url
                    ? v.kind === "youtube"
                      ? "youtube"
                      : "mp4"
                    : null;
                  return (
                    <div key={i} className="space-y-3 rounded-lg border border-border p-3">
                       <div className="flex items-start gap-2">
                        <div className="flex-1">
                          {store?.id ? (
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
                          ) : (
                            <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                              Carregando dados da loja…
                            </div>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setVideos(videos.filter((_, j) => j !== i))}
                          aria-label="Remover vídeo"
                        >
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

          {/* SEO (Premium) */}
          <Section title="SEO">
            <PlanGate plan={planSlug} feature="seo_per_product">
              <div className="space-y-3">
                <Field label="Meta título"><Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} /></Field>
                <Field label="Meta descrição"><Textarea rows={2} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} /></Field>
              </div>
            </PlanGate>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="min-w-0 space-y-4">
          <Section title="Status">
            <div className="status-toggle-row flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {active ? "Produto ativo" : "Produto inativo"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {active ? "Visível na loja" : "Oculto da loja"}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Alternar status do produto"
                onClick={() => setActive(!active)}
                className="status-toggle-btn"
                data-active={active ? "true" : "false"}
              >
                <span className="status-toggle-thumb" data-active={active ? "true" : "false"} />
              </button>
            </div>
          </Section>

          <Section title="Categorias">
            <p className="mb-2 text-xs text-muted-foreground">Selecione uma ou mais categorias.</p>
            <CategoryTreePicker
              storeId={store.id}
              categories={(categoriesQ.data ?? []) as any[]}
              selectedIds={categoryIds}
              onToggle={(id, checked) =>
                setCategoryIds(checked ? [...categoryIds, id] : categoryIds.filter((x) => x !== id))
              }
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin-cats", store.id] })}
              onAutoSelect={(id) =>
                setCategoryIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
              }
              onDeleted={(id) => setCategoryIds((prev) => prev.filter((x) => x !== id))}
            />
          </Section>

          <Section title="Tags / Vitrines">
            <div className="tags-list flex flex-col gap-2">
              {TAGS.map((t) => {
                const isSelected = tags.includes(t);
                const emoji = t === "destaques" ? "⭐" : t === "lancamentos" ? "🆕" : t === "ofertas" ? "🏷️" : "🏠";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags(isSelected ? tags.filter((x) => x !== t) : [...tags, t])}
                    aria-pressed={isSelected}
                    className="tag-toggle-btn"
                    data-selected={isSelected ? "true" : "false"}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none">{emoji}</span>
                      <span className="text-sm font-medium">{TAG_LABELS[t]}</span>
                    </span>
                    <span className="tag-toggle-check" data-selected={isSelected ? "true" : "false"}>
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Estoque baixo">
            <Field label="Avisar quando ≤"><Input type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} /></Field>
          </Section>

          <div className="admin-save-bar space-y-2 md:sticky md:top-20">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="save-confirm w-full" size="lg">
              <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
            <Button variant="outline" className="save-cancel w-full" asChild>
              <Link to="/admin/produtos">Cancelar</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-card form-section product-form-section min-w-0 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-base font-semibold">{title}</h3>
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
              <div className="category-row-actions flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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

  return (
    <div className="space-y-2">
      <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
        {roots.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma categoria criada ainda.</p>
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
