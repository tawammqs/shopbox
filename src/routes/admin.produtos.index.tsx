import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { LockedButton } from "@/components/admin/PlanGate";
import { formatBRL } from "@/lib/format";
import { planAllows, PLAN_LIMITS } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/")({
  component: ProductsListPage,
});

function ProductsListPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const planSlug = store?.plan?.slug as any;
  const maxProducts = store?.plan?.max_products ?? PLAN_LIMITS.inicial.maxProducts;

  const productsQuery = useQuery({
    queryKey: ["admin-products", store?.id, search],
    enabled: !!store,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(`id, title, price, promo_price, active, low_stock_threshold,
                 category:categories!products_category_id_fkey(name),
                 product_images(url, position),
                 product_stock(quantity)`)
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const products = productsQuery.data ?? [];
  const productCount = products.length;
  const limitReached = productCount >= maxProducts;
  const limitWarning = productCount >= maxProducts - 5 && !limitReached;

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto atualizado");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const bulkAction = useMutation({
    mutationFn: async (action: "activate" | "deactivate" | "delete") => {
      const ids = Array.from(selected);
      if (action === "delete") {
        const { error } = await supabase.from("products").delete().in("id", ids);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").update({ active: action === "activate" }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Ação aplicada");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{productCount} de {maxProducts}</p>
        </div>
        {limitReached ? (
          <Button disabled title="Limite atingido. Faça upgrade.">
            <Plus className="mr-1.5 h-4 w-4" /> Limite atingido
          </Button>
        ) : (
          <Button asChild>
            <Link to="/admin/produtos/novo"><Plus className="mr-1.5 h-4 w-4" /> Novo produto</Link>
          </Button>
        )}
      </div>

      {limitWarning && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
          ⚠️ Você está perto do limite ({productCount}/{maxProducts} produtos). <Link to="/admin/plano" className="underline">Faça upgrade</Link>.
        </div>
      )}
      {limitReached && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Limite atingido. <Link to="/admin/plano" className="underline font-semibold">Faça upgrade do plano</Link> para adicionar mais produtos.
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produtos…" className="pl-9" />
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <LockedButton plan={planSlug} feature="bulk_actions" size="sm" variant="outline" onClick={() => bulkAction.mutate("activate")}>Ativar</LockedButton>
            <LockedButton plan={planSlug} feature="bulk_actions" size="sm" variant="outline" onClick={() => bulkAction.mutate("deactivate")}>Desativar</LockedButton>
            <LockedButton plan={planSlug} feature="bulk_actions" size="sm" variant="destructive" onClick={() => {
              if (confirm(`Excluir ${selected.size} produtos?`)) bulkAction.mutate("delete");
            }}>Excluir</LockedButton>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">
                <Checkbox
                  checked={selected.size > 0 && selected.size === products.length}
                  onCheckedChange={toggleAll}
                  disabled={!planAllows(planSlug, "bulk_actions")}
                />
              </th>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-left hidden md:table-cell">Categoria</th>
              <th className="p-3 text-left">Preço</th>
              <th className="p-3 text-left hidden sm:table-cell">Estoque</th>
              <th className="p-3 text-left">Ativo</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {productsQuery.isLoading && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {!productsQuery.isLoading && products.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>
            )}
            {products.map((p: any) => {
              const img = p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url;
              const stock = (p.product_stock ?? []).reduce((s: number, x: any) => s + (x.quantity ?? 0), 0);
              const lowStock = stock > 0 && stock <= (p.low_stock_threshold ?? 5);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                      disabled={!planAllows(planSlug, "bulk_actions")}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <span className="font-medium line-clamp-1">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="p-3">
                    <div className="font-medium">{formatBRL(Number(p.promo_price ?? p.price))}</div>
                    {p.promo_price && <div className="text-xs text-muted-foreground line-through">{formatBRL(Number(p.price))}</div>}
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {stock === 0 ? (
                      <span className="text-xs text-destructive">Esgotado</span>
                    ) : lowStock ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />{stock}</span>
                    ) : (
                      <span className="text-xs">{stock}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Switch checked={p.active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, active: v })} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost"><Link to="/admin/produtos/$id" params={{ id: p.id }}><Edit2 className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        if (confirm(`Excluir "${p.title}"?`)) deleteOne.mutate(p.id);
                      }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
