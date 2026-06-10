import { formatBRL } from "./format";
import type { CartItem, AppliedCoupon } from "@/stores/cart";

export type CustomerInfo = {
  name?: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  cep?: string;
  address?: string;
  city_state?: string;
  paymentMethod?: string;
};

function buildCustomerBlock(customer?: CustomerInfo | null): string[] {
  if (!customer) return [];
  const lines: string[] = [];
  if (customer.name?.trim()) lines.push(`Nome: ${customer.name.trim()}`);
  if (customer.whatsapp?.trim()) lines.push(`WhatsApp: ${customer.whatsapp.trim()}`);
  if (customer.email?.trim()) lines.push(`Email: ${customer.email.trim()}`);
  if (customer.cpf?.trim()) lines.push(`CPF: ${customer.cpf.trim()}`);
  if (customer.cep?.trim()) lines.push(`CEP: ${customer.cep.trim()}`);
  if (customer.address?.trim()) lines.push(`Endereço: ${customer.address.trim()}`);
  if (customer.city_state?.trim()) lines.push(`Cidade/Estado: ${customer.city_state.trim()}`);
  if (lines.length === 0) return [];
  return ["", "👤 *Meus dados:*", ...lines];
}

function buildPaymentBlock(paymentMethod?: string | null, total?: number): string[] {
  if (!paymentMethod) return [];
  const label = paymentMethod === "pix" ? "PIX" : "Cartão de crédito (até 3x sem juros)";
  const lines = ["", `💳 *Forma de pagamento:* ${label}`];
  if (paymentMethod === "cartao" && typeof total === "number" && total >= 9) {
    lines.push(`💳 Parcelamento: 3x de ${formatBRL(total / 3)} sem juros`);
  }
  return lines;
}

export function buildCheckoutMessage(
  items: CartItem[],
  subtotal: number,
  coupon: AppliedCoupon,
  total: number,
  greeting?: string | null,
  customer?: CustomerInfo | null,
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
  out.push(`💰 *Total: ${formatBRL(total)}*`);
  out.push(...buildPaymentBlock(customer?.paymentMethod, total));
  out.push(...buildCustomerBlock(customer));
  out.push("", "Aguardo o retorno para confirmar pagamento e entrega! 🙏");
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
  customer?: CustomerInfo | null,
) {
  const url = buildWhatsAppUrl(phone, buildCheckoutMessage(items, subtotal, coupon, total, greeting, customer));
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
  customer?: CustomerInfo | null;
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
    ...buildPaymentBlock(opts.customer?.paymentMethod),
    ...buildCustomerBlock(opts.customer),
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

export function buildShareProductMessage(opts: { title: string; price: number; productUrl: string }) {
  return [`Olha que legal: *${opts.title}* — ${formatBRL(opts.price)}`, opts.productUrl].join("\n");
}
