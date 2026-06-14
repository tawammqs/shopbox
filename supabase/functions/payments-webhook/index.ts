import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Stripe event:", event.type, "env:", env);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        if (sub.metadata?.kind === "addon_subscription") {
          await handleAddonSubscriptionUpsert(sub);
        } else {
          await handleSubscriptionUpsert(sub, env);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        if (sub.metadata?.kind === "addon_subscription") {
          await handleAddonSubscriptionDeleted(sub);
        } else {
          await handleSubscriptionDeleted(sub, env);
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id);
        if (session.metadata?.kind === "addon_subscription") {
          await handleAddonCheckoutCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      default:
        console.log("Unhandled:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

function tsToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;

  // Newer Stripe API moved current_period_* under items.data[0]; fallback to root for compat
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const trialEnd = subscription.trial_end;

  const periodStartIso = tsToIso(periodStart);
  const periodEndIso = tsToIso(periodEnd);
  const trialEndIso = tsToIso(trialEnd);

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStartIso,
      current_period_end: periodEndIso,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Mirror to the store row so the admin app can gate access without joining
  const newStatus = mapStatus(subscription.status);
  const { data: storeBefore } = await supabase
    .from("stores")
    .select("id, name, subscription_status, plan_id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  await supabase
    .from("stores")
    .update({
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      subscription_status: newStatus,
      current_period_end: periodEndIso,
      trial_ends_at: trialEndIso,
      active: true,
    })
    .eq("owner_user_id", userId);

  // Send welcome email on first activation (status transitions to trialing/active)
  const wasActiveBefore =
    storeBefore?.subscription_status === "trialing" ||
    storeBefore?.subscription_status === "active";
  const isActiveNow = newStatus === "trialing" || newStatus === "active";

  if (isActiveNow && !wasActiveBefore && storeBefore?.id) {
    try {
      await sendWelcomeEmail(userId, storeBefore.id, storeBefore.name, storeBefore.plan_id, subscription.id);
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }
  }
}

async function sendWelcomeEmail(
  userId: string,
  storeId: string,
  storeName: string | null,
  planId: string | null,
  subscriptionId: string,
) {
  // Idempotency: only send once per subscription
  const { data: existing } = await supabase
    .from("email_send_log")
    .select("id")
    .eq("template_name", "welcome")
    .eq("error_message", `sub:${subscriptionId}`)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log("Welcome email already sent for subscription", subscriptionId);
    return;
  }

  // Look up user email
  const { data: users } = await supabase.rpc("admin_list_users", {
    _user_ids: [userId],
  });
  const userEmail = users?.[0]?.email;
  if (!userEmail) {
    console.error("No email found for user", userId);
    return;
  }

  // Look up plan name
  let planName: string | null = null;
  if (planId) {
    const { data: plan } = await supabase
      .from("plans")
      .select("name")
      .eq("id", planId)
      .maybeSingle();
    planName = plan?.name ?? null;
  }

  const appUrl = Deno.env.get("APP_PUBLIC_URL") || "https://shopbox.lovable.app";
  const sendUrl = `${appUrl}/lovable/email/transactional/send-internal`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const res = await fetch(sendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      templateName: "welcome",
      recipientEmail: userEmail,
      idempotencyKey: `welcome-${subscriptionId}`,
      subscriptionId,
      templateData: {
        name: storeName || null,
        planName,
        trialDays: 7,
        dashboardUrl: `${appUrl}/admin/dashboard`,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Welcome email send failed:", res.status, txt);
  } else {
    console.log("Welcome email queued for", userEmail);
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    await supabase
      .from("stores")
      .update({ subscription_status: "canceled" })
      .eq("owner_user_id", userId);
  }
}

function mapStatus(s: string): string {
  const valid = ["trialing", "active", "past_due", "canceled", "incomplete", "unpaid", "inactive"];
  return valid.includes(s) ? s : "inactive";
}

async function handleCheckoutCompleted(session: any) {
  const meta = session.metadata ?? {};
  if (meta.kind !== "theme_purchase") return;
  const themeId = meta.themeId;
  const storeId = meta.storeId;
  if (!themeId || !storeId) return;

  const { data: theme } = await supabase
    .from("themes")
    .select("price_cents, partner_id, theme_partners(commission_percent)")
    .eq("id", themeId)
    .maybeSingle();

  const priceCents = session.amount_total ?? theme?.price_cents ?? 0;
  const commission = (theme?.theme_partners as any)?.commission_percent ?? 0;
  const partnerEarnings = Math.round((priceCents * commission) / 100);
  const platformEarnings = priceCents - partnerEarnings;

  await supabase.from("theme_purchases").upsert(
    {
      store_id: storeId,
      theme_id: themeId,
      price_cents: priceCents,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent ?? null,
      partner_id: theme?.partner_id ?? null,
      partner_commission_percent: commission,
      partner_earnings_cents: partnerEarnings,
      platform_earnings_cents: platformEarnings,
      status: "completed",
    },
    { onConflict: "store_id,theme_id" },
  );

  await supabase.rpc("increment_theme_installs", { _theme_id: themeId });
}
