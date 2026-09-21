import { createServerFn } from "@tanstack/react-start";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

// Public checkout for the "Loja Pronta" landing plans. Redirect-based Stripe
// Checkout in subscription mode. Price IDs are the live Stripe price IDs
// configured on the landing page.
export const createLojaProntaCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: { priceId: string; successUrl?: string; cancelUrl?: string }) => data)
  .handler(async ({ data }) => {
    const priceId = data?.priceId;
    if (!priceId || !/^price_[a-zA-Z0-9]+$/.test(priceId)) {
      throw new Error("Invalid priceId");
    }

    const connectionApiKey = process.env["STRIPE_LIVE_API_KEY"];
    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    if (!connectionApiKey || !lovableApiKey) {
      throw new Error("Payments not configured");
    }

    const origin =
      typeof data.successUrl === "string" && data.successUrl.startsWith("http")
        ? new URL(data.successUrl).origin
        : "https://www.shopboxapp.com.br";
    const successUrl =
      typeof data.successUrl === "string" && data.successUrl.startsWith("http")
        ? data.successUrl
        : `${origin}/loja-pronta/sucesso`;
    const cancelUrl =
      typeof data.cancelUrl === "string" && data.cancelUrl.startsWith("http")
        ? data.cancelUrl
        : `${origin}/#precos`;

    const body = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    const res = await fetch(`${GATEWAY_STRIPE_BASE}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connectionApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Connection-Api-Key": connectionApiKey,
        "Lovable-API-Key": lovableApiKey,
      },
      body: body.toString(),
    });

    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      throw new Error(json.error?.message || "Failed to create checkout session");
    }
    return { url: json.url };
  });
