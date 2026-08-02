import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStorefront } from "@/components/storefront/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { DELIVERY_STATUS_CONFIG, DELIVERY_STEPS, type DeliveryStatus } from "@/lib/delivery-status";
import { toast } from "sonner";

export const Route = createFileRoute("/loja/$slug/rastreio")({
  head: () => ({
    meta: [
      { title: "Rastrear meu pedido" },
      { name: "description", content: "Consulte o status atualizado do seu pedido pelo número do pedido ou pelo WhatsApp usado na compra." },
      { property: "og:title", content: "Rastrear meu pedido" },
      { property: "og:description", content: "Acompanhe o status de entrega do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RastreioPage,
});

type TrackedOrder = {
  order_number: number;
  created_at: string;
  delivery_status: string;
  tracking_code: string | null;
  tracking_url: string | null;
  delivery_notes: string | null;
  status_updated_at: string;
  total: number;
  items: any;
};

function RastreioPage() {
  const { store } = useStorefront();
  const [orderNumber, setOrderNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = !!orderNumber.trim() || whatsapp.replace(/\D/g, "").length >= 8;

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError("");
    setOrder(null);

    const num = orderNumber.replace(/\D/g, "");
    const { data, error: rpcError } = await supabase.rpc("track_order", {
      _store_id: store.id,
      _order_number: num ? Number(num) : null,
      _whatsapp: whatsapp,
    } as any);

    setLoading(false);
    const row = Array.isArray(data) ? (data[0] as TrackedOrder | undefined) : null;
    if (rpcError || !row) {
      setError("Pedido não encontrado. Verifique os dados e tente novamente.");
      return;
    }
    setOrder(row);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 font-display text-2xl font-bold">Rastrear meu pedido</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Digite o número do seu pedido ou o WhatsApp usado na compra.
      </p>

      <div className="mb-4 space-y-3">
        <input
          inputMode="numeric"
          placeholder="Número do pedido (ex: 12)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          ou
          <div className="h-px flex-1 bg-border" />
        </div>
        <input
          type="tel"
          placeholder="WhatsApp usado na compra"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={loading || !canSearch}
        className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Buscando..." : "Rastrear pedido"}
      </button>

      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

      {order && <OrderStatusCard order={order} storeWhatsapp={store.whatsapp} />}
    </div>
  );
}

function OrderStatusCard({ order, storeWhatsapp }: { order: TrackedOrder; storeWhatsapp: string }) {
  const status =
    DELIVERY_STATUS_CONFIG[order.delivery_status as DeliveryStatus] ??
    DELIVERY_STATUS_CONFIG.aguardando_confirmacao;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border">
      <div className="p-4" style={{ backgroundColor: status.color + "15" }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{status.icon}</span>
          <div>
            <p className="font-bold" style={{ color: status.color }}>{status.label}</p>
            <p className="text-xs text-muted-foreground">
              Pedido #{String(order.order_number).padStart(3, "0")} · atualizado em{" "}
              {new Date(order.status_updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {order.delivery_status !== "cancelado" && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-1">
            {DELIVERY_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-1 items-center">
                <div
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: step.step <= status.step ? status.color : "#e5e7eb",
                    color: step.step <= status.step ? "#fff" : "#9ca3af",
                  }}
                  title={step.label}
                >
                  {step.step <= status.step ? "✓" : step.step}
                </div>
                {i < DELIVERY_STEPS.length - 1 && (
                  <div
                    className="mx-0.5 h-0.5 flex-1"
                    style={{ backgroundColor: step.step < status.step ? status.color : "#e5e7eb" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {order.tracking_code && (
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <p className="mb-1 text-xs text-muted-foreground">Código de rastreio</p>
          <div className="flex items-center justify-between gap-3">
            <code className="font-mono text-sm font-bold">{order.tracking_code}</code>
            {order.tracking_url ? (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#25d366]"
              >
                Rastrear nos Correios →
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(order.tracking_code!);
                  toast.success("Código copiado");
                }}
                className="text-xs text-muted-foreground underline"
              >
                Copiar
              </button>
            )}
          </div>
        </div>
      )}

      {order.delivery_notes && (
        <div className="border-b border-border bg-blue-50 px-4 py-3 dark:bg-blue-500/10">
          <p className="mb-0.5 text-xs font-semibold text-blue-600 dark:text-blue-300">Mensagem da loja</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{order.delivery_notes}</p>
        </div>
      )}

      <div className="px-4 py-3">
        <p className="mb-2 text-xs text-muted-foreground">Itens do pedido</p>
        {items.map((it: any, i: number) => (
          <div key={i} className="flex justify-between py-1 text-sm">
            <span>{it.quantity}x {it.title ?? it.product_name}</span>
            <span className="text-muted-foreground">
              {formatBRL(Number(it.line_total ?? Number(it.unit_price ?? 0) * Number(it.quantity ?? 1)))}
            </span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm font-bold">
          <span>Total</span>
          <span>{formatBRL(Number(order.total))}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <a
          href={buildWhatsAppUrl(
            storeWhatsapp,
            `Olá! Tenho uma dúvida sobre meu pedido #${String(order.order_number).padStart(3, "0")}.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25d366] py-2.5 text-sm font-semibold text-[#25d366]"
        >
          💬 Falar com a loja
        </a>
      </div>
    </div>
  );
}
