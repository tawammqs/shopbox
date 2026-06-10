import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hook route triggered hourly by pg_cron. Sends a recovery email to lojistas
// who started signup but have an `incomplete` subscription_status for more
// than 2 hours and less than 23 hours (before the cleanup-orphan-stores cron
// kicks in at 24h). Idempotent: uses email_send_log to avoid duplicates.
// Auth: Bearer <anon-key>.
export const Route = createFileRoute("/hooks/cart-recovery")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "").trim();
        const expected = process.env.CRON_SECRET;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!expected || !token || token !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!serviceKey) {
          return new Response(
            JSON.stringify({ error: "Server configuration error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const now = Date.now();
        const lowerCutoff = new Date(now - 23 * 60 * 60 * 1000).toISOString();
        const upperCutoff = new Date(now - 2 * 60 * 60 * 1000).toISOString();

        // Find candidate stores: incomplete checkout, signed up 2-23h ago.
        const { data: stores, error: storesErr } = await supabaseAdmin
          .from("stores")
          .select("id, name, owner_user_id, created_at, subscription_status")
          .eq("subscription_status", "incomplete")
          .gte("created_at", lowerCutoff)
          .lte("created_at", upperCutoff);

        if (storesErr) {
          console.error("[cart-recovery] stores error:", storesErr);
          return new Response(
            JSON.stringify({ success: false, error: storesErr.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const candidates = stores ?? [];
        if (candidates.length === 0) {
          return new Response(
            JSON.stringify({ success: true, sent: 0, skipped: 0 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // Resolve owner emails via secure RPC.
        const ownerIds = candidates.map((s) => s.owner_user_id);
        const { data: users, error: usersErr } = await supabaseAdmin.rpc(
          "admin_list_users",
          { _user_ids: ownerIds },
        );

        if (usersErr) {
          console.error("[cart-recovery] users error:", usersErr);
          return new Response(
            JSON.stringify({ success: false, error: usersErr.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const emailById = new Map((users ?? []).map((u: any) => [u.id, u.email]));

        // Build site origin for the internal call.
        const origin = new URL(request.url).origin;
        const sendUrl = `${origin}/lovable/email/transactional/send-internal`;

        let sent = 0;
        let skipped = 0;

        for (const store of candidates) {
          const email = emailById.get(store.owner_user_id);
          if (!email) {
            skipped++;
            continue;
          }

          // Idempotency: check if we've already sent cart-recovery for this store.
          const tag = `cart-recovery:${store.id}`;
          const { data: existing } = await supabaseAdmin
            .from("email_send_log")
            .select("id")
            .eq("template_name", "cart-recovery")
            .eq("error_message", tag)
            .limit(1);

          if (existing && existing.length > 0) {
            skipped++;
            continue;
          }

          // Mark as in-flight via a sentinel log row to make this safe across
          // overlapping cron invocations.
          await supabaseAdmin.from("email_send_log").insert({
            message_id: crypto.randomUUID(),
            template_name: "cart-recovery",
            recipient_email: email,
            status: "pending",
            error_message: tag,
          });

          try {
            const res = await fetch(sendUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                templateName: "cart-recovery",
                recipientEmail: email,
                idempotencyKey: `cart-recovery-${store.id}`,
                templateData: {
                  storeName: store.name,
                  checkoutUrl: `${origin}/cadastro`,
                },
              }),
            });
            if (res.ok) {
              sent++;
            } else {
              skipped++;
              console.error("[cart-recovery] send failed", store.id, res.status);
            }
          } catch (err) {
            skipped++;
            console.error("[cart-recovery] send error", store.id, err);
          }
        }

        console.log(`[cart-recovery] sent=${sent} skipped=${skipped} candidates=${candidates.length}`);

        return new Response(
          JSON.stringify({ success: true, sent, skipped, candidates: candidates.length }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
