import { useEffect, useMemo, useState } from "react";
import { X, MessageCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export type CustomerRow = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  cpf: string | null;
  cep: string | null;
  address: string | null;
  city_state: string | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  order_number: number;
  items: any;
  subtotal: number;
  discount_amount: number;
  total: number;
  status: "aguardando" | "confirmado" | "enviado" | "entregue" | "cancelado";
  coupon_code: string | null;
  created_at: string;
};

const STATUS_META: Record<OrderRow["status"], { label: string; className: string }> = {
  aguardando:  { label: "Aguardando", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200" },
  confirmado:  { label: "Confirmado", className: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200" },
  enviado:     { label: "Enviado",    className: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200" },
  entregue:    { label: "Entregue",   className: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200" },
  cancelado:   { label: "Cancelado",  className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200" },
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function avatarColor(name: string) {
  const c = (name.charCodeAt(0) || 65) % 6;
  return ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-fuchsia-500"][c];
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function CustomerDetailDrawer({
  customer,
  storeName,
  onClose,
  onOrdersChanged,
}: {
  customer: CustomerRow | null;
  storeName: string;
  onClose: () => void;
  onOrdersChanged?: () => void;
}) {
  const open = !!customer;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!customer) return;
    let cancel = false;
    setLoading(true);
    supabase.from("orders")
      .select("id, order_number, items, subtotal, discount_amount, total, status, coupon_code, created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) { toast.error(error.message); setOrders([]); }
        else setOrders((data ?? []) as OrderRow[]);
        setLoading(false);
      });
    return () => { cancel = true; };
  }, [customer]);

  const stats = useMemo(() => {
    const total = orders.reduce((a, b) => a + Number(b.total), 0);
    const count = orders.length;
    return { total, count, avg: count > 0 ? total / count : 0 };
  }, [orders]);

  if (!customer) return null;

  const updateStatus = async (orderId: string, status: OrderRow["status"]) => {
    const prev = orders;
    setOrders((arr) => arr.map((o) => (o.id === orderId ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      setOrders(prev);
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${STATUS_META[status].label}`);
      onOrdersChanged?.();
    }
  };

  const waNumber = customer.whatsapp.replace(/\D/g, "");
  const greeting = `Olá, ${customer.name.split(" ")[0]}! Tudo bem? Passando aqui da ${storeName}...`;
  const waUrl = buildWhatsAppUrl(waNumber, greeting);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl",
      )}>
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white",
              avatarColor(customer.name),
            )}>
              {initials(customer.name)}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{customer.name}</h2>
              <p className="text-sm text-muted-foreground">{customer.email ?? "Sem email"}</p>
              <p className="text-xs text-muted-foreground">Cliente desde {fmtDate(customer.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Info grid */}
          <section className="border-b border-border p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="WhatsApp">
                <a href={waUrl} target="_blank" rel="noopener" className="text-accent hover:underline">
                  {customer.whatsapp}
                </a>
              </Info>
              <Info label="CPF">{customer.cpf || "—"}</Info>
              <Info label="CEP">{customer.cep || "—"}</Info>
              <Info label="Cidade / Estado">{customer.city_state || "—"}</Info>
              <Info label="Endereço" full>{customer.address || "—"}</Info>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3 border-b border-border p-5">
            <Stat label="Pedidos" value={stats.count.toString()} />
            <Stat label="Total gasto" value={formatBRL(stats.total)} />
            <Stat label="Ticket médio" value={formatBRL(stats.avg)} />
          </section>

          <section className="p-5">
            <h3 className="mb-3 font-display text-base font-semibold">Histórico de Pedidos</h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => {
                  const items = Array.isArray(o.items) ? o.items : [];
                  const isExp = expanded === o.id;
                  return (
                    <li key={o.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">#{String(o.order_number).padStart(3, "0")}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatBRL(Number(o.total))}</p>
                          <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "produto" : "produtos"}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderRow["status"])}>
                          <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_META) as OrderRow["status"][]).map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_META[o.status].className)}>
                          {STATUS_META[o.status].label}
                        </span>
                        {items.length > 0 && (
                          <button
                            onClick={() => setExpanded(isExp ? null : o.id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {isExp ? "Ocultar" : "Ver itens"}
                            {isExp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                      {isExp && items.length > 0 && (
                        <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                          {items.map((it: any, idx: number) => (
                            <li key={idx} className="flex justify-between gap-2">
                              <span className="truncate">
                                {it.title} {it.color ? `· ${it.color}` : ""} {it.size ? `· ${it.size}` : ""} × {it.quantity}
                              </span>
                              <span>{formatBRL(Number(it.line_total ?? 0))}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-border bg-muted/30 p-4">
          <Button asChild className="h-12 w-full bg-[#25d366] text-white hover:bg-[#20bd5a]">
            <a href={waUrl} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </Button>
        </footer>
      </aside>
    </>
  );
}

function Info({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-base font-bold">{value}</p>
    </div>
  );
}
