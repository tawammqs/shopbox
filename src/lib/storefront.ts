import { supabase } from "@/integrations/supabase/client";
import { effectivePrice } from "./format";
import { hasProductSection, type ProductSectionKey } from "./product-sections";

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
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
  trust_badges: string[];
  welcome_popup: {
    enabled?: boolean;
    delaySeconds?: number;
    coupon?: string;
    message?: string;
    frequency?: string;
  };
  active: boolean;
  subscription_status: string;
  trial_ends_at: string | null;
  affiliates_enabled: boolean;
  affiliate_commission_direct: number;
  affiliate_commission_referrer: number;
};

export type PaymentSettings = {
  pix_enabled: boolean;
  pix_discount_percent: number;
  credit_card_enabled: boolean;
  cash_enabled: boolean;
  pickup_payment_enabled: boolean;
  installments_enabled: boolean;
  max_installments: number;
  installments_no_interest: boolean;
  min_installment_value: number;
};

export type SocialLinks = {
  instagram_username: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_username: string | null;
  twitter_username: string | null;
  pinterest_url: string | null;
  blog_url: string | null;
};

export type ContactInfo = {
  company_name: string | null;
  tax_id: string | null;
  store_email: string | null;
  address: string | null;
  phone: string | null;
  contact_text: string | null;
};

export type StoreMenu = {
  id: string;
  name: string;
  items: { id: string; label: string; url: string | null; position: number }[];
};

export type StaticPageSummary = { id: string; slug: string; title: string };

export async function fetchStoreBySlug(slug: string): Promise<StoreRow | null> {
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, slug, name, tagline, logo_url, accent_color, whatsapp, whatsapp_greeting, instagram, facebook, tiktok, youtube, facebook_pixel_id, google_analytics_id, trust_badges, welcome_popup, active, subscription_status, trial_ends_at, affiliates_enabled, affiliate_commission_direct, affiliate_commission_referrer",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    trust_badges: Array.isArray(data.trust_badges) ? (data.trust_badges as string[]) : [],
    welcome_popup: (data.welcome_popup ?? {}) as StoreRow["welcome_popup"],
    affiliates_enabled: !!data.affiliates_enabled,
    affiliate_commission_direct: Number((data as any).affiliate_commission_direct ?? 5),
    affiliate_commission_referrer: Number((data as any).affiliate_commission_referrer ?? 2.5),
  };
}

export async function fetchPaymentSettings(storeId: string): Promise<PaymentSettings | null> {
  const { data } = await supabase
    .from("store_payment_settings")
    .select("pix_enabled, pix_discount_percent, credit_card_enabled, cash_enabled, pickup_payment_enabled, installments_enabled, max_installments, installments_no_interest, min_installment_value")
    .eq("store_id", storeId)
    .maybeSingle();
  if (!data) return null;
  return {
    pix_enabled: !!data.pix_enabled,
    pix_discount_percent: Number(data.pix_discount_percent ?? 0),
    credit_card_enabled: !!data.credit_card_enabled,
    cash_enabled: !!data.cash_enabled,
    pickup_payment_enabled: !!data.pickup_payment_enabled,
    installments_enabled: !!data.installments_enabled,
    max_installments: Number(data.max_installments ?? 3),
    installments_no_interest: !!data.installments_no_interest,
    min_installment_value: Number(data.min_installment_value ?? 10),
  };
}

export async function fetchSocialLinks(storeId: string): Promise<SocialLinks | null> {
  const { data } = await supabase
    .from("store_social_links")
    .select("instagram_username, facebook_url, youtube_url, tiktok_username, twitter_username, pinterest_url, blog_url")
    .eq("store_id", storeId)
    .maybeSingle();
  return (data as SocialLinks) ?? null;
}

export async function fetchContactInfo(storeId: string): Promise<ContactInfo | null> {
  const { data } = await supabase
    .from("store_contact_info")
    .select("company_name, tax_id, store_email, address, phone, contact_text")
    .eq("store_id", storeId)
    .maybeSingle();
  return (data as ContactInfo) ?? null;
}

export async function fetchStoreMenus(storeId: string): Promise<StoreMenu[]> {
  const { data } = await supabase
    .from("store_menus")
    .select("id, name, store_menu_items(id, label, url, position)")
    .eq("store_id", storeId);
  return (data ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    items: (m.store_menu_items ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((i: any) => ({ id: i.id, label: i.label, url: i.url, position: i.position })),
  }));
}

