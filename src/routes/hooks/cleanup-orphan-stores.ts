import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hook route that deletes incomplete stores older than 24h that never finished checkout.
// Triggered by pg_cron every hour. Auth: Bearer <anon-key>.
export const Route = createFileRoute("/hooks/cleanup-orphan-stores")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "").trim();
        const expected = process.env.CRON_SECRET;

        if (!expected || !token || token !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabaseAdmin
          .from("stores")
          .delete()
          .eq("subscription_status", "incomplete")
          .is("stripe_subscription_id", null)
          .lt("created_at", cutoffIso)
          .select("id");

        if (error) {
          console.error("[cleanup-orphan-stores] error:", error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const deleted = data?.length ?? 0;
        console.log(`[cleanup-orphan-stores] deleted ${deleted} orphan stores`);

        return new Response(
          JSON.stringify({ success: true, deleted }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
