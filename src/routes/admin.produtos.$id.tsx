import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Save, Trash2 } from "lucide-react";
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
  const [categoryId, setCategoryId] = useState<string>("");
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
        .select(`*, product_images(*), product_colors(*), product_sizes(*), product_stock(*), product_video_testimonials(*)`)
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
      setCategoryId(p.category_id ?? ""); setTags(p.tags ?? []);
      setActive(p.active); setLowStock(String(p.low_stock_threshold ?? 5));
      setMetaTitle(p.meta_title ?? ""); setMetaDesc(p.meta_description ?? "");
      setImages((p.product_images ?? []).sort((a: any, b: any) => a.position - b.position).map((i: any) => ({ url: i.url, position: i.position })));
      setColors((p.product_colors ?? []).sort((a: any, b: any) => a.position - b.position));
      setSizes((p.product_sizes ?? []).sort((a: any, b: any) => a.position - b.position));
      const sm: Record<string, number> = {};
      (p.product_stock ?? []).forEach((s: any) => {
        sm[`${s.color_id ?? "_"}|${s.size_id ?? "_"}`] = s.quantity;
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
        category_id: categoryId || null,
        tags: tags as any,
        active,
        low_stock_threshold: Number(lowStock) || 5,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
      };

      if (isNew) {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/admin/produtos"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-2xl font-bold">{isNew ? "Novo produto" : title || "Editar produto"}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <Section title="Informações básicas">
            <div className="grid gap-4">
              <Field label="Título *"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="Slug (URL)"><Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca"><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
                <Field label="SKU"><Input value={sku} onChange={(e) => setSku(e.target.value)} /></Field>
              </div>
              <Field label="Descrição"><Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Preço">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço *"><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
              <Field label="Preço promocional"><Input type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} /></Field>
            </div>
          </Section>

          {/* Images */}
          <Section title="Galeria de imagens">
            <MultiImageUpload bucket="products" storeId={store.id} images={images} onChange={setImages} />
          </Section>

          {/* Variants */}
          <Section title="Cores">
            <div className="space-y-2">
              {colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => {
                    const next = [...colors]; next[i].hex = e.target.value; setColors(next);
                  }} className="h-9 w-12 cursor-pointer rounded border" />
                  <Input value={c.name} placeholder="Nome (ex: Vermelho)" onChange={(e) => {
                    const next = [...colors]; next[i].name = e.target.value; setColors(next);
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => setColors(colors.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setColors([...colors, { name: "", hex: "#000000", position: colors.length }])}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar cor
              </Button>
            </div>
          </Section>

          <Section title="Tamanhos">
            <div className="flex flex-wrap gap-2">
              {sizes.map((s, i) => (
                <div key={i} className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1">
                  <Input value={s.label} className="h-7 w-16 border-0 bg-transparent" onChange={(e) => {
                    const next = [...sizes]; next[i].label = e.target.value; setSizes(next);
                  }} />
                  <button onClick={() => setSizes(sizes.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setSizes([...sizes, { label: "", position: sizes.length }])}>
                <Plus className="mr-1 h-3 w-3" /> Tamanho
              </Button>
            </div>
          </Section>

          {/* Stock matrix */}
          {(colors.length > 0 || sizes.length > 0) && (
            <Section title="Estoque por variação">
              <div className="overflow-x-auto">
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
                {videos.map((v, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Select value={v.kind} onValueChange={(val) => {
                        const next = [...videos]; next[i].kind = val as any; setVideos(next);
                      }}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="mp4">MP4</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="URL do vídeo" value={v.video_url} onChange={(e) => {
                        const next = [...videos]; next[i].video_url = e.target.value; setVideos(next);
                      }} />
                      <Button size="icon" variant="ghost" onClick={() => setVideos(videos.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
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
                ))}
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
        <div className="space-y-4">
          <Section title="Status">
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </Section>

          <Section title="Categoria">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {(categoriesQ.data ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section title="Tags / Vitrines">
            <div className="space-y-2">
              {TAGS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={tags.includes(t)} onCheckedChange={(v) => {
                    setTags(v ? [...tags, t] : tags.filter((x) => x !== t));
                  }} />
                  {TAG_LABELS[t]}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Estoque baixo">
            <Field label="Avisar quando ≤"><Input type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} /></Field>
          </Section>

          <div className="sticky top-20 space-y-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full" size="lg">
              <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
