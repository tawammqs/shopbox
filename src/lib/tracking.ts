// Unified marketing tracking: browser Meta Pixel + server-side Conversions API
// + GA4. All trackers are deduplicated by event_id so the browser Pixel and
// CAPI events match in Meta's Event Manager.
import { sendMetaCapiEvent } from "./meta-capi.functions";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __sb_pixel_inited?: string;
    __sb_ga_inited?: string;
  }
}

// ---------------------------------------------------------------------------
// Init helpers
// ---------------------------------------------------------------------------

export function initPixel(pixelId: string | null | undefined) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.__sb_pixel_inited === pixelId) return;
  window.__sb_pixel_inited = pixelId;

  (function (f: any, b: any, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    if (s?.parentNode) s.parentNode.insertBefore(t, s);
    else (b.head || b.body || b.documentElement).appendChild(t);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq!("init", pixelId);
  window.fbq!("track", "PageView");
}

export function initGA(measurementId: string | null | undefined) {
  if (typeof window === "undefined" || !measurementId) return;
  if (window.__sb_ga_inited === measurementId) return;
  window.__sb_ga_inited = measurementId;

  const s = document.createElement("script");
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  s.async = true;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fbq(event: string, params?: Record<string, any>, options?: { eventID: string }) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    if (options) window.fbq("track", event, params, options);
    else window.fbq("track", event, params);
  } catch {}
}

function gtag(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", event, params);
  } catch {}
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

// Stable, URL-safe base64 (browser btoa keeps + / =)
function b64(s: string): string {
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(s)));
  // Fallback (SSR) — sufficient as id generator
  let out = "";
  for (let i = 0; i < s.length; i++) out += s.charCodeAt(i).toString(36);
  return out;
}

function generateEventId(eventName: string, data: object): string {
  const key = `${eventName}_${JSON.stringify(data)}`;
  return b64(key).slice(0, 32).replace(/[^a-zA-Z0-9]/g, "");
}

// In-memory dedup of fired events. Cleared on SPA route change via
// clearEventCache() so the same product can re-track on a new page view.
const firedEvents = new Set<string>();

export function clearEventCache() {
  firedEvents.clear();
}

type StoreLike = { id: string; facebook_pixel_id?: string | null };

async function fireCapi(
  store: StoreLike,
  eventName: string,
  eventId: string,
  payload: {
    value?: number;
    content_ids?: string[];
    content_name?: string;
    num_items?: number;
  },
) {
  if (!store?.facebook_pixel_id) return;
  try {
    await sendMetaCapiEvent({
      data: {
        store_id: store.id,
        event_name: eventName,
        event_id: eventId,
        value: payload.value,
        content_ids: payload.content_ids,
        content_name: payload.content_name,
        num_items: payload.num_items,
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        event_source_url: typeof window !== "undefined" ? window.location.href : "",
      },
    });
  } catch {
    // Silent — CAPI failures must never break UX
  }
}

// ---------------------------------------------------------------------------
// Trackers
// ---------------------------------------------------------------------------

export function trackPageView() {
  fbq("PageView");
}

export function trackViewCategory(name: string) {
  fbq("ViewContent", { content_name: name, content_type: "product_group" });
  gtag("view_item_list", { item_list_name: name });
}

export function trackSearch(term: string) {
  fbq("Search", { search_string: term, content_type: "product" });
  gtag("search", { search_term: term });
}

export async function trackViewContent(
  store: StoreLike,
  product: { id: string; title: string; value: number },
) {
  const eventId = generateEventId("ViewContent", { productId: product.id });
  if (firedEvents.has(eventId)) return;
  firedEvents.add(eventId);

  fbq(
    "ViewContent",
    {
      content_ids: [product.id],
      content_name: product.title,
      content_type: "product",
      value: product.value,
      currency: "BRL",
    },
    { eventID: eventId },
  );

  gtag("view_item", {
    currency: "BRL",
    value: product.value,
    items: [{ item_id: product.id, item_name: product.title, price: product.value }],
  });

  await fireCapi(store, "ViewContent", eventId, {
    value: product.value,
    content_ids: [product.id],
    content_name: product.title,
    num_items: 1,
  });
}

export async function trackAddToCart(
  store: StoreLike,
  product: { id: string; title: string; value: number; quantity: number },
) {
  const eventId = generateEventId("AddToCart", {
    productId: product.id,
    quantity: product.quantity,
    ts: Math.floor(Date.now() / 10000), // 10s window dedup
  });
  if (firedEvents.has(eventId)) return;
  firedEvents.add(eventId);

  const value = product.value * product.quantity;

  fbq(
    "AddToCart",
    {
      content_ids: [product.id],
      content_name: product.title,
      content_type: "product",
      value,
      currency: "BRL",
      num_items: product.quantity,
    },
    { eventID: eventId },
  );

  gtag("add_to_cart", {
    currency: "BRL",
    value,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        price: product.value,
        quantity: product.quantity,
      },
    ],
  });

  await fireCapi(store, "AddToCart", eventId, {
    value,
    content_ids: [product.id],
    content_name: product.title,
    num_items: product.quantity,
  });
}

export async function trackPurchase(
  store: StoreLike,
  payload: { ids: string[]; numItems: number; value: number },
) {
  const eventId = generateEventId("Purchase", {
    items: [...payload.ids].sort().join(","),
    value: payload.value,
    ts: Math.floor(Date.now() / 30000), // 30s window dedup
  });
  if (firedEvents.has(eventId)) return;
  firedEvents.add(eventId);

  fbq(
    "Purchase",
    {
      content_ids: payload.ids,
      content_type: "product",
      value: payload.value,
      currency: "BRL",
      num_items: payload.numItems,
    },
    { eventID: eventId },
  );

  gtag("purchase", {
    currency: "BRL",
    value: payload.value,
    items: payload.ids.map((id) => ({ item_id: id })),
  });

  await fireCapi(store, "Purchase", eventId, {
    value: payload.value,
    content_ids: payload.ids,
    num_items: payload.numItems,
  });
}

export async function trackInitiateCheckout(

  store: StoreLike,
  payload: { ids: string[]; numItems: number; value: number },
) {
  const eventId = generateEventId("InitiateCheckout", {
    items: [...payload.ids].sort().join(","),
    ts: Math.floor(Date.now() / 30000), // 30s window dedup
  });
  if (firedEvents.has(eventId)) return;
  firedEvents.add(eventId);

  fbq(
    "InitiateCheckout",
    {
      content_ids: payload.ids,
      content_type: "product",
      value: payload.value,
      currency: "BRL",
      num_items: payload.numItems,
    },
    { eventID: eventId },
  );

  gtag("begin_checkout", {
    currency: "BRL",
    value: payload.value,
    items: payload.ids.map((id) => ({ item_id: id })),
  });

  // Fire CAPI then add a small delay so both Pixel + CAPI go out before the
  // caller opens the WhatsApp link in a new tab.
  await fireCapi(store, "InitiateCheckout", eventId, {
    value: payload.value,
    content_ids: payload.ids,
    num_items: payload.numItems,
  });
  await new Promise((r) => setTimeout(r, 300));
}
