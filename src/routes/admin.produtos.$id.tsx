import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Plus, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: ProductEdit,
});

type Color = { id?: string; name: string; hex: string; position: number };
type Size = { id?: string; label: string; position: number };
type Img = { id?: string; url: string; position: number };

function ProductEdit() {
  const { id } = useParams({ from: "/admin/produtos/$id" });
  const isNew = id === "novo";
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [promoPrice, setPromoPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const [images, setImages] = useState<Img[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({}); // key: `${colorIdx}-${sizeIdx}`
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("display_order");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_colors(*), product_sizes(*), product_stock(*)")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      setTitle(data.title);
      setSlug(data.slug);
      setBrand(data.brand ?? "");
      setDescription(data.description ?? "");
      setSku(data.sku ?? "");
      setPrice(String(data.price));
      setPromoPrice(data.promo_price ? String(data.promo_price) : "");
      setCategoryId(data.category_id ?? "");
      setSubcategoryId(data.subcategory_id ?? "");
      setTags(data.tags ?? []);
      setActive(data.active);
      const imgs = (data.product_images ?? []).sort((a: Img, b: Img) => a.position - b.position);
      setImages(imgs);
      const cs = (data.product_colors ?? []).sort((a: Color, b: Color) => a.position - b.position);
      setColors(cs);
      const ss = (data.product_sizes ?? []).sort((a: Size, b: Size) => a.position - b.position);
      setSizes(ss);
      const stk: Record<string, number> = {};
      (data.product_stock ?? []).forEach((s: { color_id: string; size_id: string; quantity: number }) => {
        const ci = cs.findIndex((c: Color) => c.id === s.color_id);
        const si = ss.findIndex((sz: Size) => sz.id === s.size_id);
        if (ci >= 0 && si >= 0) stk[`${ci}-${si}`] = s.quantity;
      });
      setStock(stk);
    })();
  }, [id, isNew]);

  const subcategories = categories.filter((c) => c.parent_id === categoryId);

  const uploadImage = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "-")}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files).slice(0, 6 - images.length)) {
      const url = await uploadImage(file);
      if (url) setImages((p) => [...p, { url, position: p.length }]);
    }
  };

  const save = async () => {
    if (!title || !price) {
      toast.error("Título e preço são obrigatórios");
      return;
    }
    setSaving(true);
    const finalSlug = slug || slugify(title);
    const payload = {
      title,
      slug: finalSlug,
      brand: brand || null,
      description: description || null,
      sku: sku || null,
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : null,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      tags: tags as ("destaques" | "lancamentos" | "ofertas" | "principal")[],
      active,
    };

    let productId = id;
    if (isNew) {
      const { data, error } = await supabase.from("products").insert(payload).select("id").maybeSingle();
      if (error || !data) {
        setSaving(false);
        return toast.error(error?.message ?? "Erro");
      }
      productId = data.id;
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) {
        setSaving(false);
        return toast.error(error.message);
      }
    }

    // Replace images/colors/sizes/stock fully (simple approach)
    await supabase.from("product_stock").delete().eq("product_id", productId);
    await supabase.from("product_colors").delete().eq("product_id", productId);
    await supabase.from("product_sizes").delete().eq("product_id", productId);
    await supabase.from("product_images").delete().eq("product_id", productId);

    if (images.length) {
      await supabase.from("product_images").insert(images.map((im, i) => ({ product_id: productId, url: im.url, position: i })));
    }

    const insertedColors: { id: string }[] = [];
    if (colors.length) {
      const { data } = await supabase.from("product_colors").insert(colors.map((c, i) => ({ product_id: productId, name: c.name, hex: c.hex, position: i }))).select("id");
      if (data) insertedColors.push(...data);
    }
    const insertedSizes: { id: string }[] = [];
    if (sizes.length) {
      const { data } = await supabase.from("product_sizes").insert(sizes.map((s, i) => ({ product_id: productId, label: s.label, position: i }))).select("id");
      if (data) insertedSizes.push(...data);
    }
    const stockRows: { product_id: string; color_id: string | null; size_id: string | null; quantity: number }[] = [];
    if (insertedColors.length && insertedSizes.length) {
      insertedColors.forEach((c, ci) => {
        insertedSizes.forEach((s, si) => {
          stockRows.push({ product_id: productId!, color_id: c.id, size_id: s.id, quantity: stock[`${ci}-${si}`] ?? 0 });
        });
      });
      if (stockRows.length) await supabase.from("product_stock").insert(stockRows);
    }

    setSaving(false);
    toast.success("Produto salvo");
    navigate({ to: "/admin/produtos" });
  };

  const toggleTag = (t: string) => setTags((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold">{isNew ? "Novo Produto" : "Editar Produto"}</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
        <Field label="Slug (URL)"><input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title)} className={inputCls} /></Field>
        <Field label="Marca"><input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} /></Field>
        <Field label="SKU"><input value={sku} onChange={(e) => setSku(e.target.value)} className={inputCls} /></Field>
        <Field label="Preço (R$)"><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></Field>
        <Field label="Preço promocional (R$)"><input type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} className={inputCls} /></Field>
        <Field label="Categoria">
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }} className={inputCls}>
            <option value="">—</option>
            {categories.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Subcategoria">
          <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputCls} disabled={!categoryId}>
            <option value="">—</option>
            {subcategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Descrição">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputCls} h-auto py-2`} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Tags">
            <div className="flex flex-wrap gap-2">
              {[
                { v: "destaques", l: "Destaques" },
                { v: "lancamentos", l: "Lançamentos" },
                { v: "ofertas", l: "Ofertas" },
                { v: "principal", l: "Principal" },
              ].map((t) => (
                <button key={t.v} type="button" onClick={() => toggleTag(t.v)} className={`rounded-full border px-4 py-1.5 text-sm ${tags.includes(t.v) ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{t.l}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-border text-accent" />
            Produto ativo
          </label>
        </div>
      </div>

      {/* Images */}
      <section className="mt-8">
        <h3 className="mb-3 font-display text-lg font-semibold">Imagens (até 6)</h3>
        <div className="flex flex-wrap gap-3">
          {images.map((im, i) => (
            <div key={i} className="relative h-28 w-24 overflow-hidden rounded-md border border-border">
              <img src={im.url} alt="" className="h-full w-full object-cover" />
              <button onClick={() => setImages((p) => p.filter((_, x) => x !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <label className="grid h-28 w-24 cursor-pointer place-items-center rounded-md border-2 border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
              <Upload className="h-5 w-5" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
            </label>
          )}
        </div>
      </section>

      {/* Colors */}
      <section className="mt-8">
        <h3 className="mb-3 font-display text-lg font-semibold">Cores</h3>
        <div className="space-y-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={c.name} onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Nome" className={`${inputCls} flex-1`} />
              <input type="color" value={c.hex} onChange={(e) => setColors((p) => p.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} className="h-10 w-14 rounded border border-input" />
              <button onClick={() => setColors((p) => p.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => setColors((p) => [...p, { name: "", hex: "#000000", position: p.length }])} className="inline-flex items-center gap-1 text-sm font-medium text-accent">
            <Plus className="h-4 w-4" /> Adicionar cor
          </button>
        </div>
      </section>

      {/* Sizes */}
      <section className="mt-8">
        <h3 className="mb-3 font-display text-lg font-semibold">Tamanhos</h3>
        <div className="space-y-2">
          {sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s.label} onChange={(e) => setSizes((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Ex: P, M, G, 4, 6" className={`${inputCls} flex-1`} />
              <button onClick={() => setSizes((p) => p.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => setSizes((p) => [...p, { label: "", position: p.length }])} className="inline-flex items-center gap-1 text-sm font-medium text-accent">
            <Plus className="h-4 w-4" /> Adicionar tamanho
          </button>
        </div>
      </section>

      {/* Stock matrix */}
      {colors.length > 0 && sizes.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-3 font-display text-lg font-semibold">Estoque (Cor × Tamanho)</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="p-2 text-left">Cor / Tamanho</th>
                  {sizes.map((s, i) => <th key={i} className="p-2 text-center">{s.label || `T${i + 1}`}</th>)}
                </tr>
              </thead>
              <tbody>
                {colors.map((c, ci) => (
                  <tr key={ci} className="border-t border-border">
                    <td className="p-2"><span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />{c.name || `C${ci + 1}`}</span></td>
                    {sizes.map((_, si) => (
                      <td key={si} className="p-1">
                        <input type="number" min={0} value={stock[`${ci}-${si}`] ?? 0} onChange={(e) => setStock((p) => ({ ...p, [`${ci}-${si}`]: Number(e.target.value) }))} className="h-9 w-16 rounded border border-input bg-background px-2 text-center text-sm outline-none focus:border-accent" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-8 flex gap-3">
        <button onClick={save} disabled={saving} className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={() => navigate({ to: "/admin/produtos" })} className="rounded-full border border-border px-6 py-2.5 text-sm font-medium">Cancelar</button>
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
