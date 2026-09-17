/**
 * Server-side resolution of a custom domain (e.g. www.theshoes.com.br) to its
 * store slug. Used by the router to rewrite URLs so the storefront is served
 * on the merchant's own domain without redirecting.
 */

export const HOST_SLUG_COOKIE = "sb_store_host_slug";

function isShopBoxHost(host: string) {
  return (
    !host ||
    host === "localhost" ||
    host.startsWith("127.") ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovable.dev") ||
    host.endsWith(".vercel.app") ||
    host.endsWith("shopboxapp.com.br")
  );
}

export function normalizeHost(raw: unknown) {
  return String(raw ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .split(":")[0]
    .replace(/\.$/, "");
}

export async function resolveHostSlugForRequest(): Promise<string | null> {
  try {
    const { getRequestHeaders, setResponseHeader } = await import("@tanstack/react-start/server");
    const headers: any = getRequestHeaders();
    const raw =
      typeof headers?.get === "function"
        ? headers.get("x-forwarded-host") || headers.get("host")
        : headers?.["x-forwarded-host"] || headers?.host;
    const host = normalizeHost(raw);
    if (isShopBoxHost(host)) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bare = host.startsWith("www.") ? host.slice(4) : host;
    const candidates = Array.from(new Set([host, bare, `www.${bare}`]));

    const { data: rows } = await supabaseAdmin
      .from("store_domains")
      .select("domain, status, store_id, stores:store_id(slug, active)")
      .in("domain", candidates)
      .in("status", ["active", "pending"]);

    const rec = rows?.find((r: any) => r.domain === host) ?? rows?.[0] ?? null;
    const stores: any = (rec as any)?.stores;
    const slug: string | null = rec && stores?.active ? stores.slug : null;

    try {
      setResponseHeader(
        "set-cookie",
        `${HOST_SLUG_COOKIE}=${slug ?? ""}; Path=/; Max-Age=${slug ? 3600 : 0}; SameSite=Lax`,
      );
    } catch {
      /* header already sent — ignore */
    }

    return slug;
  } catch {
    return null;
  }
}
