import { useMemo, useState } from "react";
import { Loader2, MessageCircle, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { maskPhoneBR, onlyDigits } from "@/lib/masks";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export type LeadColumn = "name" | "whatsapp" | "city" | "source" | "birthday" | "created_at";

type Props = {
  storeId: string;
  table: "vip_group_leads" | "coupon_leads";
  columns: LeadColumn[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  csvFilenamePrefix: string;
  metrics: Array<"total" | "week" | "birthday_month">;
};

type Lead = {
  id: string;
  name?: string | null;
  whatsapp: string;
  birthday?: string | null;
  city?: string | null;
  source?: string | null;
  created_at: string;
};

const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  meta_ads: { label: "📱 Meta Ads", className: "bg-purple-100 text-purple-700" },
  menu: { label: "📋 Menu", className: "bg-blue-100 text-blue-700" },
};

const sourceBadge = (source?: string | null) =>
  SOURCE_BADGES[source ?? ""] ?? { label: "🌐 Site", className: "bg-gray-100 text-gray-600" };

const formatDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatBirthday = (b?: string | null) => {
  if (!b) return "—";
  // expect YYYY-MM-DD or DD/MM
  const m = b.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}`;
  return b;
};

function downloadCsv(filename: string, rows: string[][]) {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsTable({ storeId, table, columns, searchPlaceholder, emptyTitle, emptySubtitle, csvFilenamePrefix, metrics }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads_table", table, storeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const name = (l.name ?? "").toLowerCase();
      const wa = onlyDigits(l.whatsapp ?? "");
      const qDigits = onlyDigits(q);
      return name.includes(q) || (qDigits && wa.includes(qDigits));
    });
  }, [leads, search]);

  const metricValues = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth() + 1;
    return {
      total: leads.length,
      week: leads.filter((l) => new Date(l.created_at) >= weekAgo).length,
      birthday_month: leads.filter((l) => {
        if (!l.birthday) return false;
        const m = l.birthday.match(/^\d{4}-(\d{2})-\d{2}/) || l.birthday.match(/^\d{2}\/(\d{2})/);
        return m ? Number(m[1]) === thisMonth : false;
      }).length,
    };
  }, [leads]);

  async function remove(id: string) {
    if (!confirm("Remover lead?")) return;
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lead removido");
    qc.invalidateQueries({ queryKey: ["leads_table", table, storeId] });
  }

  function exportCsv() {
    const headers: string[] = [];
    if (columns.includes("name")) headers.push("Nome");
    if (columns.includes("whatsapp")) headers.push("WhatsApp");
    if (columns.includes("city")) headers.push("Cidade");
    if (columns.includes("source")) headers.push("Origem");
    if (columns.includes("birthday")) headers.push("Aniversário");
    if (columns.includes("created_at")) headers.push("Cadastrado em");
    const rows = filtered.map((l) => {
      const r: string[] = [];
      if (columns.includes("name")) r.push(l.name ?? "");
      if (columns.includes("whatsapp")) r.push(maskPhoneBR(l.whatsapp));
      if (columns.includes("city")) r.push(l.city ?? "");
      if (columns.includes("source")) r.push(sourceBadge(l.source).label.replace(/^\S+\s/, ""));
      if (columns.includes("birthday")) r.push(formatBirthday(l.birthday));
      if (columns.includes("created_at")) r.push(formatDate(l.created_at));
      return r;
    });
    const date = new Date().toISOString().split("T")[0];
    downloadCsv(`${csvFilenamePrefix}_${date}.csv`, [headers, ...rows]);
  }

  const metricCards = [
    { key: "total", label: "Total de leads", value: metricValues.total },
    { key: "week", label: "Novos esta semana", value: metricValues.week },
    { key: "birthday_month", label: "Aniversariantes este mês", value: metricValues.birthday_month },
  ].filter((m) => metrics.includes(m.key as any));

  if (isLoading) return <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-gray-400" />;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#374151]">
          <span className="font-semibold">{leads.length}</span> leads capturados
        </p>
        <button
          onClick={exportCsv}
          disabled={leads.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </header>

      {metricCards.length > 0 && (
        <div className={`grid gap-3 ${metricCards.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {metricCards.map((m) => (
            <div key={m.key} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#111827]">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          <p className="text-3xl">📭</p>
          <p className="mt-2 font-medium text-gray-700">{emptyTitle}</p>
          <p className="mt-1">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {columns.includes("name") && <th className="px-4 py-3">Nome</th>}
                {columns.includes("whatsapp") && <th className="px-4 py-3">WhatsApp</th>}
                {columns.includes("city") && <th className="px-4 py-3">Cidade</th>}
                {columns.includes("source") && <th className="px-4 py-3">Origem</th>}
                {columns.includes("birthday") && <th className="px-4 py-3">Aniversário</th>}
                {columns.includes("created_at") && <th className="px-4 py-3">Cadastrado em</th>}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id}>
                  {columns.includes("name") && <td className="px-4 py-3">{l.name || "—"}</td>}
                  {columns.includes("whatsapp") && <td className="px-4 py-3">{maskPhoneBR(l.whatsapp)}</td>}
                  {columns.includes("city") && <td className="px-4 py-3">{l.city || "—"}</td>}
                  {columns.includes("source") && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadge(l.source).className}`}>
                        {sourceBadge(l.source).label}
                      </span>
                    </td>
                  )}
                  {columns.includes("birthday") && <td className="px-4 py-3">{formatBirthday(l.birthday)}</td>}
                  {columns.includes("created_at") && <td className="px-4 py-3 text-gray-500">{formatDate(l.created_at)}</td>}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={buildWhatsAppUrl(l.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md p-1.5 text-[#25d366] hover:bg-[#25d366]/10"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => remove(l.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function useLeadsCount(storeId: string | undefined, table: "vip_group_leads" | "coupon_leads") {
  return useQuery({
    queryKey: ["leads_count", table, storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId);
      return count ?? 0;
    },
  });
}
