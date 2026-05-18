// Marketing pixel + GA4 helpers (storefront-only, browser-safe).
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

export function initPixel(pixelId: string | null | undefined) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.__sb_pixel_inited === pixelId) return;
  window.__sb_pixel_inited = pixelId;

  // Standard Meta Pixel base code
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
    s.parentNode.insertBefore(t, s);
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

function fbq(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch {}
}

function gtag(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", event, params);
  } catch {}
}

export function trackPageView() {
  fbq("PageView");
}

export function trackViewContent(p: { id: string; title: string; value: number }) {
  fbq("ViewContent", {
    content_ids: [p.id],
    content_name: p.title,
    content_type: "product",
    value: p.value,
    currency: "BRL",
  });
  gtag("view_item", {
    currency: "BRL",
    value: p.value,
    items: [{ item_id: p.id, item_name: p.title, price: p.value }],
  });
}

export function trackViewCategory(name: string) {
  fbq("ViewContent", { content_name: name, content_type: "product_group" });
  gtag("view_item_list", { item_list_name: name });
}

export function trackAddToCart(p: { id: string; title: string; value: number; quantity: number }) {
  fbq("AddToCart", {
    content_ids: [p.id],
    content_name: p.title,
    content_type: "product",
    value: p.value * p.quantity,
    currency: "BRL",
    num_items: p.quantity,
  });
  gtag("add_to_cart", {
    currency: "BRL",
    value: p.value * p.quantity,
    items: [{ item_id: p.id, item_name: p.title, price: p.value, quantity: p.quantity }],
  });
}

export function trackInitiateCheckout(p: { ids: string[]; numItems: number; value: number }) {
  fbq("InitiateCheckout", {
    content_ids: p.ids,
    num_items: p.numItems,
    value: p.value,
    currency: "BRL",
  });
  gtag("begin_checkout", {
    currency: "BRL",
    value: p.value,
    items: p.ids.map((id) => ({ item_id: id })),
  });
}

export function trackSearch(term: string) {
  fbq("Search", { search_string: term, content_type: "product" });
  gtag("search", { search_term: term });
}