export async function fetchStaticPages(storeId: string): Promise<StaticPageSummary[]> {
  const { data } = await supabase
    .from("static_pages")
    .select("id, slug, title")
    .eq("store_id", storeId)
    .order("title", { ascending: true });
  return (data ?? []) as StaticPageSummary[];
}

export async function fetchStaticPage(storeId: string, slug: string) {
  const { data } = await supabase
    .from("static_pages")
    .select("id, slug, title, content_md")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .maybeSingle();
  return data;
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

export async function fetchActiveThemeSlug(storeId: string): Promise<string | null> {
  const { data: settings } = await supabase
    .from("store_theme_settings")
    .select("active_theme_id")
    .eq("store_id", storeId)
    .maybeSingle();
  if (!settings?.active_theme_id) return null;
  const { data: theme } = await supabase
    .from("themes")
    .select("slug")
    .eq("id", settings.active_theme_id)
    .maybeSingle();
  return theme?.slug ?? null;
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
  featured_sections?: string[] | null;
  on_sale?: boolean | null;
  images: { url: string; position: number }[];
  colors: { id: string; name: string; hex: string }[];
  totalStock: number;
};

export async function fetchProductsByTag(storeId: string, tag: string, limit = 12) {
  const mappedSection = sectionKeyFromTag(tag);
  if (mappedSection) return fetchProductsByHomepageSection(storeId, mappedSection, limit);

  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, brand, brand_name, price, promo_price, original_price, tags, featured_sections, on_sale,
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

function sectionKeyFromTag(tag: string): ProductSectionKey | null {
  const t = tag.toLowerCase();
  if (["destaque", "destaques"].includes(t)) return "destaque";
  if (["lancamento", "lancamentos", "lançamentos", "novos"].includes(t)) return "lancamento";
  if (["mais_vendido", "mais_vendidos", "mais-vendidos"].includes(t)) return "mais_vendido";
  if (["promocao", "promoção", "oferta", "ofertas"].includes(t)) return "promocao";
  return null;
}

export async function fetchProductsByHomepageSection(storeId: string, sectionKey: ProductSectionKey, limit = 12) {
  // STRICT filter — only products that explicitly carry the canonical section
  // in featured_sections (the admin checkbox). Legacy tag values were migrated
  // into featured_sections. No fallback to tags / on_sale / promo_price / category.
  const [{ data, error }, { data: positions }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `id, slug, title, brand, brand_name, price, promo_price, original_price, tags, featured_sections, on_sale,
         product_images(url, position),
         product_colors(id, name, hex),
         product_stock(quantity)`,
      )
      .eq("store_id", storeId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("product_section_positions")
      .select("product_id, position")
      .eq("store_id", storeId)
      .eq("section_key", sectionKey),
  ]);
  if (error) throw error;
  const posMap = new Map<string, number>((positions ?? []).map((p: any) => [p.product_id, p.position]));
  return (data ?? [])
    .filter((p: any) => hasProductSection(p.featured_sections, sectionKey))
    .sort((a: any, b: any) => {
      const pa = posMap.has(a.id) ? (posMap.get(a.id) as number) : 999_999;
      const pb = posMap.has(b.id) ? (posMap.get(b.id) as number) : 999_999;
      return pa - pb;
    })
    .slice(0, limit)
    .map(normalizeProductCard);
}

export async function fetchProductsForCategory(
  storeId: string,
  categoryIds: string[] | null,
  opts: { limit?: number; offset?: number; sort?: string; minPrice?: number; maxPrice?: number; sizes?: string[]; colorNames?: string[]; brands?: string[]; inStock?: boolean } = {},
) {
  let q = supabase
    .from("products")
    .select(
      `id, slug, title, brand, price, promo_price, original_price, tags, created_at,
       product_images(url, position),
       product_colors(id, name, hex),
       product_sizes(id, label),
       product_stock(quantity, color_id, size_id)`,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .eq("active", true);

  if (categoryIds && categoryIds.length > 0) {
    // Resolve via junction table to support products belonging to multiple categories
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", categoryIds);
    const productIds = Array.from(new Set((links ?? []).map((l: any) => l.product_id)));
    if (productIds.length === 0) return { products: [], total: 0 };
    q = q.in("id", productIds);
  }
  if (opts.brands && opts.brands.length) {
    // Case/whitespace-insensitive brand match ("THE SHOES" == "The Shoes" == " the shoes ")
    const safe = opts.brands.map((b) => b.trim().replace(/[,()]/g, "")).filter(Boolean);
    if (safe.length) q = q.or(safe.map((b) => `brand.ilike.${b}`).join(","));
  }

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
    case "mais_vendidos":
      q = q.order("view_count", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  q = q.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 12) - 1);
  const { data, error, count } = await q;
  if (error) throw error;

  let products = (data ?? []).map((row: any) => ({ ...normalizeProductCard(row), _raw: row }));

  // Client-side filters that need joined data
  if (opts.minPrice != null) products = products.filter((p) => effectivePrice(p.price, p.promo_price) >= opts.minPrice!);
  if (opts.maxPrice != null) products = products.filter((p) => effectivePrice(p.price, p.promo_price) <= opts.maxPrice!);

  if (opts.colorNames?.length)
    products = products.filter((p) => p.colors.some((c) => opts.colorNames!.includes(c.name)));

  if (opts.sizes?.length) {
    const wanted = new Set(opts.sizes.map((s) => s.toLowerCase()));
    products = products.filter((p) => {
      const sizes = (p._raw.product_sizes ?? []) as { id: string; label: string }[];
      const stock = (p._raw.product_stock ?? []) as { size_id: string | null; quantity: number }[];
      const inStockSizeIds = new Set(
        stock.filter((s) => (s.quantity ?? 0) > 0 && s.size_id).map((s) => s.size_id as string),
      );
      return sizes.some((s) => wanted.has(s.label.toLowerCase()) && inStockSizeIds.has(s.id));
    });
  }

  if (opts.inStock) products = products.filter((p) => p.totalStock > 0);

  // Strip raw join data from final result
  const cleaned = products.map(({ _raw, ...rest }) => rest);
  return { products: cleaned, total: count ?? cleaned.length };
}

export async function fetchCategoryFacets(storeId: string, categoryIds: string[] | null) {
  let q = supabase
    .from("products")
    .select(
      `id, brand, price, promo_price, original_price,
       product_sizes(id, label),
       product_colors(id, name, hex)`,
    )
    .eq("store_id", storeId)
    .eq("active", true);

  if (categoryIds && categoryIds.length > 0) {
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id")
      .in("category_id", categoryIds);
    const productIds = Array.from(new Set((links ?? []).map((l: any) => l.product_id)));
    if (productIds.length === 0) {
      return { sizes: [], brands: [], colors: [], priceMin: 0, priceMax: 0 };
    }
    q = q.in("id", productIds);
  }

  const { data, error } = await q;
  if (error) throw error;

  const rows = data ?? [];
  const sizeCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  const colorCounts = new Map<string, { count: number; hex: string }>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of rows as any[]) {
    const eff = effectivePrice(Number(p.price), p.promo_price != null ? Number(p.promo_price) : null);
    if (eff < priceMin) priceMin = eff;
    if (eff > priceMax) priceMax = eff;

    if (p.brand && String(p.brand).trim()) {
      const raw = String(p.brand).trim();
      // Merge case variants ("OLYM" / "Olym") under the first spelling seen
      const b = Array.from(brandCounts.keys()).find((k) => k.toLowerCase() === raw.toLowerCase()) ?? raw;
      brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
    }

    const sizes = (p.product_sizes ?? []) as { id: string; label: string }[];
    const productSizeLabels = new Set<string>();
    for (const s of sizes) {
      if (s.label && String(s.label).trim()) productSizeLabels.add(s.label);
    }
    for (const label of productSizeLabels) {
      sizeCounts.set(label, (sizeCounts.get(label) ?? 0) + 1);
    }

    const colors = (p.product_colors ?? []) as { name: string; hex: string }[];
    const productColorNames = new Set<string>();
    for (const c of colors) {
      if (c.name && String(c.name).trim()) {
        const name = String(c.name).trim();
        productColorNames.add(name);
        if (!colorCounts.has(name)) colorCounts.set(name, { count: 0, hex: c.hex || "#cccccc" });
      }
    }
    for (const name of productColorNames) {
      const entry = colorCounts.get(name)!;
      entry.count += 1;
    }
  }

  if (!isFinite(priceMin)) priceMin = 0;

  // Sort sizes intelligently: numeric ascending first, then letters in standard order
  const letterOrder = ["PP", "P", "M", "G", "GG", "XGG", "XG"];
  const sizeArr = Array.from(sizeCounts.entries()).map(([label, count]) => ({ label, count }));
  sizeArr.sort((a, b) => {
    const an = Number(a.label);
    const bn = Number(b.label);
    const aNum = !isNaN(an);
    const bNum = !isNaN(bn);
    if (aNum && bNum) return an - bn;
    if (aNum) return -1;
    if (bNum) return 1;
    const ai = letterOrder.indexOf(a.label.toUpperCase());
    const bi = letterOrder.indexOf(b.label.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.label.localeCompare(b.label);
  });

  const brandArr = Array.from(brandCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const colorArr = Array.from(colorCounts.entries())
    .map(([name, v]) => ({ name, hex: v.hex, count: v.count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    sizes: sizeArr,
    brands: brandArr,
    colors: colorArr,
    priceMin: Math.floor(priceMin),
    priceMax: Math.ceil(priceMax),
  };
}

export async function searchProductsLive(storeId: string, term: string, limit = 6) {
  if (!term || term.trim().length < 2) return [];
  const like = `%${term.trim()}%`;
  const { data, error } = await supabase
    .from("products")
    .select(`id, slug, title, brand, brand_name, price, promo_price, original_price, tags, featured_sections, on_sale,
             product_images(url, position),
             product_colors(id, name, hex),
             product_stock(quantity)`)
    .eq("store_id", storeId)
    .eq("active", true)
    .or(`title.ilike.${like},brand.ilike.${like},brand_name.ilike.${like}`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((p) => {
    const card = normalizeProductCard(p);
    return { ...card, image: card.images[0]?.url ?? null };
  });
}

function normalizeProductCard(p: any): ProductCardData {
  const images = (p.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const colors = (p.product_colors ?? []).map((c: any) => ({ id: c.id, name: c.name, hex: c.hex }));
  const totalStock = (p.product_stock ?? []).reduce((acc: number, s: any) => acc + (s.quantity ?? 0), 0);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    brand: p.brand_name ?? p.brand,
    price: Number(p.price),
    promo_price: p.promo_price != null ? Number(p.promo_price) : null,
    tags: (p.tags ?? []) as string[],
    featured_sections: (p.featured_sections ?? []) as string[],
    on_sale: p.on_sale ?? false,
    images,
    colors,
    totalStock,
  };
}

export async function fetchProductFull(storeId: string, slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, brand, sku, description, price, promo_price, original_price, tags, low_stock_threshold,
       category_id,
       product_images(id, url, position),
       product_colors(id, name, hex, position),
       product_sizes(id, label, position),
       product_stock(id, color_id, size_id, quantity),
       product_video_testimonials(id, video_url, kind, customer_name, quote, rating, position),
       product_reviews(id, customer_name, rating, text, status, photo_url, created_at)`,
    )
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchBestSellersForStore(storeId: string, limit = 8) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, brand, price, promo_price, original_price, tags,
       product_images(url, position),
       product_colors(id, name, hex),
       product_stock(quantity)`,
    )
    .eq("store_id", storeId)
    .eq("active", true)
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(normalizeProductCard);
}

export async function fetchStoreVideoTestimonials(storeId: string, limit = 8) {
  const { data, error } = await supabase
    .from("product_video_testimonials")
    .select(`id, video_url, kind, customer_name, quote, position,
             products!inner(id, slug, title, price, promo_price, original_price, store_id, product_images(url, position))`)
    .eq("products.store_id", storeId)
    .not("video_url", "is", null)
    .order("position", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any[];
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

export async function fetchStoreBrands(storeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("brand")
    .eq("store_id", storeId)
    .eq("active", true)
    .not("brand", "is", null)
    .neq("brand", "");
  if (error) throw error;
  const seen = new Map<string, string>();
  (data ?? []).forEach((p: any) => {
    const raw = String(p.brand).trim();
    if (!raw) return;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}
