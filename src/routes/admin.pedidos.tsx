import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Package as PackageIcon, ShoppingBag, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlanGate } from "@/components/admin/PlanGate";
import { OrderDetailDrawer, type OrderDetail } from "@/components/admin/OrderDetailDrawer";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — ShopBox" }] }),
  component: PedidosPage,
});

type OrderStatus = "aguardando" | "confirmado" | "enviado" | "entregue" | "cancelado";

type OrderRow = {
  id: string;
  order_number: number;
  total: number;
  subtotal: number;
  discount_amount: number;
  status: OrderStatus;
  coupon_code: string | null;
  created_at: string;
  items: any;
  customer: { id: string; name: string; whatsapp: string } | null;
};

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  aguardando: { label: "Pendente",   className: "bg-[#f3f4f6] text-[#374151]" },
  confirmado: { label: "Recebido",   className: "bg-[#d1fae5] text-[#065f46]" },
  enviado:    { label: "Recebido",   className: "bg-[#d1fae5] text-[#065f46]" },
  entregue:   { label: "Recebido",   className: "bg-[#d1fae5] text-[#065f46]" },
  cancelado:  { label: "Cancelado",  className: "bg-[#fee2e2] text-[#991b1b]" },
};

const PAGE_SIZE = 20;

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function PedidosPage() {
  const { data: store } = useMyStore();
  const planSlug = (store?.plan?.slug ?? null) as any;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Vendas</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Todos os pedidos da sua loja em um só lugar.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
            ↓ Exportar lista
          </button>
          <button className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]">
            + Criar um pedido
          </button>
        </div>
      </div>

      <PlanGate plan={planSlug} feature="customers">
        {store && <PedidosContent storeId={store.id} storeName={store.name} />}
      </PlanGate>
    </div>
  );
}


function PedidosContent({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [openOrder, setOpenOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, subtotal, discount_amount, status, coupon_code, created_at, items, customer:customers(id, name, whatsapp)")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data ?? []) as any);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = async (id: string) => {
    setOpenOrderId(id);
    setLoadingDetail(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, total, subtotal, discount_amount, status, coupon_code, promotion_description, created_at, items, customer:customers(id, name, whatsapp, email, cpf, cep, address, city_state)")
      .eq("id", id)
      .maybeSingle();
    setLoadingDetail(false);
    if (error || !data) {
      toast.error("Erro ao carregar detalhes do pedido");
      setOpenOrderId(null);
      return;
    }
    setOpenOrder(data as any);
  };

  const closeDetail = () => {
    setOpenOrderId(null);
    setOpenOrder(null);
  };

  useEffect(() => { load(); }, [storeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to + "T23:59:59") : null;
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (fromDate && new Date(o.created_at) < fromDate) return false;
      if (toDate && new Date(o.created_at) > toDate) return false;
      if (q) {
        const hit =
          String(o.order_number).includes(q) ||
          (o.customer?.name ?? "").toLowerCase().includes(q) ||
          (o.customer?.whatsapp ?? "").toLowerCase().includes(q) ||
          (o.coupon_code ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, statusFilter, from, to]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const revenue = filtered.reduce((a, o) => a + Number(o.total), 0);
    const pending = filtered.filter((o) => o.status === "aguardando").length;
    const avg = total > 0 ? revenue / total : 0;
    return { total, revenue, pending, avg };
  }, [filtered]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status } : o)));
    setOpenOrder((o) => (o && o.id === orderId ? { ...o, status } : o));
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      setOrders(prev);
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status atualizado para ${STATUS_META[status].label}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pedidos (filtro)" value={stats.total.toString()} />
        <StatCard label="Aguardando" value={stats.pending.toString()} />
        <StatCard label="Faturamento" value={formatBRL(stats.revenue)} />
        <StatCard label="Ticket médio" value={formatBRL(stats.avg)} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_160px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nº, cliente, WhatsApp ou cupom"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-display text-lg font-semibold">Nenhum pedido encontrado</p>
            <p className="text-sm text-muted-foreground">
              Ajuste os filtros ou aguarde novas compras finalizadas pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => {
                  const itemsCount = Array.isArray(o.items) ? o.items.reduce((a: number, x: any) => a + (Number(x.quantity) || 0), 0) : 0;
                  return (
                    <tr
                      key={o.id}
                      className="cursor-pointer border-t border-border hover:bg-muted/20"
                      onClick={() => openOrderDetail(o.id)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">
                        #{String(o.order_number).padStart(3, "0")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        {o.customer ? (
                          <div className="min-w-0">
                            <p className="truncate font-medium">{o.customer.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{o.customer.whatsapp}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <PackageIcon className="h-3.5 w-3.5" />
                          {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatBRL(Number(o.total))}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                          <SelectTrigger
                            className={cn("h-8 w-[140px] border-0 px-2 text-xs font-medium", STATUS_META[o.status].className)}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {o.customer?.whatsapp ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-[#25d366]/40 text-[#1a7a3e] hover:bg-[#25d366]/10"
                          >
                            <a
                              href={`https://wa.me/${o.customer.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {filtered.length} pedidos
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <OrderDetailDrawer
        order={openOrder}
        storeName={storeName}
        onClose={closeDetail}
        onChanged={(status) => {
          if (openOrderId) {
            setOrders((cur) => cur.map((o) => (o.id === openOrderId ? { ...o, status } : o)));
          }
        }}
      />
      {loadingDetail && openOrderId && !openOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
