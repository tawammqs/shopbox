import { formatBRL } from "./format";
import type { CartItem } from "@/stores/cart";

export function buildCheckoutMessage(items: CartItem[], total: number) {
  const lines = items.map(
    (i) =>
      `• ${i.title}${i.colorName ? ` - Cor: ${i.colorName}` : ""}${i.sizeLabel ? ` - Tamanho: ${i.sizeLabel}` : ""} - Qtd: ${i.quantity} - ${formatBRL(i.unitPrice * i.quantity)}`,
  );
  return [
    "Olá! Gostaria de finalizar meu pedido: 😊",
    "",
    "🛒 *Meu Pedido:*",
    ...lines,
    "",
    `💰 *Total: ${formatBRL(total)}*`,
    "",
    "Aguardo o retorno para confirmar pagamento e entrega! 🙏",
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppCheckout(phone: string, items: CartItem[], total: number) {
  const url = buildWhatsAppUrl(phone, buildCheckoutMessage(items, total));
  window.open(url, "_blank");
}
