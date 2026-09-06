import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useActivePromotion } from "@/lib/promotions";
import { PromoTimer } from "@/components/storefront/PromoTimer";

/** Thin bar pinned at the very top of the storefront while a timed promotion is running. */
export function PromoTopBar({ storeId }: { storeId: string }) {
  const { data } = useActivePromotion(storeId);
  const qc = useQueryClient();
  const onExpire = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["active-promotion", storeId] });
  }, [qc, storeId]);

  const promo = data?.promotion;
  if (!promo?.ends_at) return null;

  return (
    <div
      style={{
        backgroundColor: promo.bg_color || "#111827",
        color: promo.text_color || "#ffffff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        fontSize: 13,
        fontWeight: 500,
        width: "100%",
        lineHeight: 1.3,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>
        {promo.type === "percent" ? `${promo.value}% OFF` : `R$${promo.value} OFF`}
      </span>

      <span style={{ opacity: 0.4 }}>|</span>

      <span style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
        <span style={{ opacity: 0.8 }}>{promo.timer_label || "Oferta termina em:"}</span>
        <PromoTimer endsAt={promo.ends_at} compact onExpire={onExpire} />
      </span>
    </div>
  );
}
