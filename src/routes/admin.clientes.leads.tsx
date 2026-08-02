import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Download, MessageCircle, Trash2, Search, Mail } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { markLeadsViewed } from "@/hooks/useUnreadCounts";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/clientes/leads")({
  head: () => ({ meta: [{ title: "Leads — ShopBox" }] }),
  component: Page,
});

type CouponLead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  birthday: string | null;
  created_at: string;
};
type VipLead = { id: string; name: string | null; whatsapp: string; created_at: string };
type NewsletterLead = { id: string; email: string; created_at: string };

type SourceTab = "all" | "coupon" | "vip" | "newsletter";

const TAB_DEFS: { id: SourceTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "coupon", label: "🎁 Cupom 5%" },
  { id: "vip", label: "👑 Ofertas Secretas" },
  { id: "newsletter", label: "📧 Newsletter" },
];

const TAB_DESCRIPTIONS: Record<SourceTab, string> = {
  all: "Visão consolidada de todas as fontes de leads, ordenadas por data.",
  coupon: "Pessoas que preencheram o formulário para ganhar 5% de desconto na primeira compra.",
  vip: 'Pessoas que deixaram o WhatsApp na seção "Ofertas Secretas" para entrar no grupo VIP.',
  newsletter: "E-mails cadastrados na seção de newsletter do rodapé da loja.",
};

function fmtPhone(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}
function fmtBirthday(b: string | null): string {
  if (!b) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(b);
  if (m) return `${m[3]}/${m[2]}`;
  const m2 = /^(\d{2})\/(\d{2})/.exec(b);
  if (m2) return `${m2[1]}/${m2[2]}`;
  return b;
}
function fmtDateTime(s: string): string {
  const d = new Date(s);
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}
function waLink(whatsapp: string): string {
  return buildWhatsAppUrl(whatsapp);
}

