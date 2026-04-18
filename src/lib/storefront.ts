import { supabase } from "@/integrations/supabase/client";
import { effectivePrice } from "./format";

export type StoreRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  accent_color: string;
  whatsapp: string;
  whatsapp_greeting: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  trust_badges: string[];
  welcome_popup: {
    enabled?: boolean;
    delaySeconds?: number;
    coupon?: string;
    message?: string;
    frequency?: string;
  };
};

export async function fetchStoreBySlug(slug: string): Promise<StoreRow | null> {
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, slug, name, tagline, logo_url, accent_color, whatsapp, whatsapp_greeting, instagram, facebook, tiktok, youtube, trust_badges, welcome_popup",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    trust_badges: Array.isArray(data.trust_badges) ? (data.trust_badges as string[]) : [],
    welcome_popup: (data.welcome_popup ?? {}) as StoreRow["welcome_popup"],
  };
}

export async function fetchCategories(storeId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, image_url, display_order")
    .eq("store_id", storeId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveBanners(storeId: string) {
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, button_label, button_link, desktop_url, mobile_url, display_order")
    .eq("store_id", storeId)
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  price: number;
  promo_price: number | null;
  tags: string[];
  images: { url: string; position: number }[];
  colors: { id: string; name: string; hex: string }[];
  totalStock: number;
};

export async function fetchProductsByTag(storeId: string, tag: string, limit = 12) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, brand, price, promo_price, tags,
       product_images(url, position),
       product_colors(id, name, hex),
       product_stock(quantity)`,
    )
    .eq("store_id", storeId)
    .eq("active", true)
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(normalizeProductCard);
}

export async function fetchProductsForCategory(
  storeId: string,
  categoryIds: string[] | null,
  opts: { limit?: number; offset?: number; sort?: string; minPrice?: number; maxPrice?: number; sizes?: string[]; colorNames?: string[]; brands?: string[]; inStock?: boolean } = {},
) {
  let q = supabase
    .from("products")
    .select(
      `id, slug, title, brand, price, promo_price, tags, created_at,
       product_images(url, position),
       product_colors(id, name, hex),
       product_sizes(id, label),
       product_stock(quantity, color_id, size_id)`,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .eq("active", true);

  if (categoryIds && categoryIds.length > 0) {
    q = q.in("category_id", categoryIds);
  }
  if (opts.brands && opts.brands.length) q = q.in("brand", opts.brands);

  switch (opts.sort) {
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    case "ofertas":
      q = q.not("promo_price", "is", null).order("created_at", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 12) - 1);
  const { data, error, count } = await q;
  if (error) throw error;

  let products = (data ?? []).map(normalizeProductCard);

  // Client-side filters that need joined data
  if (opts.minPrice != null) products = products.filter((p) => effectivePrice(p.price, p.promo_price) >= opts.minPrice!);
  if (opts.maxPrice != null) products = products.filter((p) => effectivePrice(p.price, p.promo_price) <= opts.maxPrice!);
  if (opts.inStock) products = products.filter((p) => p.totalStock > 0);
  if (opts.colorNames?.length)
    products = products.filter((p) => p.colors.some((c) => opts.colorNames!.includes(c.name)));

  return { products, total: count ?? products.length };
}

export async function searchProductsLive(storeId: string, term: string, limit = 6) {
  if (!term || term.trim().length < 2) return [];
  const like = `%${term.trim()}%`;
  const { data, error } = await supabase
    .from("products")
    .select(`id, slug, title, brand, price, promo_price,
             product_images(url, position)`)
    .eq("store_id", storeId)
    .eq("active", true)
    .or(`title.ilike.${like},brand.ilike.${like}`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    price: Number(p.price),
    promo_price: p.promo_price != null ? Number(p.promo_price) : null,
    image: (p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url) ?? null,
  }));
}

function normalizeProductCard(p: any): ProductCardData {
  const images = (p.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const colors = (p.product_colors ?? []).map((c: any) => ({ id: c.id, name: c.name, hex: c.hex }));
  const totalStock = (p.product_stock ?? []).reduce((acc: number, s: any) => acc + (s.quantity ?? 0), 0);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand,
    price: Number(p.price),
    promo_price: p.promo_price != null ? Number(p.promo_price) : null,
    tags: (p.tags ?? []) as string[],
    images,
    colors,
    totalStock,
  };
}

export async function fetchProductFull(storeId: string, slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, brand, sku, description, price, promo_price, tags, low_stock_threshold,
       category_id,
       product_images(id, url, position),
       product_colors(id, name, hex, position),
       product_sizes(id, label, position),
       product_stock(id, color_id, size_id, quantity),
       product_video_testimonials(id, video_url, kind, customer_name, quote, rating, position),
       product_reviews(id, customer_name, rating, text, status, created_at)`,
    )
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchActiveCoupon(storeId: string, code: string) {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, type, value, min_cart, expires_at, max_uses, uses_count, active")
    .eq("store_id", storeId)
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  if (data.max_uses != null && data.uses_count >= data.max_uses) return null;
  return data;
}
