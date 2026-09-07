import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HandCoins, Lock, MessageCircle, Package, Tag } from "lucide-react";
import { useStorefront } from "../StoreContext";
import { SalesTeamSelector } from "../SalesTeamSelector";

export const TS_OPEN_COUPON_EVENT = "ts:open-coupon";
export const TS_OPEN_VIP_EVENT = "ts:open-vip";

const btnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  padding: "10px 4px",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#374151",
  textDecoration: "none",
  fontFamily: "'DM Sans', 'Helvetica Neue', -apple-system, sans-serif",
};
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 500, lineHeight: 1 };

/**
 * Barra fixa inferior (somente mobile) com ações rápidas do storefront da The Shoes.
 * Reutiliza os modais já existentes via CustomEvents:
 *  - ts:open-coupon → TheShoesCouponTab (captura de leads / cupom)
 *  - ts:open-vip    → TheShoesHeader → TheShoesVipBanner (grupo VIP)
 * Atendimento abre o SalesTeamSelector (seleção de vendedoras).
 */
export function TheShoesMobileBar() {
  const { store } = useStorefront();
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const openCoupon = () => window.dispatchEvent(new Event(TS_OPEN_COUPON_EVENT));
  const openVip = () => window.dispatchEvent(new Event(TS_OPEN_VIP_EVENT));

  return (
    <>
      <div
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          backgroundColor: "#ffffff",
          borderTop: "0.5px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <button type="button" onClick={openCoupon} style={btnStyle} aria-label="Cupom de primeira compra">
          <Tag size={20} />
          <span style={labelStyle}>10% OFF</span>
        </button>

        <Link to="/loja/$slug/rastreio" params={{ slug: store.slug }} style={btnStyle} aria-label="Rastrear pedido">
          <Package size={20} />
          <span style={labelStyle}>Rastreio</span>
        </Link>

        <button
          type="button"
          onClick={openVip}
          aria-label="Grupo VIP"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            position: "relative",
            marginTop: -24,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <Lock size={22} color="#ffffff" />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#111827" }}>VIP</span>
        </button>

        <Link to="/loja/$slug/afiliados" params={{ slug: store.slug }} style={btnStyle} aria-label="Afiliados">
          <HandCoins size={20} />
          <span style={labelStyle}>Afiliados</span>
        </Link>

        <button type="button" onClick={() => setWhatsappOpen(true)} style={btnStyle} aria-label="Atendimento">
          <MessageCircle size={20} />
          <span style={labelStyle}>Atendimento</span>
        </button>
      </div>

      {whatsappOpen && (
        <SalesTeamSelector
          storeId={store.id}
          cartMessage={null}
          fallbackNumber={(store as any).whatsapp ?? null}
          onClose={() => setWhatsappOpen(false)}
        />
      )}

      {/* Espaço para o conteúdo não ficar escondido atrás da barra fixa no mobile */}
      <style>{`
        @media (max-width: 767px) {
          .storefront-root[data-store-slug="the-shoes"] main { padding-bottom: 70px; }
        }
      `}</style>
    </>
  );
}
