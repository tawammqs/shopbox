import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Verifica se o caller é platform_admin. Lança Response 403 se não for.
async function assertSuperadmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "platform_admin")
    .maybeSingle();
  if (error) throw new Response("Erro ao verificar permissão", { status: 500 });
  if (!data) throw new Response("Acesso restrito a superadmins", { status: 403 });
}

// ---------- Busca unificada de clientes ----------
export type SuperadminClient = {
  user_id: string;
  email: string;
  whatsapp: string | null;
  created_at: string;
  stores: Array<{
    id: string;
    name: string;
    slug: string;
    active: boolean;
    subscription_status: string;
    whatsapp: string;
    created_at: string;
  }>;
};

export const searchClients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query?: string }) =>
    z.object({ query: z.string().max(200).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<SuperadminClient[]> => {
    await assertSuperadmin(context.userId);

    const { data: stores, error: sErr } = await supabaseAdmin
      .from("stores")
      .select("id, name, slug, active, subscription_status, created_at, owner_user_id, whatsapp")
      .order("created_at", { ascending: false });
    if (sErr) throw new Response(sErr.message, { status: 500 });

    const byOwner = new Map<string, SuperadminClient["stores"]>();
    (stores ?? []).forEach((s) => {
      const arr = byOwner.get(s.owner_user_id) ?? [];
      arr.push({
        id: s.id,
        name: s.name,
        slug: s.slug,
        active: s.active,
        subscription_status: s.subscription_status,
        whatsapp: s.whatsapp ?? "",
        created_at: s.created_at,
      });
      byOwner.set(s.owner_user_id, arr);
    });

    const ownerIds = Array.from(byOwner.keys());
    const usersById = new Map<string, { email: string; created_at: string }>();

    // listUsers tem paginação; para escalar pegamos em lotes de 1000
    let page = 1;
    while (true) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) throw new Response(error.message, { status: 500 });
      list.users.forEach((u) => {
        usersById.set(u.id, {
          email: u.email ?? "(sem e-mail)",
          created_at: u.created_at,
        });
      });
      if (list.users.length < 1000) break;
      page += 1;
      if (page > 20) break; // hard cap
    }

    const all: SuperadminClient[] = ownerIds.map((uid) => {
      const u = usersById.get(uid);
      const ownerStores = byOwner.get(uid) ?? [];
      const primaryWhats = ownerStores.find((s) => s.whatsapp)?.whatsapp ?? null;
      return {
        user_id: uid,
        email: u?.email ?? "(e-mail indisponível)",
        whatsapp: primaryWhats,
        created_at: u?.created_at ?? ownerStores[0]?.created_at ?? new Date().toISOString(),
        stores: ownerStores,
      };
    });

    const q = (data.query ?? "").trim().toLowerCase();
    if (!q) return all;
    const qDigits = q.replace(/\D/g, "");

    return all.filter((c) => {
      if (c.email.toLowerCase().includes(q)) return true;
      if (c.user_id.toLowerCase().includes(q)) return true;
      if (
        qDigits.length >= 4 &&
        (c.whatsapp ?? "").replace(/\D/g, "").includes(qDigits)
      )
        return true;
      return c.stores.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (qDigits.length >= 4 &&
            (s.whatsapp ?? "").replace(/\D/g, "").includes(qDigits)),
      );
    });
  });

// ---------- Enviar e-mail de redefinição de senha ----------
export const sendPasswordResetForUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; redirect_to?: string }) =>
    z
      .object({
        user_id: z.string().uuid(),
        redirect_to: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.userId);

    const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      data.user_id,
    );
    if (uErr || !userResp?.user?.email) {
      throw new Response("Usuário não encontrado", { status: 404 });
    }
    const email = userResp.user.email;

    const { data: linkResp, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: data.redirect_to ? { redirectTo: data.redirect_to } : undefined,
    });
    if (lErr) throw new Response(lErr.message, { status: 500 });

    return {
      email,
      action_link: linkResp.properties?.action_link ?? null,
    };
  });

// ---------- Impersonate (magic link de admin) ----------
export const impersonateStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { store_id: string; reason?: string; redirect_to?: string }) =>
    z
      .object({
        store_id: z.string().uuid(),
        reason: z.string().max(500).optional(),
        redirect_to: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.userId);

    const { data: store, error: sErr } = await supabaseAdmin
      .from("stores")
      .select("id, name, owner_user_id")
      .eq("id", data.store_id)
      .maybeSingle();
    if (sErr || !store) throw new Response("Loja não encontrada", { status: 404 });

    const { data: userResp, error: uErr } = await supabaseAdmin.auth.admin.getUserById(
      store.owner_user_id,
    );
    if (uErr || !userResp?.user?.email) {
      throw new Response("Dono da loja sem e-mail cadastrado", { status: 400 });
    }
    const email = userResp.user.email;

    const { data: linkResp, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: data.redirect_to ? { redirectTo: data.redirect_to } : undefined,
    });
    if (lErr) throw new Response(lErr.message, { status: 500 });

    // Log de auditoria
    await supabaseAdmin.from("impersonation_log").insert({
      admin_user_id: context.userId,
      target_user_id: store.owner_user_id,
      target_store_id: store.id,
      reason: data.reason ?? null,
      action: "magic_link",
    });

    return {
      email,
      store_name: store.name,
      action_link: linkResp.properties?.action_link ?? null,
    };
  });
