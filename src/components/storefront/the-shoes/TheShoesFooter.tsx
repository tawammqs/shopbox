import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront } from "../StoreContext";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";

export function TheShoesFooter() {
  const { store } = useStorefront();
  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
  });
  const s = settingsQ.data;
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

  const marqueeText = s?.footer_marquee_text || "The Shoes · Os tênis mais desejados · ";
  const links = s?.footer_links?.length ? s.footer_links : [
    { label: "Quem somos", url: "/sobre" },
    { label: "Políticas de troca", url: "/politicas" },
    { label: "Contato", url: "/contato" },
    { label: "WhatsApp", url: `https://wa.me/${store.whatsapp}` },
  ];
  const about = s?.footer_about || "A loja com os tênis mais desejados na internet.";

  return (
    <footer className="ts-footer" style={{ background: "#d9f523" }}>
      <div className="ts-footer-marquee">
        <div className="ts-footer-marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>{marqueeText}</span>
          ))}
        </div>
      </div>
      <div className="ts-footer-inner">
        <div className="ts-footer-grid">
          <div>
            <h4 className="ts-footer-title">Links úteis</h4>
            <ul className="flex flex-col gap-3">
              {links.map((l, i) => (
                <li key={i}>
                  <a href={l.url} className="ts-footer-link">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="ts-footer-title">Sobre a {store.name}</h4>
            <p className="ts-footer-text">{about}</p>
          </div>
          <div>
            <h4 className="ts-footer-news-title">Só novidades, sem spam :)</h4>
            <form onSubmit={submit} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="ts-footer-input"
              />
              <button type="submit" disabled={saving} aria-label="Inscrever"
                className="ts-footer-submit">
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
        <div className="ts-footer-bottom">
          © 2026, {store.name} | Os tênis mais desejados da internet. Site feito com a{" "}
          <a href="https://shopboxapp.com.br" target="_blank" rel="noreferrer"
            style={{ color: "#111", fontWeight: 700, textDecoration: "underline" }}>
            ShopBox
          </a>{" "}
          - Seu e-commerce nativo para WhatsApp.
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
