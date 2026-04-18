// Anonymous visitor identifier persisted in localStorage.
// Used for wishlist and any other anonymous personalization.

const KEY = "shopbox_visitor_id";

function rand(): string {
  // 24 chars, url-safe
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  let id = window.localStorage.getItem(KEY);
  if (!id || id.length < 8) {
    id = rand();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
