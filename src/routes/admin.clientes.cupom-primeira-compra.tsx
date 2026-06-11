import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Trash2, Search } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { isPremiumStore } from "@/lib/access";
import { PremiumLock } from "@/components/admin/PremiumLock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clientes/cupom-primeira-compra")({
  head: () => ({ meta: [{ title: "Cupom Primeira Compra — ShopBox" }] }),
  component: Page,
});

type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  birthday: string | null;
  created_at: string;
};

function Page() {
  const { data: store } = useMyStore();
  const isPremium = isPremiumStore(store);

  if (!isPremium) {
    return (
      <PremiumLock description="Capture leads com cupom de boas-vindas no storefront e veja todos aqui.">
        <Inner storeId={undefined} />
      </PremiumLock>
    );
  }
  return <Inner storeId={store?.id} />;
}

function Inner({ storeId }: { storeId: string | undefined }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const leads = useQuery({
    queryKey: ["coupon-leads", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("coupon_leads")
        .select("id, name, whatsapp, email, birthday, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupon_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead removido");
      qc.invalidateQueries({ queryKey: ["coupon-leads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const list = leads.data ?? [];

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (l) => l.name.toLowerCase().includes(t) || (l.whatsapp || "").toLowerCase().includes(t),
    );
  }, [list, q]);

  const now = new Date();
  const month = now.getMonth() + 1;
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const birthdayThisMonth = list.filter((l) => {
    if (!l.birthday) return false;
    // birthday is text — assume DD/MM or YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(l.birthday) || /^(\d{2})\/(\d{2})/.exec(l.birthday);
    if (!m) return false;
    const monthPart = m.length === 4 ? parseInt(m[2], 10) : parseInt(m[2], 10);
    return monthPart === month;
  }).length;
  const thisWeek = list.filter((l) => new Date(l.created_at).getTime() >= sevenDaysAgo).length;

  function exportCsv() {
    const rows = [
      ["Nome", "WhatsApp", "Email", "Aniversário", "Data de cadastro"],
      ...filtered.map((l) => [
        l.name,
        l.whatsapp,
        l.email ?? "",
        l.birthday ?? "",
        new Date(l.created_at).toLocaleString("pt-BR"),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cupom-primeira-compra-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fmtBirthday(b: string | null): string {
    if (!b) return "—";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(b);
    if (m) return `${m[3]}/${m[2]}`;
    const m2 = /^(\d{2})\/(\d{2})/.exec(b);
    if (m2) return `${m2[1]}/${m2[2]}`;
    return b;
  }

  function waLink(whatsapp: string): string {
    const digits = (whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${digits.startsWith("55") ? digits : "55" + digits}`;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[#111827] md:text-2xl">Cupom Primeira Compra</h1>
          <span className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-xs font-semibold text-[#25d366]">
            {list.length} leads
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
        <MetricCard label="Total de cadastros" value={list.length} />
        <MetricCard label="Aniversariantes este mês" value={birthdayThisMonth} />
        <MetricCard label="Cadastros esta semana" value={thisWeek} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome ou WhatsApp"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#25d366]"
            />
          </div>
        </div>

        {leads.isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Nenhum lead capturado ainda.</p>
            <p className="mt-1 text-xs text-gray-400">Ative o cupom de boas-vindas no storefront para começar a coletar.</p>
          </div>
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Nome</th>
                    <th className="px-4 py-2.5 text-left font-medium">WhatsApp</th>
                    <th className="px-4 py-2.5 text-left font-medium">Aniversário</th>
                    <th className="px-4 py-2.5 text-left font-medium">Cadastro</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#111827]">{l.name}</td>
                      <td className="px-4 py-3">
                        <a href={waLink(l.whatsapp)} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[#25d366] hover:underline">
                          <MessageCircle className="h-4 w-4" /> {l.whatsapp}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtBirthday(l.birthday)}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { if (confirm("Remover este lead?")) remove.mutate(l.id); }}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {filtered.map((l) => (
                <div key={l.id} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[#111827]">{l.name}</p>
                      <a href={waLink(l.whatsapp)} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#25d366]">
                        <MessageCircle className="h-4 w-4" /> {l.whatsapp}
                      </a>
                    </div>
                    <button
                      onClick={() => { if (confirm("Remover este lead?")) remove.mutate(l.id); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>🎂 {fmtBirthday(l.birthday)}</span>
                    <span>📅 {new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#111827]">{value}</p>
    </div>
  );
}
