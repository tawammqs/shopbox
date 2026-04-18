import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProductTag = "destaques" | "lancamentos" | "ofertas" | "principal";

export type ProductImage = { id: string; url: string; position: number };
export type ProductColor = { id: string; name: string; hex: string; position: number };
export type ProductSize = { id: string; label: string; position: number };
export type ProductStock = {
  id: string;
  color_id: string | null;
  size_id: string | null;
  quantity: number;
};

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  price: number;
  promo_price: number | null;
  category_id: string | null;
  subcategory_id: string | null;
  tags: ProductTag[];
  active: boolean;
  created_at: string;
  product_images: ProductImage[];
  product_colors: ProductColor[];
};

export type ProductFull = ProductListItem & {
  description: string | null;
  sku: string | null;
  product_sizes: ProductSize[];
  product_stock: ProductStock[];
};

const LIST_SELECT = `
  id, title, slug, brand, price, promo_price, category_id, subcategory_id, tags, active, created_at,
  product_images(id,url,position),
  product_colors(id,name,hex,position)
`;

const FULL_SELECT = `
  id, title, slug, brand, description, sku, price, promo_price, category_id, subcategory_id, tags, active, created_at,
  product_images(id,url,position),
  product_colors(id,name,hex,position),
  product_sizes(id,label,position),
  product_stock(id,color_id,size_id,quantity)
`;

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(LIST_SELECT)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProductListItem[];
    },
  });
}

export function useProductsByTag(tag: ProductTag) {
  return useQuery({
    queryKey: ["products", "tag", tag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(LIST_SELECT)
        .eq("active", true)
        .contains("tags", [tag])
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as unknown as ProductListItem[];
    },
  });
}

export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(FULL_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown) as ProductFull | null;
    },
  });
}
