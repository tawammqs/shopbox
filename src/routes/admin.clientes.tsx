import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Download, Loader2, Users, ArrowUpDown, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { PlanGate } from "@/components/admin/PlanGate";
import { CustomerDetailDrawer, type CustomerRow } from "@/components/admin/CustomerDetailDrawer";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — ShopBox" }] }),
  component: ClientesPage,
});

type CustomerWithStats = CustomerRow & {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

type SortKey = "name" | "created_at" | "order_count" | "total_spent";

const PAGE_SIZE = 20;

function ClientesPage() {
  const { data: store } = useMyStore();
  const planSlug = (store?.plan?.slug ?? null) as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Quem comprou pelo WhatsApp aparece aqui. Acompanhe pedidos e converse direto.
        </p>
      </div>

      <PlanGate plan={planSlug} feature="customers">
        {store && <ClientesContent storeId={store.id} storeName={store.name} />}
      </PlanGate>
    </div>
  );
}

function ClientesContent({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cityFilter, setCityFilter] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [openCustomer, setOpenCustomer] = useState<CustomerRow | null>(null);
  const [statsBar, setStatsBar] = useState({ total: 0, newMonth: 0, ordersToday: 0, avgTicket: 0 });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: cs, error: e1 }, { data: os, error: e2 }] = await Promise.all([
        supabase.from("customers")
          .select("id, name, whatsapp, email, cpf, cep, address, city_state, created_at")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false }),
        supabase.from("orders")
          .select("id, customer_id, total, created_at")
          .eq("store_id", storeId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const orderMap = new Map<string, { count: number; total: number; last: string | null }>();
      let ordersTotal = 0;
      let ordersCount = 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      let ordersToday = 0;

      for (const o of os ?? []) {
        const key = o.customer_id;
        if (!key) continue;
        const cur = orderMap.get(key) ?? { count: 0, total: 0, last: null };
        cur.count += 1;
        cur.total += Number(o.total);
        if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
        orderMap.set(key, cur);
        ordersTotal += Number(o.total);
        ordersCount += 1;
        if (new Date(o.created_at) >= today) ordersToday += 1;
      }

      const merged: CustomerWithStats[] = (cs ?? []).map((c) => {
        const m = orderMap.get(c.id);
        return {
          ...c,
          order_count: m?.count ?? 0,
          total_spent: m?.total ?? 0,
          last_order_at: m?.last ?? null,
        };
      });
      setCustomers(merged);

      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
      const newMonth = merged.filter((c) => new Date(c.created_at) >= startMonth).length;
      setStatsBar({
        total: merged.length,
        newMonth,
        ordersToday,
        avgTicket: ordersCount > 0 ? ordersTotal / ordersCount : 0,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [storeId]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => { if (c.city_state) set.add(c.city_state); });
    return Array.from(set).sort();
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to + "T23:59:59") : null;
    let list = customers.filter((c) => {
      if (q) {
        const hit =
          c.name.toLowerCase().includes(q) ||
          c.whatsapp.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (fromDate && new Date(c.created_at) < fromDate) return false;
      if (toDate && new Date(c.created_at) > toDate) return false;
      if (cityFilter !== "__all__" && c.city_state !== cityFilter) return false;
      return true;
    });
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      let av: any, bv: any;
      switch (sortKey) {
        case "name": av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case "order_count": av = a.order_count; bv = b.order_count; break;
        case "total_spent": av = a.total_spent; bv = b.total_spent; break;
        default: av = a.created_at; bv = b.created_at;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return list;
  }, [customers, search, from, to, cityFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, from, to, cityFilter, sortKey, sortDir]);

  const exportCsv = () => {
    const header = ["Nome","WhatsApp","Email","CPF","CEP","Endereço","Cidade/Estado","Total de Pedidos","Valor Total Gasto","Data de Cadastro"];
    const rows = filtered.map((c) => [
      c.name, c.whatsapp, c.email ?? "", c.cpf ?? "", c.cep ?? "", c.address ?? "", c.city_state ?? "",
      String(c.order_count), c.total_spent.toFixed(2), new Date(c.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total de clientes" value={statsBar.total.toString()} />
        <StatCard label="Novos este mês" value={statsBar.newMonth.toString()} />
        <StatCard label="Pedidos hoje" value={statsBar.ordersToday.toString()} />
        <StatCard label="Ticket médio" value={formatBRL(statsBar.avgTicket)} />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, WhatsApp ou email"
              className="pl-9"
            />
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="Cidade/UF" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as cidades</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold">Nenhum cliente ainda</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Quando alguém finalizar uma compra pelo WhatsApp, aparecerá aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">
                      <SortBtn label="Cliente" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                    </th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3 hidden md:table-cell">Cidade/UF</th>
                    <th className="px-4 py-3">
                      <SortBtn label="Pedidos" active={sortKey === "order_count"} dir={sortDir} onClick={() => toggleSort("order_count")} />
                    </th>
                    <th className="px-4 py-3">
                      <SortBtn label="Valor gasto" active={sortKey === "total_spent"} dir={sortDir} onClick={() => toggleSort("total_spent")} />
                    </th>
                    <th className="px-4 py-3 hidden lg:table-cell">Último pedido</th>
                    <th className="px-4 py-3">
                      <SortBtn label="Cadastro" active={sortKey === "created_at"} dir={sortDir} onClick={() => toggleSort("created_at")} />
                    </th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                            avatarColor(c.name),
                          )}>
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`}
                          target="_blank" rel="noopener"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {c.whatsapp}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.city_state ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-full bg-accent/10 px-2 text-xs font-semibold text-accent">
                          {c.order_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatBRL(c.total_spent)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                        {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setOpenCustomer(c)}>
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {filtered.length} cliente{filtered.length === 1 ? "" : "s"} • Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <CustomerDetailDrawer
        customer={openCustomer}
        storeName={storeName}
        onClose={() => setOpenCustomer(null)}
        onOrdersChanged={loadAll}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function SortBtn({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
      {label}
      <ArrowUpDown className={cn("h-3 w-3", active && (dir === "asc" ? "rotate-180" : ""))} />
    </button>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
function avatarColor(name: string) {
  const c = (name.charCodeAt(0) || 65) % 6;
  return ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-fuchsia-500"][c];
}
