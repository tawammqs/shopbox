import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useActivePromotion } from "@/lib/promotions";
import { PromoTimer } from "@/components/storefront/PromoTimer";

/** Thin black bar pinned at the very top of the storefront while a timed promotion is running. */
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
        backgroundColor: "#111827",
        color: "#ffffff",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 12,
        width: "100%",
      }}
    >
      <span>{promo.name}</span>
      <span style={{ color: "#d9f523", fontWeight: 700 }}>
        {promo.type === "percent" ? `${promo.value}% OFF` : `R$${promo.value} OFF`}
      </span>
      {promo.timer_label && <span style={{ color: "#9ca3af", fontSize: 12 }}>{promo.timer_label}</span>}
      <PromoTimer endsAt={promo.ends_at} compact onExpire={onExpire} />
    </div>
  );
}
