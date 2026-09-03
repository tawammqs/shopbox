import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AffiliateSession = {
  id: string;
  store_id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  affiliate_slug: string;
  commission_percent: number;
  referral_commission_percent: number;
  status: string;
  created_at: string;
  session_token: string | null;
};

export type AffiliateSale = {
  id: string;
  level: 1 | 2;
  order_total: number;
  commission_amount: number;
  commission_percent: number;
  customer_name: string | null;
  status: string;
  created_at: string;
  items: { title?: string; quantity?: number }[];
  source_name: string | null;
};

export type AffiliateDashboard = {
  affiliate: AffiliateSession;
  sales: AffiliateSale[];
  referrals: { id: string; name: string; affiliate_slug: string; created_at: string }[];
};

const SESSION_KEY = "affiliate_logged";
const REF_SLUG_KEY = "affiliate_slug";
const REF_STORE_KEY = "affiliate_store";
const EVENT = "affiliate-session-change";

/** "Tawam Marques" → "tawammarques" (mirrors the SQL affiliate_slugify). */
export const generateAffiliateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 30);

/* ---------------- Logged-in affiliate session ---------------- */

export function readAffiliateSession(): AffiliateSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AffiliateSession) : null;
  } catch {
    return null;
  }
}

export function saveAffiliateSession(a: AffiliateSession) {
  const raw = JSON.stringify(a);
  window.sessionStorage.setItem(SESSION_KEY, raw);
  window.localStorage.setItem(SESSION_KEY, raw);
  window.dispatchEvent(new Event(EVENT));
}

export function clearAffiliateSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(EVENT));
}

/** Current affiliate login, scoped to a store (null when logged into another store). */
export function useAffiliateSession(storeId?: string) {
  const [affiliate, setAffiliate] = useState<AffiliateSession | null>(null);

  useEffect(() => {
    const sync = () => {
      const a = readAffiliateSession();
      setAffiliate(a && (!storeId || a.store_id === storeId) ? a : null);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [storeId]);

  return { affiliate, isAffiliate: !!affiliate };
}

/* ---------------- Visitor referral tracking ---------------- */

export function savePendingAffiliateRef(storeSlug: string, affiliateSlug: string) {
  if (typeof window === "undefined" || !affiliateSlug) return;
  window.sessionStorage.setItem(REF_SLUG_KEY, affiliateSlug);
  window.sessionStorage.setItem(REF_STORE_KEY, storeSlug);
}

export function getPendingAffiliateRef(storeSlug: string): string | null {
  if (typeof window === "undefined") return null;
  const slug = window.sessionStorage.getItem(REF_SLUG_KEY);
  const store = window.sessionStorage.getItem(REF_STORE_KEY);
  if (!slug || store !== storeSlug) return null;
  return slug;
}

export function clearPendingAffiliateRef() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REF_SLUG_KEY);
  window.sessionStorage.removeItem(REF_STORE_KEY);
}

/* ---------------- URLs ---------------- */

const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

export const affiliateProductUrl = (storeSlug: string, productSlug: string, affiliateSlug: string) =>
  `${origin()}/loja/${storeSlug}/produto/${productSlug}/${affiliateSlug}`;

export const affiliateStoreUrl = (storeSlug: string, affiliateSlug: string) =>
  `${origin()}/loja/${storeSlug}?ref=${affiliateSlug}`;

export const affiliateRecruitUrl = (storeSlug: string, affiliateSlug: string) =>
  `${origin()}/loja/${storeSlug}/afiliados/cadastro?ref=${affiliateSlug}`;

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

/* ---------------- RPC wrappers ---------------- */

export async function registerAffiliate(input: {
  storeId: string;
  name: string;
  email: string;
  whatsapp: string;
  password: string;
  referredBySlug?: string | null;
}) {
  const { data, error } = await supabase.rpc("register_affiliate", {
    _store_id: input.storeId,
    _name: input.name,
    _email: input.email,
    _whatsapp: input.whatsapp,
    _password: input.password,
    _referred_by_slug: input.referredBySlug ?? undefined,
  });
  if (error) throw new Error(error.message);
  return data as unknown as AffiliateSession;
}

export async function loginAffiliate(storeId: string, email: string, password: string) {
  const { data, error } = await supabase.rpc("affiliate_login", {
    _store_id: storeId,
    _email: email,
    _password: password,
  });
  if (error) throw new Error(error.message);
  const res = data as unknown as AffiliateSession | { error: string } | null;
  if (!res) return { error: "email_not_found" as const };
  if ("error" in res) return { error: res.error as "email_not_found" | "invalid_password" };
  return { affiliate: res };
}

