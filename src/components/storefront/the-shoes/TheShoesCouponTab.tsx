import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStorefront } from "../StoreContext";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUBMITTED_KEY = "the_shoes_coupon_submitted";

function formatWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.874L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.034-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106c5.421 0 9.894 4.474 9.894 9.894 0 5.421-4.473 9.894-9.894 9.894z"/>
    </svg>
  );
}

export function TheShoesCouponTab() {
  const { store } = useStorefront();
  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
  });
  const cfg = settingsQ.data?.coupon_popup;

  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthday, setBirthday] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SUBMITTED_KEY) === store.id) setRevealed(true);
  }, [store.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!cfg || !cfg.enabled) return null;

  const close = () => setOpen(false);

  const validate = (): boolean => {
    const e: Record<string, boolean> = {};
    if (name.trim().length < 2) e.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = true;
    if (whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = true;
    if (!agreed) e.agreed = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("coupon_leads" as any).insert({
        store_id: store.id,
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        birthday: birthday.trim() || null,
        coupon_code: cfg.coupon_code,
        source: "floating_tab",
      });
      if (error) throw error;
      localStorage.setItem(SUBMITTED_KEY, store.id);
      setRevealed(true);
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(cfg.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const openVipGroup = () => window.open(cfg.whatsapp_group_url, "_blank", "noopener,noreferrer");

  const dmSans = "'DM Sans', 'Helvetica Neue', -apple-system, sans-serif";

  const inputBase: React.CSSProperties = {
    width: "100%", height: 48, borderRadius: 4, padding: "0 16px",
    fontFamily: dmSans, fontSize: 15, fontWeight: 400, color: "#111",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cupom de boas-vindas"
        onClick={() => setOpen(true)}
        className="ts-coupon-tab"
        style={{ background: cfg.tab_bg_color }}
      >
        {cfg.tab_text}
      </button>

      <button
        type="button"
        aria-label="Cupom de boas-vindas"
        onClick={() => setOpen(true)}
        className="ts-coupon-gift"
      >
        <span className="ts-coupon-gift-ring" />
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" />
          <path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
        </svg>
      </button>


      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 1000, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 0, width: "100%", maxWidth: 340,
              overflow: "hidden", animation: "tsCouponIn 0.25s ease forwards",
              fontFamily: dmSans,
            }}
          >
            {/* Header */}
            <div style={{
              background: "#f8f7f2", padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt="The Shoes"
                  style={{
                    height: 32, width: "auto", objectFit: "contain",
                    display: "block", margin: "0 auto",
                  }}
                />
              ) : (
                <span style={{
                  color: "#111", fontWeight: 700, fontSize: 16, fontFamily: dmSans,
                }}>
                  {store.name}
                </span>
              )}
              <button
                type="button" onClick={close} aria-label="Fechar"
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  width: 28, height: 28, borderRadius: "50%",
                  border: "1.5px solid rgba(0,0,0,0.2)", background: "transparent",
                  color: "#111", fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ padding: "28px 24px" }}>
              <p style={{
                fontFamily: dmSans, fontSize: 14, fontWeight: 400,
                color: "#444", textAlign: "center", lineHeight: 1.65,
                marginBottom: 24,
              }}>
                {cfg.description}
              </p>

              {!revealed ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{
                    fontFamily: dmSans, fontSize: 13, fontWeight: 600, color: "#333",
                    display: "block",
                  }}>
                    Nome
                  </label>
                  <input
                    type="text" value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: false }); }}
                    placeholder="Seu nome completo"
                    style={{ ...inputBase, border: `1px solid ${errors.name ? "#e53935" : "#e0e0e0"}` }}
                  />
                  <label style={{
                    fontFamily: dmSans, fontSize: 13, fontWeight: 600, color: "#333",
                    display: "block", marginTop: 4,
                  }}>
                    E-mail
                  </label>
                  <input
                    type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: false }); }}
                    placeholder="seu@email.com"
                    style={{ ...inputBase, border: `1px solid ${errors.email ? "#e53935" : "#e0e0e0"}` }}
                  />
                  <label style={{
                    fontFamily: dmSans, fontSize: 13, fontWeight: 600, color: "#333",
                    display: "block", marginTop: 4,
                  }}>
                    Whatsapp
                  </label>
                  <input
                    type="tel" inputMode="numeric" value={whatsapp}
                    onChange={(e) => { setWhatsapp(formatWhatsapp(e.target.value)); if (errors.whatsapp) setErrors({ ...errors, whatsapp: false }); }}
                    placeholder="(00) 00000-0000"
                    style={{ ...inputBase, border: `1px solid ${errors.whatsapp ? "#e53935" : "#e0e0e0"}` }}
                  />
                  <label style={{
                    fontFamily: dmSans, fontSize: 13, fontWeight: 600, color: "#333",
                    display: "block", marginTop: 4,
                  }}>
                    Aniversário
                  </label>
                  <input
                    type="text" value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    placeholder="DD/MM"
                    style={{ ...inputBase, border: "1px solid #e0e0e0" }}
                  />

                  <label style={{
                    display: "flex", gap: 8, alignItems: "flex-start", marginTop: 4,
                    cursor: "pointer",
                  }}>
                    <input
                      type="checkbox" checked={agreed}
                      onChange={(e) => { setAgreed(e.target.checked); if (errors.agreed) setErrors({ ...errors, agreed: false }); }}
                      style={{
                        width: 16, height: 16, marginTop: 2,
                        border: `1px solid ${errors.agreed ? "#e53935" : "#ccc"}`,
                        borderRadius: 3, flexShrink: 0,
                      }}
                    />
                    <span style={{
                      fontFamily: dmSans, fontSize: 12, fontWeight: 400,
                      color: "#666", lineHeight: 1.45,
                    }}>
                      Concordo com a{" "}
                      <a href="/politicas" target="_blank" rel="noreferrer"
                         style={{ textDecoration: "underline", color: "#666" }}>
                        política de privacidade
                      </a>
                    </span>
                  </label>

                  <button
                    type="button" onClick={onSubmit} disabled={!agreed || submitting}
                    style={{
                      width: "100%", height: 48, marginTop: 8,
                      background: !agreed ? "#f0f0ea" : "#f8f7f2",
                      color: !agreed ? "#aaa" : "#111111",
                      border: !agreed ? "1.5px solid #ddd" : "1.5px solid #111111",
                      borderRadius: 4,
                      fontFamily: dmSans,
                      fontSize: 14, fontWeight: 700, letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      cursor: !agreed || submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Enviando..." : "Resgatar CUPOM"}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    background: "#f5f5f0", borderRadius: 4, padding: "20px 24px",
                    margin: "0 0 24px",
                    fontFamily: dmSans,
                    fontSize: 28, fontWeight: 800, color: "#111",
                    letterSpacing: "0.1em", textAlign: "center",
                  }}>
                    {cfg.coupon_code}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      type="button" onClick={copyCode}
                      style={{
                        width: "100%", height: 48,
                        background: "#f8f7f2", color: "#111111",
                        border: "1.5px solid #111111", borderRadius: 4,
                        fontFamily: dmSans,
                        fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", cursor: "pointer",
                      }}
                    >
                      {copied ? "✓ COPIADO!" : "Clique para copiar CUPOM"}
                    </button>

                    <button
                      type="button" onClick={openVipGroup}
                      style={{
                        width: "100%", height: 48,
                        background: "#25D366", color: "#ffffff",
                        border: "none", borderRadius: 4,
                        fontFamily: dmSans,
                        fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      }}
                    >
                      <WhatsAppIcon />
                      ENTRAR NO GRUPO VIP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ts-coupon-tab {
          position: fixed; left: 0; top: 50%;
          transform: translateY(-50%) rotate(180deg);
          z-index: 999; color: #fff;
          writing-mode: vertical-rl; text-orientation: mixed;
          padding: 16px 10px;
          border: none; border-radius: 0 8px 8px 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          cursor: pointer;
          box-shadow: 2px 0 12px rgba(0,0,0,0.15);
          transition: filter 0.2s;
        }
        .ts-coupon-tab:hover { filter: brightness(1.4); }

        .ts-coupon-gift {
          display: none;
          position: fixed; left: 20px; bottom: 24px;
          width: 56px; height: 56px; border-radius: 50%;
          background: #111111; border: none;
          align-items: center; justify-content: center;
          z-index: 999; cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          animation: tsGiftPulse 1s ease-in-out infinite;
        }
        .ts-coupon-gift-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: #111111; opacity: 0.6;
          animation: tsGiftRing 1.6s ease-out infinite;
          z-index: -1;
        }
        @media (max-width: 767px) {
          .ts-coupon-tab { display: none; }
          .ts-coupon-gift { display: flex; }
        }
        @keyframes tsGiftPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes tsGiftRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes tsCouponIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
