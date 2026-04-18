import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, FolderTree, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [products, categories, banners, lowStock] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("product_stock").select("id", { count: "exact", head: true }).lte("quantity", 5),
      ]);
      return {
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        banners: banners.count ?? 0,
        lowStock: lowStock.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Produtos", value: stats?.products ?? 0, icon: Package, color: "bg-accent/10 text-accent" },
    { label: "Categorias", value: stats?.categories ?? 0, icon: FolderTree, color: "bg-blue-500/10 text-blue-600" },
    { label: "Banners ativos", value: stats?.banners ?? 0, icon: ImageIcon, color: "bg-purple-500/10 text-purple-600" },
    { label: "Estoque baixo", value: stats?.lowStock ?? 0, icon: AlertTriangle, color: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua loja</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-lg ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
