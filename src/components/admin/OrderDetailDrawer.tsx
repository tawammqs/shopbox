import { useEffect, useState } from "react";
import { X, MessageCircle, Loader2, Tag, Truck, Clock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type OrderStatus = "aguardando" | "confirmado" | "enviado" | "entregue" | "cancelado";

export type OrderDetail = {
  id: string;
  order_number: number;
  total: number;
  subtotal: number;
  discount_amount: number;
  status: OrderStatus;
  coupon_code: string | null;
  promotion_description: string | null;
  created_at: string;
  items: any;
  customer: {
    id: string;
    name: string;
    whatsapp: string;
    email: string | null;
    cpf: string | null;
    cep: string | null;
    address: string | null;
    city_state: string | null;
  } | null;
};

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  aguardando: { label: "Aguardando", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200" },
  confirmado: { label: "Confirmado", className: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200" },
  enviado:    { label: "Enviado",    className: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200" },
  entregue:   { label: "Entregue",   className: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200" },
  cancelado:  { label: "Cancelado",  className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200" },
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function OrderDetailDrawer({
  order,
  storeName,
  onClose,
  onChanged,
}: {
  order: OrderDetail | null;
  storeName: string;
  onClose: () => void;
  onChanged?: (status: OrderStatus) => void;
}) {
  const open = !!order;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ status: OrderStatus; changed_at: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!order) { setHistory([]); return; }
    setHistoryLoading(true);
    supabase
      .from("order_status_history")
      .select("status, changed_at")
      .eq("order_id", order.id)
      .order("changed_at", { ascending: true })
      .then(({ data }) => {
        setHistory((data ?? []) as { status: OrderStatus; changed_at: string }[]);
        setHistoryLoading(false);
      });
  }, [order?.id]);

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const c = order.customer;
  const waNumber = c?.whatsapp.replace(/\D/g, "") ?? "";
  const greeting = c
    ? `Olá, ${c.name.split(" ")[0]}! Tudo bem? Passando aqui da ${storeName} sobre o pedido #${String(order.order_number).padStart(3, "0")}.`
    : "";
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(greeting)}` : "";

  const updateStatus = async (status: OrderStatus) => {
    setBusy(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setBusy(false);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${STATUS_META[status].label}`);
      setHistory((h) => [...h, { status, changed_at: new Date().toISOString() }]);
      onChanged?.(status);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedido</p>
            <h2 className="font-display text-2xl font-bold">
              #{String(order.order_number).padStart(3, "0")}
            </h2>
            <p className="text-xs text-muted-foreground">{fmtDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={order.status} onValueChange={(v) => updateStatus(v as OrderStatus)} disabled={busy}>
              <SelectTrigger className={cn("h-9 w-[160px] border-0 px-3 text-sm font-medium", STATUS_META[order.status].className)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button onClick={onClose} aria-label="Fechar" className="rounded-md p-2 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Customer */}
          <section className="border-b border-border p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cliente
            </h3>
            {c ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Nome" full>{c.name}</Info>
                <Info label="WhatsApp">
                  {waUrl ? (
                    <a href={waUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
                      {c.whatsapp}
                    </a>
                  ) : c.whatsapp}
                </Info>
                <Info label="Email">{c.email || "—"}</Info>
                <Info label="CPF">{c.cpf || "—"}</Info>
                <Info label="CEP">{c.cep || "—"}</Info>
                <Info label="Cidade / Estado" full>{c.city_state || "—"}</Info>
                <Info label="Endereço" full>
                  <span className="inline-flex items-start gap-1.5">
                    <Truck className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    {c.address || "Endereço não informado"}
                  </span>
                </Info>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados do cliente.</p>
            )}
          </section>

          {/* Items */}
          <section className="border-b border-border p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Itens ({items.length})
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((it: any, idx: number) => (
                  <li key={idx} className="flex gap-3 rounded-lg border border-border p-3">
                    {it.image && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img src={it.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium">{it.title}</p>
                      {(it.color || it.size) && (
                        <p className="text-xs text-muted-foreground">
                          {it.color}{it.color && it.size ? " · " : ""}{it.size}
                        </p>
                      )}
                      <div className="mt-1 flex items-end justify-between">
                        <p className="text-xs text-muted-foreground">
                          {it.quantity} × {formatBRL(Number(it.unit_price ?? 0))}
                        </p>
                        <p className="text-sm font-semibold">{formatBRL(Number(it.line_total ?? 0))}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          </section>

          {/* Status Timeline */}
          <section className="border-b border-border p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Histórico de status
            </h3>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem histórico.</p>
            ) : (
              <ol className="relative ml-1 space-y-3 border-l border-border pl-5">
                {history.map((h, idx) => {
                  const isLast = idx === history.length - 1;
                  const meta = STATUS_META[h.status];
                  return (
                    <li key={idx} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background",
                          isLast ? "bg-accent" : "bg-muted-foreground/40",
                        )}
                      >
                        {isLast ? <Check className="h-2.5 w-2.5 text-accent-foreground" /> : <Clock className="h-2.5 w-2.5 text-background" />}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", meta.className)}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{fmtDate(h.changed_at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Totals */}
          <section className="p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resumo
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBRL(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-accent">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Desconto{order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </span>
                  <span>−{formatBRL(Number(order.discount_amount))}</span>
                </div>
              )}
              {order.promotion_description && (
                <p className="text-xs text-muted-foreground">{order.promotion_description}</p>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatBRL(Number(order.total))}</span>
              </div>
            </div>
          </section>
        </div>

        {waUrl && (
          <footer className="border-t border-border bg-muted/30 p-4">
            <Button asChild className="h-12 w-full bg-[#25d366] text-white hover:bg-[#20bd5a]">
              <a href={waUrl} target="_blank" rel="noopener">
                <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              </a>
            </Button>
          </footer>
        )}
      </aside>
    </>
  );
}

function Info({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}
