import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useStorefront } from "@/components/storefront/StoreContext";
import { useWishlist } from "@/stores/wishlist";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { ProductCardData } from "@/lib/storefront";

export const Route = createFileRoute("/loja/$slug/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { store } = useStorefront();
  const ids = useWishlist((s) => s.ids);

  const q = useQuery({
    queryKey: ["wishlist-products", store.id, ids.sort().join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [] as ProductCardData[];
      const { data, error } = await supabase
        .from("products")
        .select(`id, slug, title, brand, price, promo_price, tags,
                 product_images(url, position),
                 product_colors(id, name, hex),
                 product_stock(quantity)`)
        .eq("store_id", store.id)
        .in("id", ids)
        .eq("active", true);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id, slug: p.slug, title: p.title, brand: p.brand,
        price: Number(p.price),
        promo_price: p.promo_price != null ? Number(p.promo_price) : null,
        tags: p.tags ?? [],
        images: (p.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position),
        colors: p.product_colors ?? [],
        totalStock: (p.product_stock ?? []).reduce((acc: number, s: any) => acc + s.quantity, 0),
      })) as ProductCardData[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 font-display text-3xl font-bold">
        <Heart className="h-7 w-7 text-destructive" /> Lista de desejos
      </h1>

      {ids.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Sua lista está vazia.</p>
          <Link to="/loja/$slug" params={{ slug: store.slug }} className="mt-4 inline-block text-accent">
            Explorar produtos
          </Link>
        </div>
      ) : q.data && q.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {q.data.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="text-muted-foreground">Carregando...</p>
      )}
    </div>
  );
}
