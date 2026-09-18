/**
 * Overlays e seções para lojas com tema Mio (não-legacy The Shoes):
 *
 *  GRUPO VIP (addon_key = "grupo_vip")
 *   - É uma SEÇÃO inline na homepage (não tab/fab fixa) — renderizada via
 *     <MioVipSection /> a partir de sections_order ("addon:grupo_vip").
 *   - Também aparece como item no menu de navegação (<MioVipMenuLink />),
 *     que abre o mesmo popup de captura de WhatsApp.
 *   - <MioVipPopupHost /> é montado globalmente no layout para servir como
 *     dono do modal compartilhado entre a seção e o item de menu (via
 *     CustomEvent "mio:open-vip-popup").
 *
 *  CAPTURA DE LEADS (addon_key = "captura_leads")
 *   - É um BOTÃO FIXO lateral (desktop) / ícone presente (mobile),
 *     sempre visível enquanto o addon estiver ativo. NÃO abre sozinho:
 *     o popup só aparece quando o usuário clica no botão.
 *
 * Layout/comportamento são FIXOS do tema; só conteúdo e cores variam por loja.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront, useIsMioTheme } from "./StoreContext";

const VIP_POPUP_EVENT = "mio:open-vip-popup";

function formatWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function LockIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function GiftIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 000-5C13 3 12 8 12 8" />
    </svg>
  );
}

type GrupoVipCfg = {
  active?: boolean;
  whatsapp_group_link?: string;
  /** Segundo grupo (opcional). Quando preenchido, o cliente escolhe o grupo. */
  whatsapp_group_link_2?: string;
  two_groups?: boolean;
  group_1_label?: string;
  group_2_label?: string;
  section_title?: string;
  description?: string;
  button_text?: string;
  background_color?: string;
  icon_color?: string;
};

/** true quando a loja tem dois grupos configurados (passo de escolha). */
function hasTwoGroups(cfg: GrupoVipCfg) {
  return !!cfg.whatsapp_group_link_2 && cfg.two_groups !== false;
}

export function useMioVipConfig() {
  const { store } = useStorefront();
  const isLegacy = store.slug === "the-shoes";
  return useQuery({
    queryKey: ["mio-vip-cfg", store.id],
    enabled: !isLegacy,
    queryFn: async () => {
      const [statusRes, cfgRes] = await Promise.all([
        supabase.from("store_addons").select("status").eq("store_id", store.id).eq("addon_key", "grupo_vip").maybeSingle(),
        supabase.from("store_addon_configs").select("config").eq("store_id", store.id).eq("addon_key", "grupo_vip").maybeSingle(),
      ]);
      const active = (statusRes.data as any)?.status === "active";
      const cfg = ((cfgRes.data as any)?.config ?? {}) as GrupoVipCfg;
      const enabled = active && cfg.active !== false && !!cfg.whatsapp_group_link;
      return { enabled, cfg };
    },
    staleTime: 30_000,
  });
}

function openVipPopup() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(VIP_POPUP_EVENT));
}

/** Botão de menu (header drawer) — abre o popup de captura. */
export function MioVipMenuLink({ onNavigate }: { onNavigate?: () => void }) {
  const q = useMioVipConfig();
  if (!q.data?.enabled) return null;
  const cfg = q.data.cfg;
  const bg = cfg.background_color || "#111111";
  const fg = cfg.icon_color || "#ffffff";
  const title = cfg.section_title || "Ofertas Secretas";
  return (
    <button
      type="button"
      onClick={() => { openVipPopup(); onNavigate?.(); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: bg, color: fg,
        borderRadius: 9999, padding: "10px 20px", marginTop: 16,
        fontFamily: "inherit", fontSize: 15, fontWeight: 700,
        border: "none", cursor: "pointer",
      }}
    >
      <LockIcon color={fg} size={16} />
      {title}
    </button>
  );
}

