import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/")({
  component: ProductsList,
});

function ProductsList() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,slug,brand,price,promo_price,active,product_images(url,position)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/produtos/novo" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90">
          <Plus className="h-4 w-4" /> Novo
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3 hidden md:table-cell">Marca</th>
                <th className="p-3">Preço</th>
                <th className="p-3 hidden md:table-cell">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = (p.product_images as { url: string; position: number }[] | null)?.sort((a, b) => a.position - b.position)[0]?.url;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {img && <img src={img} alt="" className="h-12 w-10 rounded object-cover" />}
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{p.brand}</td>
                    <td className="p-3">
                      {p.promo_price ? (
                        <div>
                          <div className="font-semibold text-accent">{formatBRL(Number(p.promo_price))}</div>
                          <div className="text-xs text-muted-foreground line-through">{formatBRL(Number(p.price))}</div>
                        </div>
                      ) : (
                        <div className="font-semibold">{formatBRL(Number(p.price))}</div>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link to="/admin/produtos/$id" params={{ id: p.id }} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary" aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => remove(p.id)} className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10" aria-label="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
