import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { themeId, storeId, returnUrl, environment } = await req.json();
    if (!themeId || !storeId) {
      return new Response(JSON.stringify({ error: "Missing themeId or storeId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller owns the store
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: store } = await supabase.from("stores").select("id, owner_user_id, name").eq("id", storeId).maybeSingle();
    if (!store || store.owner_user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: theme } = await supabase.from("themes").select("id, name, price_cents, is_free, partner_id").eq("id", themeId).eq("status", "approved").maybeSingle();
    if (!theme) {
      return new Response(JSON.stringify({ error: "Theme not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free theme: instant unlock, no Stripe
    if (theme.is_free || theme.price_cents === 0) {
      await supabase.from("theme_purchases").upsert({
        store_id: storeId, theme_id: themeId, price_cents: 0, status: "completed",
      }, { onConflict: "store_id,theme_id" });
      return new Response(JSON.stringify({ free: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: { name: `Tema ${theme.name}` },
          unit_amount: theme.price_cents,
        },
        quantity: 1,
      }],
      mode: "payment",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: userData.user.email,
      metadata: {
        kind: "theme_purchase",
        themeId: theme.id,
        storeId,
        userId: userData.user.id,
        partnerId: theme.partner_id ?? "",
      },
    });

    // Pre-create a pending purchase row
    await supabase.from("theme_purchases").upsert({
      store_id: storeId,
      theme_id: themeId,
      price_cents: theme.price_cents,
      stripe_session_id: session.id,
      partner_id: theme.partner_id,
      status: "pending",
    }, { onConflict: "store_id,theme_id" });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
