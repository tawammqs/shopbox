// Edge function: creates a Stripe Checkout (subscription mode) for a marketing add-on.
// Called from the admin AddonPaywall via supabase.functions.invoke.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Human-readable price IDs (Stripe lookup_keys) created via the payments tool.
// Resolved server-side via stripe.prices.list({ lookup_keys }).
function lookupKeyFor(addonKey: string, planTier: string | null): string | null {
  const tier = planTier || "default";
  const map: Record<string, string> = {
    "video_commerce:iniciante": "addon_video_iniciante",
    "video_commerce:essencial": "addon_video_essencial",
    "video_commerce:profissional": "addon_video_profissional",
    "video_commerce:escala": "addon_video_escala",
    "grupo_vip:default": "addon_grupo_vip",
    "captura_leads:default": "addon_captura_leads",
    "compre_junto:default": "addon_compre_junto",
    "perguntas_avaliacoes:default": "addon_perguntas_avaliacoes",
  };
  return map[`${addonKey}:${tier}`] || null;
}

const ADDON_URL_SLUG: Record<string, string> = {
  video_commerce: "video-commerce",
  grupo_vip: "grupo-vip",
  captura_leads: "captura-leads",
  compre_junto: "compre-junto",
  perguntas_avaliacoes: "perguntas-avaliacoes",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Não autenticado");
    const user = userData.user;

    const { store_id, addon_key, plan_tier, env: envRaw } = await req.json();
    if (!store_id || !addon_key) throw new Error("store_id e addon_key são obrigatórios");

    // Verify caller owns the store
    const { data: store } = await supabase
      .from("stores")
      .select("id, owner_user_id, name")
      .eq("id", store_id)
      .maybeSingle();
    if (!store || store.owner_user_id !== user.id) throw new Error("Loja não encontrada");

    const env: StripeEnv = envRaw === "live" ? "live" : "sandbox";
    const lookupKey = lookupKeyFor(addon_key, plan_tier);
    if (!lookupKey) {
      return new Response(
        JSON.stringify({ error: "Add-on/plano inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const appUrl = Deno.env.get("APP_PUBLIC_URL") || "https://shopbox.lovable.app";
    const slug = ADDON_URL_SLUG[addon_key] || addon_key.replace(/_/g, "-");

    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    if (!prices.data.length) {
      return new Response(
        JSON.stringify({ error: `Preço não encontrado no Stripe (${lookupKey}).` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const stripePrice = prices.data[0];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      success_url: `${appUrl}/admin/marketing/${slug}?addon_success=true`,
      cancel_url: `${appUrl}/admin/marketing/${slug}`,
      customer_email: user.email ?? undefined,
      subscription_data: {
        metadata: {
          kind: "addon_subscription",
          store_id: store.id,
          user_id: user.id,
          addon_key,
          plan_tier: plan_tier ?? "",
        },
      },
      metadata: {
        kind: "addon_subscription",
        store_id: store.id,
        user_id: user.id,
        addon_key,
        plan_tier: plan_tier ?? "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("create-addon-checkout error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Erro ao criar checkout" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