export async function fetchAffiliateDashboard(token: string) {
  const { data, error } = await supabase.rpc("affiliate_dashboard", { _token: token });
  if (error) throw new Error(error.message);
  return (data as unknown as AffiliateDashboard | null) ?? null;
}

export async function fetchAffiliateName(storeId: string, slug: string) {
  const { data } = await supabase.rpc("affiliate_name_by_slug", { _store_id: storeId, _slug: slug });
  return (data as string | null) ?? null;
}

/** Records the sale + commissions. Returns the affiliate name for the WhatsApp message (or null). */
export async function registerAffiliateSale(input: {
  storeId: string;
  affiliateSlug: string;
  orderId: string | null;
  orderTotal: number;
  customerName: string;
  items: unknown[];
}) {
  const { data, error } = await supabase.rpc("register_affiliate_sale", {
    _store_id: input.storeId,
    _affiliate_slug: input.affiliateSlug,
    _order_id: input.orderId as string,
    _order_total: input.orderTotal,
    _customer_name: input.customerName,
    _items: input.items as any,
  });
  if (error) return null;
  const res = data as unknown as { name: string; affiliate_slug: string } | null;
  return res?.name ?? null;
}

// ── Página pública do programa ────────────────────────────────────────────
export type AffiliatePageStep = { number: string; title: string; text: string };
export type AffiliatePageContent = {
  title: string;
  subtitle: string;
  description: string;
  steps: AffiliatePageStep[];
  benefits: string[];
  rules: string[];
  payment_text: string;
  cta_button: string;
};

export const DEFAULT_AFFILIATE_PAGE_CONTENT: AffiliatePageContent = {
  title: "Programa de Afiliados",
  subtitle: "Ganhe comissão indicando nossos produtos",
  description:
    "Cadastre-se como afiliado e ganhe comissão por cada venda que você indicar divulgando nossos produtos para amigos e seguidores.",
  steps: [
    { number: "1", title: "Cadastre-se", text: "Preencha o formulário com seus dados. O acesso é liberado na hora, sem aprovação." },
    {
      number: "2",
      title: "Faça login e compartilhe",
      text: "Acesse sua conta, navegue pelos produtos e clique em Compartilhar para gerar seu link personalizado. Cada link é único e rastreia suas vendas automaticamente.",
    },
    {
      number: "3",
      title: "Ganhe comissão",
      text: "A cada venda realizada pelo seu link, você ganha comissão sobre o valor total. Se você indicar outros afiliados, ganha comissão sobre as vendas deles também.",
    },
  ],
  benefits: ["Link personalizado com seu nome", "Painel completo com suas vendas e comissões em tempo real", "Pagamento via PIX"],
  rules: [
    "É proibido divulgar seu link em comentários de publicações da loja",
    "É proibido enviar seu link por mensagem privada para clientes da loja",
    "Comportamentos fraudulentos ou inadequados resultam no cancelamento imediato do cadastro",
  ],
  payment_text: "As comissões são pagas via PIX. Certifique-se de cadastrar sua chave PIX corretamente.",
  cta_button: "Quero ser afiliado",
};

export function normalizeAffiliatePageContent(raw: unknown): AffiliatePageContent {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof AffiliatePageContent, unknown>>;
  const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
  const strList = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : fallback;
  const steps = Array.isArray(r.steps)
    ? (r.steps as any[]).map((s, i) => ({
        number: str(s?.number, String(i + 1)),
        title: str(s?.title, ""),
        text: str(s?.text, ""),
      }))
    : DEFAULT_AFFILIATE_PAGE_CONTENT.steps;
  return {
    title: str(r.title, DEFAULT_AFFILIATE_PAGE_CONTENT.title),
    subtitle: str(r.subtitle, DEFAULT_AFFILIATE_PAGE_CONTENT.subtitle),
    description: str(r.description, DEFAULT_AFFILIATE_PAGE_CONTENT.description),
    steps,
    benefits: strList(r.benefits, DEFAULT_AFFILIATE_PAGE_CONTENT.benefits),
    rules: strList(r.rules, DEFAULT_AFFILIATE_PAGE_CONTENT.rules),
    payment_text: str(r.payment_text, DEFAULT_AFFILIATE_PAGE_CONTENT.payment_text),
    cta_button: str(r.cta_button, DEFAULT_AFFILIATE_PAGE_CONTENT.cta_button),
  };
}
