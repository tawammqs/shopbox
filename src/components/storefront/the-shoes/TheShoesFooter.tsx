import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront } from "../StoreContext";
import { useStorefrontCustomizations } from "../StorefrontCustomizer";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function TheShoesFooter() {
  const { store, menus, contactInfo, pages } = useStorefront();
  const isLegacyTheShoes = store.slug === "the-shoes";

  /** Ensure relative links always point to THIS store's pages. */
  const resolveUrl = (url: string) => {
    if (!url) return "#";
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    if (path.startsWith("/loja/")) return path;
    const seg = path.replace(/^\/+/, "").split("/")[0];
    if (!seg) return `/loja/${store.slug}`;
    if (["sobre", "rastreio", "wishlist", "busca"].includes(seg)) return `/loja/${store.slug}/${seg}`;
    if (pages.some((p) => p.slug === seg)) return `/loja/${store.slug}/pagina/${seg}`;
    return `/loja/${store.slug}${path}`;
  };


  // Legacy The Shoes: data comes from the_shoes_theme_settings.
  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
    enabled: isLegacyTheShoes,
  });
  const s = settingsQ.data;

  // Other Mio stores: read editable config from customizations.footer.
  const custQ = useStorefrontCustomizations(store.id);
  const fcfg = custQ.data?.footer ?? {};

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("newsletter_leads")
        .insert({ store_id: store.id, email: email.trim() });
      if (error) throw error;
      toast.success("Obrigado! Você receberá nossas novidades em breve 💚");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao cadastrar");
    } finally {
      setSaving(false);
    }
  };

  // Resolve content depending on legacy vs custom store.
  const marqueeText = isLegacyTheShoes
    ? (s?.footer_marquee_text || `${store.name} · `)
    : `${store.name} · `;
  const about = isLegacyTheShoes
    ? (s?.footer_about || store.tagline || "")
    : (contactInfo?.contact_text || store.tagline || "");

  // Links: legacy uses settings.footer_links; custom uses editor-picked menus (fallback to store menus).
  type Lnk = { label: string; url: string };
  const legacyLinks: Lnk[] = s?.footer_links?.length
    ? s.footer_links
    : [
        { label: "Quem somos", url: "/sobre" },
        { label: "Políticas de troca", url: "/politicas" },
        { label: "Contato", url: "/contato" },
        { label: "WhatsApp", url: buildWhatsAppUrl(store.whatsapp) },
      ];

  let customLinks: Lnk[] = [];
  if (!isLegacyTheShoes) {
    const picked: { name: string; items: { label: string; url: string | null }[] }[] = [];
    if (fcfg.primaryMenuEnabled && fcfg.primaryMenuId) {
      const m = menus.find((x) => x.id === fcfg.primaryMenuId);
      if (m) picked.push(m);
    }
    if (fcfg.secondaryMenuEnabled && fcfg.secondaryMenuId) {
      const m = menus.find((x) => x.id === fcfg.secondaryMenuId);
      if (m) picked.push(m);
    }
    const base = picked.length ? picked : menus.slice(0, 2);
    customLinks = base.flatMap((m) =>
      m.items.map((it) => ({ label: it.label, url: it.url ?? "#" })),
    );
    if (customLinks.length === 0) {
      const phone = (fcfg.showContact && fcfg.phone) || contactInfo?.phone;
      const mail = (fcfg.showContact && fcfg.email) || contactInfo?.store_email;
      customLinks = [
        { label: "Início", url: `/loja/${store.slug}` },
        { label: "WhatsApp", url: buildWhatsAppUrl(store.whatsapp) },
        ...(phone ? [{ label: phone, url: `tel:${phone}` }] : []),
        ...(mail ? [{ label: mail, url: `mailto:${mail}` }] : []),
      ];
    }
  }
  const links: Lnk[] = isLegacyTheShoes ? legacyLinks : customLinks;

  // Colors: legacy fixed lime; custom honors fcfg.useCustomColors.
  const useCustom = !isLegacyTheShoes && fcfg.useCustomColors;
  const bg = isLegacyTheShoes ? "#d9f523" : (useCustom ? (fcfg.bg || "#111111") : "#d9f523");
  const txt = isLegacyTheShoes ? "#111" : (useCustom ? (fcfg.text || "#ffffff") : "#111");
  // For light bg (legacy/lime), keep current style with dark accents; for dark custom bg, invert.
  const isDarkBg = useCustom && (fcfg.bg ?? "").toLowerCase() !== "#ffffff" && (fcfg.bg ?? "").toLowerCase() !== "#fff";

  return (
    <footer className="ts-footer" style={{ background: bg, color: txt }}>
      <div className="ts-footer-marquee">
        <div className="ts-footer-marquee-track" style={{ WebkitTextStroke: `1.5px ${isDarkBg ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}` }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>{marqueeText}</span>
          ))}
        </div>
      </div>
      <div className="ts-footer-inner">
        <div className="ts-footer-grid">
          <div>
            <h4 className="ts-footer-title" style={{ color: txt }}>Links úteis</h4>
            <ul className="flex flex-col gap-3">
              {links.map((l, i) => (
                <li key={i}>
                  <a href={resolveUrl(l.url)} className="ts-footer-link" style={{ color: txt, opacity: 0.75 }}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="ts-footer-title" style={{ color: txt }}>Sobre a {store.name}</h4>
            <p className="ts-footer-text" style={{ color: txt, opacity: 0.75 }}>{about}</p>
            {!isLegacyTheShoes && fcfg.showContact && (
              <div className="mt-3 space-y-1 text-[14px]" style={{ color: txt, opacity: 0.85 }}>
                {fcfg.phone && <p>📱 {fcfg.phone}</p>}
                {fcfg.email && <p>✉ <a href={`mailto:${fcfg.email}`} style={{ color: txt, textDecoration: "underline" }}>{fcfg.email}</a></p>}
              </div>
            )}
          </div>
          <div>
            <h4 className="ts-footer-news-title" style={{ color: txt }}>Só novidades, sem spam :)</h4>
            <form onSubmit={submit} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="ts-footer-input"
                style={isDarkBg ? { background: "rgba(255,255,255,0.1)", color: txt } : undefined}
              />
              <button type="submit" disabled={saving} aria-label="Inscrever"
                className="ts-footer-submit">
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
        <div className="ts-footer-bottom" style={{ color: txt, opacity: 0.65, borderColor: isDarkBg ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)" }}>
          © {new Date().getFullYear()}, {contactInfo?.company_name || store.name}
          {contactInfo?.tax_id ? ` — CNPJ ${contactInfo.tax_id}` : ""}
          {" "}| Site feito com a{" "}
          <a href="https://shopboxapp.com.br" target="_blank" rel="noreferrer"
            style={{ color: txt, fontWeight: 700, textDecoration: "underline" }}>
            ShopBox
          </a>.
        </div>
      </div>
      <style>{`
        .ts-footer, .ts-footer * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }
        .ts-footer-marquee {
          overflow: hidden; padding: 20px 0;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .ts-footer-marquee-track {
          display: inline-flex; white-space: nowrap;
          animation: tsFooterScroll 12s linear infinite;
          font-weight: 900; font-size: 48px; line-height: 1; letter-spacing: -2px;
          color: transparent; -webkit-text-stroke: 1.5px rgba(0,0,0,0.25);
        }
        @media (min-width: 768px) {
          .ts-footer-marquee-track { font-size: 80px; }
        }
        @keyframes tsFooterScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ts-footer-inner { padding: 48px 24px 32px; max-width: 1280px; margin: 0 auto; }
        @media (min-width: 768px) { .ts-footer-inner { padding: 48px 40px 32px; } }
        .ts-footer-grid {
          display: grid; grid-template-columns: 1fr; gap: 32px;
        }
        @media (min-width: 768px) {
          .ts-footer-grid { grid-template-columns: 1fr 1fr 1fr; gap: 48px; }
        }
        .ts-footer-title {
          font-size: 13px; font-weight: 700; color: #111;
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;
        }
        .ts-footer-link {
          font-size: 15px; color: rgba(17,17,17,0.7); text-decoration: none;
        }
        .ts-footer-link:hover { color: #111; }
        .ts-footer-text {
          font-size: 15px; color: rgba(17,17,17,0.7); line-height: 1.75;
        }
        .ts-footer-news-title {
          font-size: 22px; font-weight: 800; color: #111; margin-bottom: 16px;
        }
        .ts-footer-input {
          width: 100%; height: 52px; background: rgba(0,0,0,0.08); border: 0;
          border-radius: 8px; padding: 0 60px 0 16px; color: #111; font-size: 15px;
          outline: none;
        }
        .ts-footer-input::placeholder { color: rgba(0,0,0,0.4); }
        .ts-footer-submit {
          position: absolute; right: 6px; top: 6px;
          width: 40px; height: 40px; background: #111; color: #fff;
          border: 0; border-radius: 6px;
          display: grid; place-items: center; cursor: pointer;
        }
        .ts-footer-submit:disabled { opacity: 0.6; }
        .ts-footer-bottom {
          border-top: 1px solid rgba(0,0,0,0.12);
          padding-top: 24px; margin-top: 48px;
          text-align: center; font-size: 13px; color: rgba(17,17,17,0.6);
        }
      `}</style>
    </footer>
  );
}
