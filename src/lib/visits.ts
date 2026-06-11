import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "sb_visit_session";
const DEDUPE_PREFIX = "sb_visit_seen:";
const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes per path

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
  return "desktop";
}

function shouldLog(path: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = DEDUPE_PREFIX + path;
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < DEDUPE_WINDOW_MS) return false;
    sessionStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

export async function trackStoreVisit(opts: { storeId: string; path: string; productId?: string | null }) {
  if (typeof window === "undefined") return;
  if (!opts.storeId || !opts.path) return;
  if (!shouldLog(`${opts.storeId}:${opts.path}`)) return;

  const payload = {
    store_id: opts.storeId,
    path: opts.path.slice(0, 500),
    product_id: opts.productId ?? null,
    session_id: getSessionId(),
    device: detectDevice(),
    referrer: (document.referrer || "").slice(0, 500) || null,
  };

  try {
    await supabase.from("store_visits").insert(payload);
  } catch {
    // silent — visits must never break the storefront
  }
}
