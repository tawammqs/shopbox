export type DeliveryStatus =
  | "aguardando_confirmacao"
  | "confirmado"
  | "em_separacao"
  | "enviado"
  | "em_transito"
  | "saiu_entrega"
  | "entregue"
  | "cancelado";

export const DELIVERY_STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; icon: string; color: string; step: number }
> = {
  aguardando_confirmacao: { label: "Aguardando confirmação", icon: "🕐", color: "#f59e0b", step: 1 },
  confirmado:             { label: "Pedido confirmado",      icon: "✅", color: "#22c55e", step: 2 },
  em_separacao:           { label: "Em separação",           icon: "📦", color: "#3b82f6", step: 3 },
  enviado:                { label: "Enviado / Postado",      icon: "🚚", color: "#8b5cf6", step: 4 },
  em_transito:            { label: "Em trânsito",            icon: "🛣️", color: "#6366f1", step: 5 },
  saiu_entrega:           { label: "Saiu para entrega",      icon: "🏃", color: "#f97316", step: 6 },
  entregue:               { label: "Entregue!",              icon: "🎉", color: "#25d366", step: 7 },
  cancelado:              { label: "Cancelado",              icon: "❌", color: "#ef4444", step: 0 },
};

export const DELIVERY_STATUS_KEYS = Object.keys(DELIVERY_STATUS_CONFIG) as DeliveryStatus[];

export const DELIVERY_STEPS = DELIVERY_STATUS_KEYS
  .map((key) => ({ key, ...DELIVERY_STATUS_CONFIG[key] }))
  .filter((s) => s.step > 0)
  .sort((a, b) => a.step - b.step);
