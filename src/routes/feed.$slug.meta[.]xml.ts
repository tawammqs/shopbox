import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function xmlEscape(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function priceStr(n: number): string {
  return `${Number(n).toFixed(2)} BRL`;
}

function isPromoActive(p: any): boolean {
  if (p.promo_price == null) return false;
  const now = Date.now();
  if (p.promo_starts_at && new Date(p.promo_starts_at).getTime() > now) return false;
  if (p.promo_ends_at && new Date(p.promo_ends_at).getTime() < now) return false;
  return true;
}

export const Route = createFileRoute("/feed/$slug/meta.xml")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const slug = params.slug;
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
        const allPages = url.searchParams.get("page") == null; // default: sem paginação, exporta tudo
        const PAGE_SIZE = 100;


        const { data: store, error: storeErr } = await supabaseAdmin
          .from("stores")
          .select("id, name, slug, tagline, custom_domain")
          .eq("slug", slug)
          .eq("active", true)
          .maybeSingle();

        if (storeErr) {
          return new Response(`Error: ${storeErr.message}`, { status: 500 });
        }
        if (!store) {
          return new Response("Store not found", { status: 404 });
        }

        const origin = url.origin;
        const storeUrl = store.custom_domain
          ? `https://${store.custom_domain}`
          : `${origin}/loja/${store.slug}`;

        const selectFields = `id, slug, title, description, brand, price, promo_price,
             promo_starts_at, promo_ends_at, category_id,
             product_images(url, position),
             product_colors(name),
             product_sizes(label),
             product_stock(quantity)`;

        let products: any[] = [];
        let totalCount = 0;
        let from = 0;

        if (allPages) {
          // Busca todos os produtos em lotes de 1000 (limite do servidor), sem paginação no XML
          const FETCH_BATCH = 1000;
          let batchFrom = 0;
          while (true) {
            const { data, error, count } = await supabaseAdmin
              .from("products")
              .select(selectFields, { count: "exact" })
              .eq("store_id", store.id)
              .eq("active", true)
              .order("updated_at", { ascending: false })
              .range(batchFrom, batchFrom + FETCH_BATCH - 1);
            if (error) {
              return new Response(`Error: ${error.message}`, { status: 500 });
            }
            if (count != null) totalCount = count;
            if (!data || data.length === 0) break;
            products = products.concat(data);
            if (data.length < FETCH_BATCH) break;
            batchFrom += FETCH_BATCH;
          }
        } else {
          from = (page - 1) * PAGE_SIZE;
          const { data, error: prodErr, count } = await supabaseAdmin
            .from("products")
            .select(selectFields, { count: "exact" })
            .eq("store_id", store.id)
            .eq("active", true)
            .order("updated_at", { ascending: false })
            .range(from, from + PAGE_SIZE - 1);
          if (prodErr) {
            return new Response(`Error: ${prodErr.message}`, { status: 500 });
          }
          products = data ?? [];
          totalCount = count ?? 0;
        }

        const totalCount = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

        // Build category lookup for product_type
        const catIds = Array.from(
          new Set((products ?? []).map((p: any) => p.category_id).filter(Boolean)),
        );
        const catMap = new Map<string, { name: string; parent_id: string | null }>();
        if (catIds.length > 0) {
          const { data: cats } = await supabaseAdmin
            .from("categories")
            .select("id, name, parent_id")
            .in("id", catIds as string[]);
          for (const c of cats ?? []) catMap.set(c.id, { name: c.name, parent_id: c.parent_id });
        }
        // Also fetch parents
        const parentIds = Array.from(
          new Set(Array.from(catMap.values()).map((c) => c.parent_id).filter(Boolean) as string[]),
        );
        const parentMap = new Map<string, string>();
        if (parentIds.length > 0) {
          const { data: parents } = await supabaseAdmin
            .from("categories")
            .select("id, name")
            .in("id", parentIds);
          for (const p of parents ?? []) parentMap.set(p.id, p.name);
        }

        const items = (products ?? []).map((p: any) => {
          const images = (p.product_images ?? [])
            .slice()
            .sort((a: any, b: any) => a.position - b.position);
          const mainImg = images[0]?.url ?? "";
          const additional = images
            .slice(1, 11)
            .map((i: any) => `      <g:additional_image_link>${xmlEscape(i.url)}</g:additional_image_link>`)
            .join("\n");

          const totalStock = (p.product_stock ?? []).reduce(
            (a: number, s: any) => a + (s.quantity ?? 0),
            0,
          );
          const availability = totalStock > 0 ? "in stock" : "out of stock";

          const promo = isPromoActive(p);
          const salePriceTag = promo
            ? `\n      <g:sale_price>${priceStr(Number(p.promo_price))}</g:sale_price>`
            : "";

          const brand = (p.brand && String(p.brand).trim()) || store.name;
          const link = `${storeUrl}/produto/${p.slug}`;

          const cat = p.category_id ? catMap.get(p.category_id) : null;
          let productType = "";
          if (cat) {
            const parentName = cat.parent_id ? parentMap.get(cat.parent_id) : null;
            productType = parentName ? `${parentName} > ${cat.name}` : cat.name;
          }
          const productTypeTag = productType
            ? `\n      <g:product_type>${xmlEscape(productType)}</g:product_type>`
            : "";

          const colorTags = (p.product_colors ?? [])
            .map((c: any) => `      <g:color>${xmlEscape(c.name)}</g:color>`)
            .join("\n");
          const sizeTags = (p.product_sizes ?? [])
            .map((s: any) => `      <g:size>${xmlEscape(s.label)}</g:size>`)
            .join("\n");

          return `    <item>
      <g:id>${xmlEscape(p.id)}</g:id>
      <g:title>${xmlEscape(p.title)}</g:title>
      <g:description>${xmlEscape(stripHtml(p.description))}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(mainImg)}</g:image_link>
${additional ? additional + "\n" : ""}      <g:availability>${availability}</g:availability>
      <g:price>${priceStr(Number(p.price))}</g:price>${salePriceTag}
      <g:brand>${xmlEscape(brand)}</g:brand>
      <g:condition>new</g:condition>${productTypeTag}
${colorTags ? colorTags + "\n" : ""}${sizeTags ? sizeTags + "\n" : ""}    </item>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${xmlEscape(store.name)}</title>
    <link>${xmlEscape(storeUrl)}</link>
    <description>${xmlEscape(store.tagline || `Loja online de ${store.name}`)}</description>
    <g:total_results>${totalCount}</g:total_results>
    <g:start_index>${from + 1}</g:start_index>
    <g:items_per_page>${PAGE_SIZE}</g:items_per_page>
${items.join("\n")}
  </channel>
</rss>
`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
            "X-Total-Count": String(totalCount),
            "X-Total-Pages": String(totalPages),
            "X-Current-Page": String(page),
          },
        });
      },
    },
  },
});
