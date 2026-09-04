import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Settings2, Download, Wallet, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { payAffiliate } from "@/lib/affiliates";
import { AffiliatePageEditor } from "@/components/admin/AffiliatePageEditor";

export const Route = createFileRoute("/admin/afiliados")({
  head: () => ({ meta: [{ title: "Afiliados — ShopBox" }] }),
  component: AffiliatesAdminPage,
});

type AffiliateRow = {
  id: string;
  store_id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  affiliate_slug: string;
  status: string;
  created_at: string;
  pix_key: string | null;
  pending_commission: number;
  paid_commission: number;
};

type SaleRow = {
  id: string;
  affiliate_id: string;
  source_affiliate_id: string | null;
  order_id: string | null;
  level: number;
  order_total: number;
  commission_amount: number;
  status: string;
  created_at: string;
  items: any;
  customer_name: string | null;
};

type PaymentRow = {
  id: string;
  affiliate_id: string;
  amount: number;
  pix_key: string | null;
  notes: string | null;
  paid_at: string;
};

type Tab = "list" | "report" | "payments" | "settings";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  paid: "Pago",
  cancelled: "Cancelado",
};

const monthKey = (d: string | Date) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${names[Number(m) - 1]}/${y}`;
};
const productName = (items: any) => {
  if (!Array.isArray(items) || items.length === 0) return "—";
  const first = items[0]?.title ?? items[0]?.name ?? "Produto";
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
};

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Settings ---------------- */

function AffiliateSettings({
  store,
}: {
  store: NonNullable<ReturnType<typeof useMyStore>["data"]>;
}) {
  const qc = useQueryClient();
  const [settings, setSettings] = useState({
    affiliates_enabled: !!store.affiliates_enabled,
    affiliate_commission_direct: Number(store.affiliate_commission_direct ?? 5),
    affiliate_commission_referrer: Number(store.affiliate_commission_referrer ?? 2.5),
  });

  useEffect(() => {
    setSettings({
      affiliates_enabled: !!store.affiliates_enabled,
      affiliate_commission_direct: Number(store.affiliate_commission_direct ?? 5),
      affiliate_commission_referrer: Number(store.affiliate_commission_referrer ?? 2.5),
    });
  }, [store.id, store.affiliates_enabled, store.affiliate_commission_direct, store.affiliate_commission_referrer]);

  const save = useMutation({
    mutationFn: async () => {
      const direct = Number(settings.affiliate_commission_direct);
      const referrer = Number(settings.affiliate_commission_referrer);
      if (!Number.isFinite(direct) || direct < 0 || direct > 50)
        throw new Error("Comissão direta deve estar entre 0% e 50%");
      if (!Number.isFinite(referrer) || referrer < 0 || referrer > 20)
        throw new Error("Comissão de recrutador deve estar entre 0% e 20%");
      const { error } = await supabase
        .from("stores")
        .update({
          affiliates_enabled: settings.affiliates_enabled,
          affiliate_commission_direct: direct,
          affiliate_commission_referrer: referrer,
        })
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas!");
      qc.invalidateQueries({ queryKey: ["my-store-full"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Settings2 className="h-4 w-4" /> Configurações do Programa
      </h3>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Programa de afiliados</p>
            <p className="text-xs text-muted-foreground">Ativar ou desativar o programa para sua loja</p>
          </div>
          <button
            type="button"
            aria-label="Ativar programa de afiliados"
            onClick={() => setSettings((s) => ({ ...s, affiliates_enabled: !s.affiliates_enabled }))}
            className={`flex h-6 w-12 shrink-0 items-center rounded-full transition-colors ${
              settings.affiliates_enabled ? "bg-[#25d366]" : "bg-muted"
            }`}
          >
            <div
              className={`mx-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.affiliates_enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <Label className="text-sm font-medium">Comissão direta (%)</Label>
          <p className="mb-1 text-xs text-muted-foreground">% que o afiliado ganha por cada venda que indicar</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              max={50}
              step={0.5}
              className="w-24 text-center"
              value={settings.affiliate_commission_direct}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  affiliate_commission_direct: e.target.value === "" ? 0 : parseFloat(e.target.value),
                }))
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
            <span className="text-xs text-muted-foreground">
              Ex: venda de R$ 200 → afiliado recebe{" "}
              {formatBRL((200 * (settings.affiliate_commission_direct || 0)) / 100)}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Comissão de recrutador (%)</Label>
          <p className="mb-1 text-xs text-muted-foreground">% que quem recrutou o afiliado ganha sobre as vendas dele</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              className="w-24 text-center"
              value={settings.affiliate_commission_referrer}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  affiliate_commission_referrer: e.target.value === "" ? 0 : parseFloat(e.target.value),
                }))
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
            <span className="text-xs text-muted-foreground">
              Ex: venda de R$ 200 → recrutador recebe{" "}
              {formatBRL((200 * (settings.affiliate_commission_referrer || 0)) / 100)}
            </span>
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb857]">
          {save.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Pay PIX modal ---------------- */

function PagarPixModal({
  affiliates,
  onClose,
  onPaid,
}: {
  affiliates: AffiliateRow[];
  onClose: () => void;
  onPaid: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const total = affiliates.reduce((a, x) => a + Number(x.pending_commission ?? 0), 0);
  const single = affiliates.length === 1 ? affiliates[0] : null;

  const handlePay = async () => {
    setPaying(true);
    let paidTotal = 0;
    let failures = 0;
    for (const a of affiliates) {
      try {
        const res = await payAffiliate(a.id, notes);
        paidTotal += Number(res.amount ?? 0);
      } catch {
        failures++;
      }
    }
    setPaying(false);
    if (failures === 0) toast.success(`PIX de ${formatBRL(paidTotal)} marcado como enviado!`);
    else toast.error(`${failures} pagamento(s) falharam. Pago: ${formatBRL(paidTotal)}`);
    onPaid();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {single ? "Confirmar pagamento PIX" : `Pagar ${affiliates.length} afiliados`}
        </h3>

        <div className="mb-4 space-y-2 rounded-xl bg-muted/50 p-4">
          {single ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Afiliado</span>
                <span className="font-medium text-foreground">{single.name}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Chave PIX</span>
                <span className="truncate font-mono text-xs font-medium text-foreground">{single.pix_key || "Não cadastrada"}</span>
              </div>
            </>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-auto text-xs">
              {affiliates.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span className="truncate text-foreground">{a.name}</span>
                  <span className="shrink-0 text-muted-foreground">{formatBRL(Number(a.pending_commission))}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Valor a pagar</span>
            <span className="text-lg font-bold text-[#1fb857]">{formatBRL(total)}</span>
          </div>
        </div>

        <textarea
          placeholder="Observação (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mb-4 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        />

        <p className="mb-4 text-xs text-muted-foreground">
          ⚠️ Ao confirmar, o saldo do afiliado será zerado. Certifique-se de ter enviado o PIX antes de confirmar.
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm text-foreground">
            Cancelar
          </button>
          <button
            onClick={handlePay}
            disabled={paying}
            className="flex-1 rounded-xl bg-[#25d366] py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {paying ? "Confirmando..." : "✅ Confirmar pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Metric card ---------------- */

function MetricCard({ label, value, color }: { label: string; value: string; color?: "yellow" | "green" }) {
  const cls =
    color === "green"
      ? "border-[#25d366]/40 bg-[#25d366]/10"
      : color === "yellow"
        ? "border-amber-400/40 bg-amber-400/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

/* ---------------- Page ---------------- */

function AffiliatesAdminPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("list");
  const [paying, setPaying] = useState<AffiliateRow[] | null>(null);

  // Report filters
  const [month, setMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [affSearch, setAffSearch] = useState("");

  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["admin-affiliates", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_affiliates")
        .select("id, store_id, name, email, whatsapp, affiliate_slug, status, created_at, pix_key, pending_commission, paid_commission")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AffiliateRow[];
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["admin-affiliate-sales", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_sales")
        .select("id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_amount, status, created_at, items, customer_name")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SaleRow[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["admin-affiliate-payments", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payments")
        .select("id, affiliate_id, amount, pix_key, notes, paid_at")
        .eq("store_id", store!.id)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
  });

  const affById = useMemo(() => new Map(affiliates.map((a) => [a.id, a])), [affiliates]);

  const totals = useMemo(() => {
    const m = new Map<string, { count: number; commission: number }>();
    for (const s of sales) {
      const cur = m.get(s.affiliate_id) ?? { count: 0, commission: 0 };
      if (s.level === 1) cur.count += 1;
      cur.commission += Number(s.commission_amount ?? 0);
      m.set(s.affiliate_id, cur);
    }
    return m;
  }, [sales]);

  const months = useMemo(() => {
    const set = new Set(sales.map((s) => monthKey(s.created_at)));
    return Array.from(set).sort().reverse();
  }, [sales]);

  // Report rows: level-1 sales joined with their level-2 (referrer) sibling
  const reportRows = useMemo(() => {
    const level1 = sales.filter((s) => s.level === 1);
    const byOrderSource = new Map<string, SaleRow>();
    for (const s of sales) {
      if (s.level === 2 && s.source_affiliate_id) byOrderSource.set(`${s.order_id ?? s.created_at}|${s.source_affiliate_id}`, s);
    }
    const term = affSearch.trim().toLowerCase();
    return level1
      .map((s) => {
        const ref = byOrderSource.get(`${s.order_id ?? s.created_at}|${s.affiliate_id}`) ?? null;
        return {
          sale: s,
          affiliate: affById.get(s.affiliate_id) ?? null,
          referrerSale: ref,
          referrer: ref ? affById.get(ref.affiliate_id) ?? null : null,
        };
      })
      .filter((r) => (month === "all" ? true : monthKey(r.sale.created_at) === month))
      .filter((r) => (statusFilter === "all" ? true : r.sale.status === statusFilter))
      .filter((r) => (term ? (r.affiliate?.name ?? "").toLowerCase().includes(term) : true));
  }, [sales, affById, month, statusFilter, affSearch]);

  const summary = useMemo(() => {
    const inMonth = sales.filter((s) => (month === "all" ? true : monthKey(s.created_at) === month));
    const totalSales = inMonth.filter((s) => s.level === 1).reduce((a, s) => a + Number(s.order_total), 0);
    const totalCommissions = inMonth.filter((s) => s.status !== "cancelled").reduce((a, s) => a + Number(s.commission_amount), 0);
    const pendingAmount = inMonth.filter((s) => s.status === "confirmed").reduce((a, s) => a + Number(s.commission_amount), 0);
    const paidAmount = inMonth.filter((s) => s.status === "paid").reduce((a, s) => a + Number(s.commission_amount), 0);
    return { totalSales, totalCommissions, pendingAmount, paidAmount };
  }, [sales, month]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    qc.invalidateQueries({ queryKey: ["admin-affiliate-sales"] });
    qc.invalidateQueries({ queryKey: ["admin-affiliate-payments"] });
  };

  const exportCSV = () => {
    const headers = ["Data", "Afiliado", "Produto", "Valor Venda", "Comissão", "Recrutador", "Comissão recrutador", "Status"];
    const rows = reportRows.map((r) => [
      new Date(r.sale.created_at).toLocaleDateString("pt-BR"),
      r.affiliate?.name ?? "—",
      productName(r.sale.items),
      formatBRL(Number(r.sale.order_total)),
      formatBRL(Number(r.sale.commission_amount)),
      r.referrer?.name ?? "",
      r.referrerSale ? formatBRL(Number(r.referrerSale.commission_amount)) : "",
      STATUS_LABEL[r.sale.status] ?? r.sale.status,
    ]);
    downloadCSV([headers, ...rows], `comissoes-afiliados-${month === "all" ? "todos" : month}.csv`);
  };

  if (storeLoading || !store) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const withBalance = affiliates.filter((a) => Number(a.pending_commission) > 0);
  const totalPending = withBalance.reduce((a, x) => a + Number(x.pending_commission), 0);

  const tabs: [Tab, string, React.ReactNode][] = [
    ["list", "Lista de afiliados", <Users key="u" className="h-3.5 w-3.5" />],
    ["report", "Relatório", <FileText key="f" className="h-3.5 w-3.5" />],
    ["payments", "Pagamentos", <CreditCard key="c" className="h-3.5 w-3.5" />],
    ["settings", "Configurações", <Settings2 key="s" className="h-3.5 w-3.5" />],
  ];

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {tabs.map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* ---------- LIST ---------- */}
      {tab === "list" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Users className="h-4 w-4" /> Afiliados cadastrados ({affiliates.length})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                A pagar: <strong className="text-foreground">{formatBRL(totalPending)}</strong>
              </span>
              <Button
                size="sm"
                disabled={withBalance.length === 0}
                onClick={() => setPaying(withBalance)}
                className="bg-[#25d366] text-white hover:bg-[#1fb857]"
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5" /> Pagar tudo
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum afiliado cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Afiliado</th>
                    <th className="py-2 pr-3 text-right font-medium">Vendas</th>
                    <th className="py-2 pr-3 text-right font-medium">Comissão total</th>
                    <th className="py-2 pr-3 text-right font-medium">Saldo a pagar</th>
                    <th className="py-2 pr-3 font-medium">Chave PIX</th>
                    <th className="py-2 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {affiliates.map((a) => {
                    const t = totals.get(a.id) ?? { count: 0, commission: 0 };
                    const pending = Number(a.pending_commission ?? 0);
                    return (
                      <tr key={a.id}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.email} · /{a.affiliate_slug}</p>
                        </td>
                        <td className="py-3 pr-3 text-right text-foreground">{t.count}</td>
                        <td className="py-3 pr-3 text-right text-foreground">{formatBRL(t.commission)}</td>
                        <td className={`py-3 pr-3 text-right font-bold ${pending > 0 ? "text-[#1fb857]" : "text-muted-foreground"}`}>
                          {formatBRL(pending)}
                        </td>
                        <td className="max-w-[180px] truncate py-3 pr-3 font-mono text-xs text-foreground">
                          {a.pix_key || <span className="text-muted-foreground">Não cadastrada</span>}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending <= 0}
                            onClick={() => setPaying([a])}
                            className="border-[#25d366] text-[#1fb857] hover:bg-[#25d366]/10"
                          >
                            Pagar PIX
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- REPORT ---------- */}
      {tab === "report" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <Label className="text-xs">Mês/Ano</Label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">Todos</option>
                {months.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <Label className="text-xs">Afiliado</Label>
              <Input value={affSearch} onChange={(e) => setAffSearch(e.target.value)} placeholder="Buscar por nome" className="mt-1 h-9" />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={reportRows.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Total vendas" value={formatBRL(summary.totalSales)} />
            <MetricCard label="Comissões geradas" value={formatBRL(summary.totalCommissions)} />
            <MetricCard label="A pagar" value={formatBRL(summary.pendingAmount)} color="yellow" />
            <MetricCard label="Já pago" value={formatBRL(summary.paidAmount)} color="green" />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card p-4">
            {reportRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda encontrada para os filtros.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Data</th>
                    <th className="py-2 pr-3 font-medium">Afiliado</th>
                    <th className="py-2 pr-3 font-medium">Produto</th>
                    <th className="py-2 pr-3 text-right font-medium">Valor venda</th>
                    <th className="py-2 pr-3 text-right font-medium">Comissão</th>
                    <th className="py-2 pr-3 font-medium">Recrutador</th>
                    <th className="py-2 pr-3 text-right font-medium">Com. recrutador</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportRows.map((r) => (
                    <tr key={r.sale.id}>
                      <td className="py-2.5 pr-3 text-foreground">{new Date(r.sale.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</td>
                      <td className="py-2.5 pr-3 text-foreground">{r.affiliate?.name ?? "—"}</td>
                      <td className="max-w-[220px] truncate py-2.5 pr-3 text-foreground">{productName(r.sale.items)}</td>
                      <td className="py-2.5 pr-3 text-right text-foreground">{formatBRL(Number(r.sale.order_total))}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-foreground">{formatBRL(Number(r.sale.commission_amount))}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{r.referrer?.name ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right text-muted-foreground">{r.referrerSale ? formatBRL(Number(r.referrerSale.commission_amount)) : "—"}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            r.sale.status === "paid" || r.sale.status === "confirmed"
                              ? "bg-[#25d366]/15 text-[#1fb857]"
                              : r.sale.status === "cancelled"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber-400/15 text-amber-700"
                          }`}
                        >
                          {r.sale.status === "paid" || r.sale.status === "confirmed" ? "✅ " : r.sale.status === "pending" ? "⏳ " : "❌ "}
                          {STATUS_LABEL[r.sale.status] ?? r.sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ---------- PAYMENTS ---------- */}
      {tab === "payments" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
            <CreditCard className="h-4 w-4" /> Pagamentos PIX realizados ({payments.length})
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Afiliado</th>
                  <th className="py-2 pr-3 font-medium">Chave PIX</th>
                  <th className="py-2 pr-3 text-right font-medium">Valor pago</th>
                  <th className="py-2 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 text-foreground">{new Date(p.paid_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5 pr-3 text-foreground">{affById.get(p.affiliate_id)?.name ?? "—"}</td>
                    <td className="max-w-[180px] truncate py-2.5 pr-3 font-mono text-xs text-foreground">{p.pix_key || "—"}</td>
                    <td className="py-2.5 pr-3 text-right font-bold text-[#1fb857]">{formatBRL(Number(p.amount))}</td>
                    <td className="py-2.5 text-muted-foreground">{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ---------- SETTINGS ---------- */}
      {tab === "settings" && (
        <>
          <AffiliateSettings store={store} />
          <AffiliatePageEditor storeId={store.id} storeSlug={store.slug} initial={store.affiliate_page_content} />
        </>
      )}

      {paying && <PagarPixModal affiliates={paying} onClose={() => setPaying(null)} onPaid={refresh} />}
    </div>
  );
}
