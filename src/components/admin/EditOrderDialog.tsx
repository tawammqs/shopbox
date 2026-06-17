import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export type EditableOrder = {
  id: string;
  store_id: string;
  order_number: number;
  items: any;
  subtotal: number;
  discount_amount: number | null;
  total: number;
};

type Item = {
  product_id?: string | null;
  title: string;
  slug?: string | null;
  image?: string | null;
  size?: string | null;
  color?: string | null;
  quantity: number;
  unit_price: number;
  line_total?: number;
};

type ProductHit = {
  id: string;
  title: string;
  slug: string;
  price: number;
  promo_price: number | null;
  image: string | null;
};

export function EditOrderDialog({
  order,
  onClose,
  onSaved,
}: {
  order: EditableOrder | null;
  onClose: () => void;
  onSaved: (updated: { id: string; items: Item[]; subtotal: number; total: number }) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      const initial: Item[] = Array.isArray(order.items)
        ? order.items.map((it: any) => ({
            product_id: it.product_id ?? null,
            title: it.title ?? "Item",
            slug: it.slug ?? null,
            image: it.image ?? null,
            size: it.size ?? null,
            color: it.color ?? null,
            quantity: Number(it.quantity) || 1,
            unit_price: Number(it.unit_price) || 0,
          }))
        : [];
      setItems(initial);
      setSearch("");
      setResults([]);
    }
  }, [order]);

  useEffect(() => {
    if (!order) return;
    const q = search.trim();
    console.log("[DEBUG] searchProduct:", search, "| store_id:", order?.store_id);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      // Tolerant tokenizer: split by whitespace AND letter↔digit boundaries
      // so "nb9060" matches "NB 9060 | ..." and "9060 nb" also works.
      const tokens = q
        .toLowerCase()
        .replace(/([a-zà-ÿ])(\d)/g, "$1 $2")
        .replace(/(\d)([a-zà-ÿ])/g, "$1 $2")
        .split(/\s+/)
        .filter((t) => t.length >= 1);
      let query = supabase
        .from("products")
        .select("id, title, slug, price, promo_price, product_images(image_url, sort_order)")
        .eq("store_id", order.store_id);
      for (const tok of tokens) {
        query = query.ilike("title", `%${tok}%`);
      }
      const { data, error } = await query.limit(6);
      console.log("[DEBUG] resultado:", data, "| erro:", error);
      if (cancelled) return;
      const hits: ProductHit[] = (data ?? []).map((p: any) => {
        const imgs = (p.product_images ?? []).slice().sort(
          (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        );
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price) || 0,
          promo_price: p.promo_price != null ? Number(p.promo_price) : null,
          image: imgs[0]?.image_url ?? null,
        };
      });
      setResults(hits);
      setSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, order]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0),
    [items],
  );
  const discount = Number(order?.discount_amount ?? 0);
  const total = Math.max(0, subtotal - discount);

  if (!order) return null;

  const addProduct = (p: ProductHit) => {
    const unit = p.promo_price ?? p.price;
    setItems((cur) => {
      const idx = cur.findIndex((it) => it.product_id === p.id && !it.size && !it.color);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...cur,
        {
          product_id: p.id,
          title: p.title,
          slug: p.slug,
          image: p.image,
          quantity: 1,
          unit_price: unit,
        },
      ];
    });
    setSearch("");
    setResults([]);
  };

  const updateQty = (i: number, q: number) =>
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, quantity: Math.max(1, q) } : it)));

  const updatePrice = (i: number, p: number) =>
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, unit_price: Math.max(0, p) } : it)));

  const removeItem = (i: number) => setItems((cur) => cur.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }
    setSaving(true);
    const persistedItems = items.map((it) => ({
      ...it,
      line_total: Number((it.unit_price * it.quantity).toFixed(2)),
    }));
    const { error } = await supabase
      .from("orders")
      .update({
        items: persistedItems,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(total.toFixed(2)),
      })
      .eq("id", order.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar a venda.");
      return;
    }
    toast.success("Venda atualizada!");
    onSaved({ id: order.id, items: persistedItems, subtotal, total });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">
              Editar venda #{String(order.order_number).padStart(3, "0")}
            </h3>
            <p className="text-xs text-muted-foreground">
              Ajuste itens, quantidades ou preços. O total é recalculado automaticamente.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-muted-foreground">
                Nenhum item. Adicione um produto abaixo.
              </p>
            ) : (
              items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                  {it.image ? (
                    <img src={it.image} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.title}</p>
                    {(it.size || it.color) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {[it.size && `Tam ${it.size}`, it.color].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateQty(i, parseInt(e.target.value) || 1)}
                    className="h-8 w-14 px-1 text-center text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unit_price}
                    onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                    className="h-8 w-20 px-1 text-right text-sm"
                  />
                  <span className="w-20 text-right text-sm font-medium">
                    {formatBRL(it.unit_price * it.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Remover item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto para adicionar..."
              className="pl-9"
            />
            <p className="mt-1 text-xs text-red-500">
              DEBUG: buscando por "{search}" | {results.length} resultados
            </p>
            {(results.length > 0 || searching) && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {searching ? (
                  <div className="flex items-center justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {p.image ? (
                        <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100" />
                      )}
                      <span className="flex-1 truncate">{p.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatBRL(p.promo_price ?? p.price)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-gray-200 px-6 py-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>− {formatBRL(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
              <span>Novo total</span>
              <span className="text-[#25d366]">{formatBRL(total)}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-[#25d366] text-white hover:bg-[#1fb959]"
              onClick={handleSave}
              disabled={saving || items.length === 0}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