/** Passo 2 — escolha do grupo (somente lojas com dois grupos configurados). */
function VipGroupChoice({ cfg, phone, onBack, onDone }: {
  cfg: GrupoVipCfg; phone: string; onBack: () => void; onDone: () => void;
}) {
  const label1 = cfg.group_1_label || "Grupo Feminino";
  const label2 = cfg.group_2_label || "Grupo Masculino";
  const linkStyle = (background: string): React.CSSProperties => ({
    display: "block", background, color: "#fff", padding: "14px 24px",
    borderRadius: 12, textAlign: "center", fontWeight: 700, fontSize: 15,
    textDecoration: "none",
  });
  return (
    <div>
      <h3 style={{ fontWeight: 800, fontSize: 17, color: "#111", marginBottom: 6 }}>
        Qual grupo você quer entrar?
      </h3>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        Escolha o grupo de ofertas da sua preferência:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <a href={cfg.whatsapp_group_link} target="_blank" rel="noopener noreferrer"
          style={linkStyle("#111827")} onClick={onDone}>
          {label1}
        </a>
        <a href={cfg.whatsapp_group_link_2} target="_blank" rel="noopener noreferrer"
          style={linkStyle("#25d366")} onClick={onDone}>
          {label2}
        </a>
      </div>
      <button type="button" onClick={onBack}
        style={{ marginTop: 12, fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
        ← Voltar
      </button>
      <p style={{ marginTop: 8, fontSize: 12, color: "#c0c0c0" }}>{phone}</p>
    </div>
  );
}

/** Seção inline da homepage — equivalente ao "Achadinhos / Ofertas Secretas" da The Shoes.
 *  Renderiza o input de WhatsApp INLINE (1 clique para submeter), sem abrir popup. */
export function MioVipSection() {
  const { store } = useStorefront();
  const q = useMioVipConfig();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  if (!q.data?.enabled) return null;
  const cfg = q.data.cfg;
  const bg = cfg.background_color || "#111111";
  const iconColor = cfg.icon_color || "#ffffff";
  const title = cfg.section_title || "Ofertas Secretas";
  const description = cfg.description || "Digite seu WhatsApp e tenha acesso às ofertas exclusivas.";
  const buttonText = cfg.button_text || "Desbloquear e ver ofertas";

  const onSubmit = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setInvalid(true);
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("vip_group_leads" as any).insert({
        store_id: store.id, whatsapp: digits, source: "mio_vip_section",
      });
      if (hasTwoGroups(cfg)) {
        setStep(2);
      } else {
        window.open(cfg.whatsapp_group_link!, "_blank", "noopener,noreferrer");
        setSuccess(true);
        setValue("");
      }
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="grupo-vip" style={{ position: "relative", width: "100%", padding: "48px 20px", overflow: "hidden", background: "#f3f3f3" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto" }}>
        <div style={{
          background: "#fff", borderRadius: 18, padding: "32px 24px",
          textAlign: "center", boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <LockIcon color={iconColor} size={26} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: "#111", marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>{description}</p>

          <input
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => { setValue(formatWhatsapp(e.target.value)); if (invalid) setInvalid(false); }}
            placeholder={invalid ? "Digite um WhatsApp válido" : "(DDD) XXXXX-XXXX"}
            disabled={success}
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            style={{
              width: "100%", height: 50,
              border: `1.5px solid ${invalid ? "#e53935" : "#e0e0e0"}`,
              borderRadius: 10, padding: "0 16px", fontSize: 16,
              textAlign: "center", color: "#111", marginBottom: 12,
              outline: "none", boxSizing: "border-box",
            }}
          />

          {success ? (
            <p style={{ color: "#25D366", fontSize: 14, fontWeight: 600, padding: "12px 0" }}>
              ✓ Redirecionando para o grupo VIP! 🎉
            </p>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              style={{
                width: "100%", height: 50, background: bg, color: iconColor,
                border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                cursor: "pointer", opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Enviando…" : buttonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Popup global compartilhado — montado uma única vez no layout. */
export function MioVipPopupHost() {
  const { store } = useStorefront();
  const q = useMioVipConfig();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(VIP_POPUP_EVENT, h);
    return () => window.removeEventListener(VIP_POPUP_EVENT, h);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!q.data?.enabled || !open) return null;
  const cfg = q.data.cfg;
  const bg = cfg.background_color || "#111111";
  const iconColor = cfg.icon_color || "#ffffff";
  const title = cfg.section_title || "Ofertas Secretas";
  const description = cfg.description || "Digite seu WhatsApp e tenha acesso às ofertas exclusivas.";
  const buttonText = cfg.button_text || "Desbloquear e ver ofertas";

  const onSubmit = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) { setInvalid(true); return; }
    setSubmitting(true);
    try {
      await supabase.from("vip_group_leads" as any).insert({
        store_id: store.id, whatsapp: digits, source: "mio_vip_section",
      });
      toast.success("Redirecionando para o grupo VIP! 🎉");
      window.open(cfg.whatsapp_group_link!, "_blank", "noopener,noreferrer");
      setValue("");
      setOpen(false);
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 1000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: "36px 28px",
          maxWidth: 420, width: "100%", textAlign: "center", position: "relative",
        }}
      >
        <button onClick={() => setOpen(false)} aria-label="Fechar"
          style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 22, color: "#aaa", cursor: "pointer" }}>×</button>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <LockIcon color={iconColor} size={28} />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: "#111", marginBottom: 10 }}>{title}</h2>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>{description}</p>
        <input
          type="tel" inputMode="numeric" value={value}
          onChange={(e) => { setValue(formatWhatsapp(e.target.value)); if (invalid) setInvalid(false); }}
          placeholder={invalid ? "Digite um WhatsApp válido" : "(DDD) XXXXX-XXXX"}
          style={{
            width: "100%", height: 50, border: `1.5px solid ${invalid ? "#e53935" : "#e0e0e0"}`,
            borderRadius: 10, padding: "0 16px", fontSize: 16, color: "#111",
            textAlign: "center", marginBottom: 12, outline: "none", boxSizing: "border-box",
          }}
        />
        <button type="button" onClick={onSubmit} disabled={submitting}
          style={{
            width: "100%", height: 50, background: bg, color: iconColor,
            border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: "pointer", opacity: submitting ? 0.7 : 1,
          }}>
          {submitting ? "Enviando…" : buttonText}
        </button>
      </div>
    </div>
  );
}

type CapturaLeadsCfg = {
  active?: boolean;
  discount_percent?: number;
  coupon_code?: string;
  title?: string;
  description?: string;
  ask_birthday?: boolean;
  button_color?: string;
  icon_color?: string;
  tab_text?: string;
};

const STORAGE_SUBMITTED = "mio_coupon_submitted";

export function MioCouponTab() {
  const { store } = useStorefront();
  const isMio = useIsMioTheme();
  const isLegacyTheShoes = store.slug === "the-shoes";

  const q = useQuery({
    queryKey: ["mio-coupon-tab", store.id],
    enabled: isMio && !isLegacyTheShoes,
    queryFn: async () => {
      const [statusRes, cfgRes] = await Promise.all([
        supabase.from("store_addons").select("status").eq("store_id", store.id).eq("addon_key", "captura_leads").maybeSingle(),
        supabase.from("store_addon_configs").select("config").eq("store_id", store.id).eq("addon_key", "captura_leads").maybeSingle(),
      ]);
      const active = (statusRes.data as any)?.status === "active";
      const cfg = ((cfgRes.data as any)?.config ?? {}) as CapturaLeadsCfg;
      return { active, cfg };
    },
    staleTime: 30_000,
  });

  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthday, setBirthday] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_SUBMITTED) === store.id) {
      setRevealed(true);
    }
  }, [store.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!isMio || isLegacyTheShoes) return null;
  if (!q.data?.active) return null;
  const cfg = q.data.cfg;
  if (cfg.active === false) return null;

  const btnColor = cfg.button_color || "#111111";
  const iconColor = cfg.icon_color || "#ffffff";
  const title = cfg.title || `${cfg.discount_percent ?? 5}% OFF na primeira compra!`;
  const description = cfg.description || "Cadastre-se e ganhe desconto na sua primeira compra.";
  const couponCode = cfg.coupon_code || "BEMVINDO";
  const tabText = cfg.tab_text || `${cfg.discount_percent ?? 5}% OFF — Primeira compra`;

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (name.trim().length < 2) e.name = true;
    if (whatsapp.replace(/\D/g, "").length < 10) e.whatsapp = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await supabase.from("coupon_leads" as any).insert({
        store_id: store.id, name: name.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        birthday: birthday.trim() || null,
        coupon_code: couponCode, source: "mio_coupon_tab",
      });
      localStorage.setItem(STORAGE_SUBMITTED, store.id);
      setRevealed(true);
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Desktop: side tab (sticky vertical). */}
      <button
        type="button" aria-label="Cupom de boas-vindas"
        onClick={() => setOpen(true)}
        className="mio-coupon-tab"
        style={{ background: btnColor, color: iconColor }}
      >
        {tabText}
      </button>

      {/* Mobile: floating gift icon. */}
      <button
        type="button" aria-label="Cupom de boas-vindas"
        onClick={() => setOpen(true)}
        className="mio-coupon-fab relative"
        style={{ background: btnColor, color: iconColor }}
      >
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: btnColor }}
          aria-hidden="true"
        />
        <span className="relative z-10">
          <GiftIcon color={iconColor} size={24} />
        </span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 380, padding: "32px 24px", position: "relative", textAlign: "center" }}
          >
            <button onClick={() => setOpen(false)} aria-label="Fechar"
              style={{ position: "absolute", top: 10, right: 14, background: "none", border: "none", fontSize: 22, color: "#aaa", cursor: "pointer" }}>×</button>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: btnColor, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <GiftIcon color={iconColor} size={26} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "#111", marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.55, marginBottom: 20 }}>{description}</p>

            {!revealed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                <input
                  type="text" value={name} placeholder="Seu nome"
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: false }); }}
                  style={{ height: 46, borderRadius: 8, padding: "0 14px", fontSize: 14, border: `1.5px solid ${errors.name ? "#e53935" : "#e0e0e0"}`, outline: "none" }}
                />
                <input
                  type="tel" inputMode="numeric" value={whatsapp} placeholder="WhatsApp"
                  onChange={(e) => { setWhatsapp(formatWhatsapp(e.target.value)); if (errors.whatsapp) setErrors({ ...errors, whatsapp: false }); }}
                  style={{ height: 46, borderRadius: 8, padding: "0 14px", fontSize: 14, border: `1.5px solid ${errors.whatsapp ? "#e53935" : "#e0e0e0"}`, outline: "none" }}
                />
                {cfg.ask_birthday !== false && (
                  <input
                    type="text" value={birthday} placeholder="Aniversário (DD/MM)"
                    onChange={(e) => setBirthday(e.target.value)}
                    style={{ height: 46, borderRadius: 8, padding: "0 14px", fontSize: 14, border: "1.5px solid #e0e0e0", outline: "none" }}
                  />
                )}
                <button type="button" onClick={onSubmit} disabled={submitting}
                  style={{ height: 48, background: btnColor, color: iconColor, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 6, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Enviando…" : "Quero meu desconto!"}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: "#f5f5f0", borderRadius: 8, padding: "18px 16px", margin: "8px 0 20px", fontSize: 24, fontWeight: 800, color: "#111", letterSpacing: "0.08em" }}>
                  {couponCode}
                </div>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(couponCode); toast.success("Cupom copiado!"); }}
                  style={{ width: "100%", height: 46, background: btnColor, color: iconColor, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Copiar cupom
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .mio-coupon-tab {
          position: fixed; left: 0; top: 50%;
          transform: translateY(-50%) rotate(180deg);
          z-index: 999; writing-mode: vertical-rl; text-orientation: mixed;
          padding: 16px 10px; border: none; border-radius: 0 8px 8px 0;
          font-family: inherit; font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          cursor: pointer; box-shadow: 2px 0 12px rgba(0,0,0,0.15);
          transition: filter 0.2s;
        }
        .mio-coupon-tab:hover { filter: brightness(1.15); }
        .mio-coupon-fab {
          display: none; position: fixed; left: 20px; bottom: 24px;
          width: 52px; height: 52px; border-radius: 50%;
          border: none; align-items: center; justify-content: center;
          z-index: 998; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,0.22);
        }
        @media (max-width: 767px) {
          .mio-coupon-tab { display: none; }
          .mio-coupon-fab { display: flex; }
        }
      `}</style>
    </>
  );
}
