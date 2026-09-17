import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CF_BASE = "https://api.cloudflare.com/client/v4";
const FALLBACK_ORIGIN = "shopboxapp.com.br";

function cfHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Response("Cloudflare API token não configurado", { status: 500 });
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function zoneId() {
  const id = process.env.CLOUDFLARE_ZONE_ID;
  if (!id) throw new Response("Cloudflare Zone ID não configurado", { status: 500 });
  return id;
}

async function assertOwnsStore(supabase: any, userId: string, storeId: string) {
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (!data) throw new Response("Loja não encontrada", { status: 403 });
}

function mapDomainStatus(cf?: string) {
  if (cf === "active") return "active";
  if (cf === "pending" || cf === "pending_validation" || cf === "pending_deployment") return "pending";
  return "error";
}
function mapSslStatus(cf?: string) {
  if (cf === "active") return "active";
  if (cf?.startsWith("pending") || cf === "initializing") return "pending";
  return "error";
}

async function cfFindHostname(hostname: string) {
  const res = await fetch(
    `${CF_BASE}/zones/${zoneId()}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
    { headers: cfHeaders() },
  );
  const json: any = await res.json();
  return json?.result?.[0] ?? null;
}

async function cfCreateHostname(hostname: string) {
  const cfRes = await fetch(`${CF_BASE}/zones/${zoneId()}/custom_hostnames`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({
      hostname,
      ssl: {
        method: "http",
        type: "dv",
        settings: { min_tls_version: "1.2", http2: "on" },
      },
    }),
  });
  const cfData: any = await cfRes.json();

  if (cfData?.success && cfData.result) return cfData.result;

  const alreadyExists = cfData?.errors?.some((e: any) => e.code === 1406);
  if (alreadyExists) {
    const existing = await cfFindHostname(hostname);
    if (existing) return existing;
  }
  const msg = cfData?.errors?.[0]?.message || "Erro ao registrar domínio no Cloudflare.";
  throw new Response(msg, { status: 400 });
}

// =================== ADD ===================
export const addCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domain: string; storeId: string }) =>
    z.object({
      domain: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, "Domínio inválido"),
      storeId: z.string().uuid(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertOwnsStore(supabase, userId, data.storeId);

    if (data.domain.endsWith("shopboxapp.com.br")) {
      throw new Response("Use o endereço padrão shopboxapp.com.br para subdomínios da ShopBox.", { status: 400 });
    }

    const result = await cfCreateHostname(data.domain);

    const hostnameId: string | undefined = result?.id;
    const ov = result?.ownership_verification;
    const sslStatus = mapSslStatus(result?.ssl?.status);
    const domainStatus = mapDomainStatus(result?.status);

    const existing = await supabase
      .from("store_domains")
      .select("id")
      .eq("store_id", data.storeId)
      .eq("domain", data.domain)
      .maybeSingle();

    const row = {
      store_id: data.storeId,
      domain: data.domain,
      cloudflare_hostname_id: hostnameId ?? null,
      ownership_verification_name: ov?.name ?? null,
      ownership_verification_value: ov?.value ?? null,
      status: domainStatus,
      ssl_status: sslStatus,
    };

    const saved = existing.data
      ? await supabase.from("store_domains").update(row).eq("id", existing.data.id).select("id").maybeSingle()
      : await supabase.from("store_domains").insert(row).select("id").maybeSingle();

    if (saved.error || !saved.data) {
      throw new Response(
        saved.error?.message || "Não foi possível salvar o domínio na sua loja.",
        { status: 400 },
      );
    }

    return {
      success: true,
      hostname_id: hostnameId,
      instructions: {
        cname: {
          type: "CNAME",
          name: data.domain,
          value: FALLBACK_ORIGIN,
          description: "Aponte seu domínio para a ShopBox",
        },
        ownership: ov
          ? {
              type: ov.type ?? "TXT",
              name: ov.name,
              value: ov.value,
              description: "Registro de verificação de propriedade",
            }
          : null,
      },
    };
  });


// =================== CHECK ===================
export const checkDomainStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeDomainId: string }) =>
    z.object({ storeDomainId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: domain } = await supabase
      .from("store_domains")
      .select("id, store_id, domain, cloudflare_hostname_id")
      .eq("id", data.storeDomainId)
      .maybeSingle();
    if (!domain) throw new Response("Domínio não encontrado", { status: 404 });
    await assertOwnsStore(supabase, userId, domain.store_id);

    let result: any = null;
    let hostnameId: string | null = domain.cloudflare_hostname_id ?? null;

    if (hostnameId) {
      const cfRes = await fetch(
        `${CF_BASE}/zones/${zoneId()}/custom_hostnames/${hostnameId}`,
        { headers: cfHeaders() },
      );
      const cfData: any = await cfRes.json();
      result = cfData?.success ? cfData.result : null;

      const missing =
        !cfData?.success &&
        (cfData?.errors?.some((e: any) => e.code === 1436 || e.code === 1437) || cfRes.status === 404);
      if (missing) {
        // Hostname sumiu do Cloudflare — recria automaticamente
        result = await cfCreateHostname(domain.domain);
        hostnameId = result?.id ?? null;
      }
    } else {
      result = await cfCreateHostname(domain.domain);
      hostnameId = result?.id ?? null;
    }

    const domainStatus = mapDomainStatus(result?.status);
    const sslStatus = mapSslStatus(result?.ssl?.status);
    const ov = result?.ownership_verification;

    await supabase
      .from("store_domains")
      .update({
        status: domainStatus,
        ssl_status: sslStatus,
        cloudflare_hostname_id: hostnameId,
        ownership_verification_name: ov?.name ?? null,
        ownership_verification_value: ov?.value ?? null,
      })
      .eq("id", domain.id);

    return {
      domain_status: domainStatus,
      ssl_status: sslStatus,
      cf_status: result?.status ?? null,
      cf_ssl_status: result?.ssl?.status ?? null,
      recreated: hostnameId !== (domain.cloudflare_hostname_id ?? null),
    };

  });

// =================== REMOVE ===================
export const removeCustomDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeDomainId: string }) =>
    z.object({ storeDomainId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: domain } = await supabase
      .from("store_domains")
      .select("id, store_id, cloudflare_hostname_id")
      .eq("id", data.storeDomainId)
      .maybeSingle();
    if (!domain) throw new Response("Domínio não encontrado", { status: 404 });
    await assertOwnsStore(supabase, userId, domain.store_id);

    if (domain.cloudflare_hostname_id) {
      await fetch(
        `${CF_BASE}/zones/${zoneId()}/custom_hostnames/${domain.cloudflare_hostname_id}`,
        { method: "DELETE", headers: cfHeaders() },
      ).catch(() => null);
    }

    const del = await supabase
      .from("store_domains")
      .delete()
      .eq("id", domain.id)
      .select("id");
    if (del.error || !del.data?.length) {
      throw new Response(del.error?.message || "Não foi possível remover o domínio.", { status: 400 });
    }
    return { success: true };
  });

// =================== RESOLVE (public) ===================
// Resolves a hostname to a store slug (for custom-domain storefront routing).
// Uses RLS-anonymous read of store_domains where status='active'.
export const resolveDomainSlug = createServerFn({ method: "POST" })
  .inputValidator((input: { hostname: string }) =>
    z.object({ hostname: z.string().trim().toLowerCase().min(3).max(253) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const host = data.hostname.replace(/\.$/, "");
    const candidates = Array.from(
      new Set([host, host.startsWith("www.") ? host.slice(4) : `www.${host}`]),
    );

    const { data: rows } = await supabaseAdmin
      .from("store_domains")
      .select("domain, status, store_id, stores:store_id(slug, active)")
      .in("domain", candidates)
      .in("status", ["active", "pending"]);

    // Prefer an exact match, then the apex/www sibling.
    const rec =
      rows?.find((r: any) => r.domain === host) ?? rows?.[0] ?? null;
    const stores: any = (rec as any)?.stores;
    if (!rec || !stores?.active) return { slug: null as string | null };
    return { slug: stores.slug as string };
  });

// =================== RESOLVE CURRENT HOST (SSR) ===================
// Reads the incoming request Host header on the server and resolves it to a
// store slug. Used by the landing route to redirect custom domains during SSR.
export const resolveCurrentHostSlug = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    const headers: any = getRequestHeaders();
    const raw =
      (typeof headers?.get === "function"
        ? headers.get("x-forwarded-host") || headers.get("host")
        : headers?.["x-forwarded-host"] || headers?.host) || "";
    const host = String(raw).split(",")[0].trim().toLowerCase().split(":")[0].replace(/\.$/, "");
    if (!host) return { host: "", slug: null as string | null };

   const isShopBox =
  host === "localhost" ||
  host.startsWith("127.") ||
  host.endsWith(".lovable.app") ||
  host.endsWith(".lovable.dev") ||
  host.endsWith(".vercel.app") ||
  host.endsWith("shopboxapp.com.br");
if (isShopBox) return { host, slug: null as string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wwwHost = "www." + host;
const bareHost = host.startsWith("www.") ? host.slice(4) : host;
const candidates = Array.from(new Set([host, wwwHost, bareHost]));
    const { data: rows } = await supabaseAdmin
      .from("store_domains")
      .select("domain, status, store_id, stores:store_id(slug, active)")
      .in("domain", candidates)
      .in("status", ["active", "pending"]);
    const rec = rows?.find((r: any) => r.domain === host) ?? rows?.[0] ?? null;
    const stores: any = (rec as any)?.stores;
    if (!rec || !stores?.active) return { host, slug: null as string | null };
    return { host, slug: stores.slug as string };
  },
);
