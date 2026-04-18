import { formatBRL } from "./format";
import type { CartItem, AppliedCoupon } from "@/stores/cart";

export function buildCheckoutMessage(
  items: CartItem[],
  subtotal: number,
  coupon: AppliedCoupon,
  total: number,
  greeting?: string | null,
) {
  const lines = items.map(
    (i) =>
      `• ${i.title}${i.colorName ? ` - Cor: ${i.colorName}` : ""}${i.sizeLabel ? ` - Tamanho: ${i.sizeLabel}` : ""} - Qtd: ${i.quantity} - ${formatBRL(i.unitPrice * i.quantity)}`,
  );
  const out = [
    greeting?.trim() ? greeting.trim() : "Olá! Gostaria de finalizar meu pedido: 😊",
    "",
    "🛒 *Meu Pedido:*",
    ...lines,
    "",
    `Subtotal: ${formatBRL(subtotal)}`,
  ];
  if (coupon) {
    out.push(`Cupom ${coupon.code}: -${formatBRL(coupon.discount)}`);
  }
  out.push(`💰 *Total: ${formatBRL(total)}*`, "", "Aguardo o retorno para confirmar pagamento e entrega! 🙏");
  return out.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppCheckout(
  phone: string,
  items: CartItem[],
  subtotal: number,
  coupon: AppliedCoupon,
  total: number,
  greeting?: string | null,
) {
  const url = buildWhatsAppUrl(phone, buildCheckoutMessage(items, subtotal, coupon, total, greeting));
  window.open(url, "_blank");
}

export function buildBuyNowMessage(opts: {
  title: string;
  colorName?: string | null;
  sizeLabel?: string | null;
  quantity: number;
  unitPrice: number;
  productUrl: string;
  greeting?: string | null;
}) {
  const lines = [
    opts.greeting?.trim() ? opts.greeting.trim() : "Olá! Tenho interesse neste produto:",
    "",
    `*${opts.title}*`,
    opts.colorName ? `Cor: ${opts.colorName}` : null,
    opts.sizeLabel ? `Tamanho: ${opts.sizeLabel}` : null,
    `Quantidade: ${opts.quantity}`,
    `Valor: ${formatBRL(opts.unitPrice * opts.quantity)}`,
    "",
    `Link: ${opts.productUrl}`,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function buildShareProductMessage(opts: { title: string; price: number; productUrl: string }) {
  return [`Olha que legal: *${opts.title}* — ${formatBRL(opts.price)}`, opts.productUrl].join("\n");
}