function Page() {
  const { data: store } = useMyStore();
  const storeId = store?.id;
  const qc = useQueryClient();
  const [tab, setTab] = useState<SourceTab>("all");
  const [q, setQ] = useState("");

  // Mark all leads as viewed when entering the page
  useEffect(() => {
    if (!storeId) return;
    markLeadsViewed(storeId).catch(() => {});
  }, [storeId]);

  const couponQ = useQuery({
    queryKey: ["leads-coupon", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<CouponLead[]> => {
      const { data, error } = await supabase
        .from("coupon_leads")
        .select("id, name, whatsapp, email, birthday, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CouponLead[];
    },
  });

  const vipQ = useQuery({
    queryKey: ["leads-vip", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<VipLead[]> => {
      const { data, error } = await (supabase as any)
        .from("vip_group_leads")
        .select("id, name, whatsapp, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VipLead[];
    },
  });

  const newsQ = useQuery({
    queryKey: ["leads-newsletter", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<NewsletterLead[]> => {
      const { data, error } = await supabase
        .from("newsletter_leads")
        .select("id, email, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsletterLead[];
    },
  });

  const remove = useMutation({
    mutationFn: async (args: { source: Exclude<SourceTab, "all">; id: string }) => {
      const table =
        args.source === "coupon"
          ? "coupon_leads"
          : args.source === "vip"
            ? "vip_group_leads"
            : "newsletter_leads";
      const { error } = await (supabase as any).from(table).delete().eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead removido");
      qc.invalidateQueries({ queryKey: ["leads-coupon"] });
      qc.invalidateQueries({ queryKey: ["leads-vip"] });
      qc.invalidateQueries({ queryKey: ["leads-newsletter"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const coupon = couponQ.data ?? [];
  const vip = vipQ.data ?? [];
  const news = newsQ.data ?? [];
  const totalCount = coupon.length + vip.length + news.length;

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const thisWeek =
    coupon.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length +
    vip.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length +
    news.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length;

  // Most popular origin
  const topOrigin = useMemo(() => {
    const arr = [
      { label: "Cupom 5%", count: coupon.length },
      { label: "Ofertas Secretas", count: vip.length },
      { label: "Newsletter", count: news.length },
    ].sort((a, b) => b.count - a.count);
    if (arr[0].count === 0) return { label: "—", count: 0 };
    return arr[0];
  }, [coupon.length, vip.length, news.length]);

  const tabCounts: Record<SourceTab, number> = {
    all: totalCount,
    coupon: coupon.length,
    vip: vip.length,
    newsletter: news.length,
  };

  const filterTextCoupon = (l: CouponLead) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      l.name.toLowerCase().includes(t) ||
      (l.whatsapp || "").toLowerCase().includes(t) ||
      (l.email || "").toLowerCase().includes(t)
    );
  };
  const filterTextVip = (l: VipLead) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      (l.name || "").toLowerCase().includes(t) ||
      (l.whatsapp || "").toLowerCase().includes(t)
    );
  };
  const filterTextNews = (l: NewsletterLead) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (l.email || "").toLowerCase().includes(t);
  };

  function exportCsv() {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    if (tab === "newsletter") {
      headers = ["E-mail", "Cadastrado em"];
      rows = news.filter(filterTextNews).map((l) => [l.email, fmtDateTime(l.created_at)]);
    } else if (tab === "coupon") {
      headers = ["Nome", "WhatsApp", "Email", "Aniversário", "Cadastrado em"];
      rows = coupon
        .filter(filterTextCoupon)
        .map((l) => [l.name, fmtPhone(l.whatsapp), l.email ?? "", fmtBirthday(l.birthday), fmtDateTime(l.created_at)]);
    } else if (tab === "vip") {
      headers = ["Nome", "WhatsApp", "Cadastrado em"];
      rows = vip.filter(filterTextVip).map((l) => [l.name ?? "", fmtPhone(l.whatsapp), fmtDateTime(l.created_at)]);
    } else {
      headers = ["Contato", "Detalhes", "Origem", "Cadastrado em"];
      rows = [
        ...coupon.filter(filterTextCoupon).map((l): (string | number)[] => [
          l.name,
          `${fmtPhone(l.whatsapp)}${l.birthday ? ` · Aniversário: ${fmtBirthday(l.birthday)}` : ""}`,
          "Cupom 5%",
          fmtDateTime(l.created_at),
        ]),
        ...vip.filter(filterTextVip).map((l): (string | number)[] => [
          l.name ?? "—",
          fmtPhone(l.whatsapp),
          "Ofertas Secretas",
          fmtDateTime(l.created_at),
        ]),
        ...news.filter(filterTextNews).map((l): (string | number)[] => [
          l.email,
          "—",
          "Newsletter",
          fmtDateTime(l.created_at),
        ]),
      ];
    }
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[#111827] md:text-2xl">Leads</h1>
          <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-xs font-semibold text-[#25d366]">
            {totalCount} leads
          </span>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Total de leads" value={totalCount} />
        <MetricCard label="Novos esta semana" value={thisWeek} />
        <MetricCard label="Origem mais popular" valueText={topOrigin.label} hint={topOrigin.count > 0 ? `${topOrigin.count} leads` : undefined} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
          {TAB_DEFS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                tab === t.id
                  ? "bg-[#f0fdf4] text-[#25d366]"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-gray-400">{tabCounts[t.id]}</span>
            </button>
          ))}
        </div>

        <p className="border-b border-gray-200 px-4 py-2.5 text-xs text-gray-500">
          {TAB_DESCRIPTIONS[tab]}
        </p>

        <div className="border-b border-gray-200 p-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, WhatsApp ou e-mail"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#25d366]"
            />
          </div>
        </div>

        {tab === "coupon" && (
          <CouponTable
            rows={coupon.filter(filterTextCoupon)}
            loading={couponQ.isLoading}
            onRemove={(id) => remove.mutate({ source: "coupon", id })}
          />
        )}
        {tab === "vip" && (
          <VipTable
            rows={vip.filter(filterTextVip)}
            loading={vipQ.isLoading}
            onRemove={(id) => remove.mutate({ source: "vip", id })}
          />
        )}
        {tab === "newsletter" && (
          <NewsletterTable
            rows={news.filter(filterTextNews)}
            loading={newsQ.isLoading}
            onRemove={(id) => remove.mutate({ source: "newsletter", id })}
          />
        )}
        {tab === "all" && (
          <AllTable
            coupon={coupon.filter(filterTextCoupon)}
            vip={vip.filter(filterTextVip)}
            news={news.filter(filterTextNews)}
            loading={couponQ.isLoading || vipQ.isLoading || newsQ.isLoading}
            onRemove={(source, id) => remove.mutate({ source, id })}
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, valueText, hint }: { label: string; value?: number; valueText?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#111827]">{valueText ?? value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function EmptyState({ tab }: { tab: SourceTab }) {
  const sub: Record<SourceTab, string> = {
    all: "Ative pop-ups de captação no editor de layout para começar.",
    coupon: "Ative o pop-up de cupom de boas-vindas no editor de layout.",
    vip: 'A seção "Ofertas Secretas" precisa estar ativa na sua loja.',
    newsletter: "Ative a seção de newsletter no rodapé da sua loja.",
  };
  return (
    <div className="py-12 text-center">
      <div className="mb-3 text-4xl">📭</div>
      <p className="text-sm text-gray-500">Ainda não há leads desta origem.</p>
      <p className="mt-1 text-xs text-gray-400">{sub[tab]}</p>
    </div>
  );
}
function Loading() {
  return <div className="p-8 text-center text-sm text-gray-500">Carregando…</div>;
}
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => {
        if (confirm("Remover este lead?")) onClick();
      }}
      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
      aria-label="Remover"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function CouponTable({
  rows, loading, onRemove,
}: {
  rows: CouponLead[];
  loading: boolean;
  onRemove: (id: string) => void;
}) {
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState tab="coupon" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Nome</th>
            <th className="px-4 py-2.5 text-left font-medium">WhatsApp</th>
            <th className="px-4 py-2.5 text-left font-medium">Aniversário</th>
            <th className="px-4 py-2.5 text-left font-medium">Cadastrado em</th>
            <th className="px-4 py-2.5 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-[#111827]">{l.name}</td>
              <td className="px-4 py-3">
                <a href={waLink(l.whatsapp)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[#25d366] hover:underline">
                  <MessageCircle className="h-4 w-4" /> {fmtPhone(l.whatsapp)}
                </a>
              </td>
              <td className="px-4 py-3 text-gray-600">{fmtBirthday(l.birthday)}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(l.created_at)}</td>
              <td className="px-4 py-3 text-right"><RemoveBtn onClick={() => onRemove(l.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VipTable({
  rows, loading, onRemove,
}: { rows: VipLead[]; loading: boolean; onRemove: (id: string) => void }) {
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState tab="vip" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Nome</th>
            <th className="px-4 py-2.5 text-left font-medium">WhatsApp</th>
            <th className="px-4 py-2.5 text-left font-medium">Cadastrado em</th>
            <th className="px-4 py-2.5 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-[#111827]">{l.name || "—"}</td>
              <td className="px-4 py-3">
                <a href={waLink(l.whatsapp)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[#25d366] hover:underline">
                  <MessageCircle className="h-4 w-4" /> {fmtPhone(l.whatsapp)}
                </a>
              </td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(l.created_at)}</td>
              <td className="px-4 py-3 text-right"><RemoveBtn onClick={() => onRemove(l.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewsletterTable({
  rows, loading, onRemove,
}: { rows: NewsletterLead[]; loading: boolean; onRemove: (id: string) => void }) {
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState tab="newsletter" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">E-mail</th>
            <th className="px-4 py-2.5 text-left font-medium">Cadastrado em</th>
            <th className="px-4 py-2.5 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3">
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 text-[#3b82f6] hover:underline">
                  <Mail className="h-4 w-4" /> {l.email}
                </a>
              </td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(l.created_at)}</td>
              <td className="px-4 py-3 text-right"><RemoveBtn onClick={() => onRemove(l.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllTable({
  coupon, vip, news, loading, onRemove,
}: {
  coupon: CouponLead[];
  vip: VipLead[];
  news: NewsletterLead[];
  loading: boolean;
  onRemove: (source: Exclude<SourceTab, "all">, id: string) => void;
}) {
  type Row = {
    source: Exclude<SourceTab, "all">;
    id: string;
    contato: string;
    detalhes: string;
    whatsapp?: string;
    email?: string;
    created_at: string;
  };

  const rows: Row[] = useMemo(() => {
    const all: Row[] = [
      ...coupon.map((l): Row => ({
        source: "coupon",
        id: l.id,
        contato: l.name,
        detalhes: `${fmtPhone(l.whatsapp)}${l.birthday ? ` · Aniversário: ${fmtBirthday(l.birthday)}` : ""}`,
        whatsapp: l.whatsapp,
        created_at: l.created_at,
      })),
      ...vip.map((l): Row => ({
        source: "vip",
        id: l.id,
        contato: l.name || "—",
        detalhes: fmtPhone(l.whatsapp),
        whatsapp: l.whatsapp,
        created_at: l.created_at,
      })),
      ...news.map((l): Row => ({
        source: "newsletter",
        id: l.id,
        contato: l.email,
        detalhes: "—",
        email: l.email,
        created_at: l.created_at,
      })),
    ];
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all;
  }, [coupon, vip, news]);

  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState tab="all" />;

  const badge = (s: Row["source"]) => {
    if (s === "coupon") return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">🎁 Cupom 5%</span>;
    if (s === "vip") return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">👑 Ofertas Secretas</span>;
    return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">📧 Newsletter</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Contato</th>
            <th className="px-4 py-2.5 text-left font-medium">Detalhes</th>
            <th className="px-4 py-2.5 text-left font-medium">Origem</th>
            <th className="px-4 py-2.5 text-left font-medium">Cadastrado em</th>
            <th className="px-4 py-2.5 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.source}-${r.id}`} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-[#111827]">
                {r.source === "newsletter" ? (
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-[#3b82f6] hover:underline">
                    <Mail className="h-4 w-4" /> {r.contato}
                  </a>
                ) : (
                  r.contato
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {r.whatsapp ? (
                  <a href={waLink(r.whatsapp)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[#25d366] hover:underline">
                    <MessageCircle className="h-4 w-4" /> {r.detalhes}
                  </a>
                ) : (
                  r.detalhes
                )}
              </td>
              <td className="px-4 py-3">{badge(r.source)}</td>
              <td className="px-4 py-3 text-gray-600">{fmtDateTime(r.created_at)}</td>
              <td className="px-4 py-3 text-right"><RemoveBtn onClick={() => onRemove(r.source, r.id)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
