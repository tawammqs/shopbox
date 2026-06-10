import { effectivePrice, formatBRL } from "./format";

export function getInstallment(price: number, promoPrice?: number | null) {
  const finalPrice = effectivePrice(price, promoPrice ?? null);
  const value = finalPrice / 3;
  return {
    count: 3,
    value,
    formatted: formatBRL(value),
    show: finalPrice >= 9,
  };
}
