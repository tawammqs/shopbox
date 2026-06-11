import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle, X, Eye, EyeOff, Trash2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/descontos/promocoes")({
  head: () => ({ meta: [{ title: "Promoções — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bannerOpen, setBannerOpen] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const list = useQuery({
    queryKey: ["promotions", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("promotions").select("*").eq("store_id", store!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (p: any) => {
      await supabase.from("promotions").update({ active: !p.active }).eq("id", p.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("promotions").delete().eq("id", id); },
    onSuccess: () => { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["promotions"] }); },
  });

  if (showForm) {
    return <PromoForm editing={editing} storeId={store!.id} onDone={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ["promotions"] }); }} />;
  }

  const items = list.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Promoções</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate({ to: "/admin/descontos/cupons" })} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
            Conhecer mais descontos
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="h-10 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]">
            + Criar promoção
          </button>
        </div>
      </header>

      {bannerOpen && (
        <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-[#25d366] bg-[#f0fdf4] p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#25d366]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#111827]">Promoções mais inteligentes</p>
            <p className="mt-0.5 text-sm text-[#374151]">Agora suas promoções combinam melhor e seus clientes sempre recebem o melhor desconto disponível.</p>
            <a className="mt-1 inline-block text-sm font-medium text-[#25d366] hover:underline" href="#">Mais informações ↗</a>
          </div>
          <button onClick={() => setBannerOpen(false)} className="rounded p-1 text-gray-400 hover:bg-white/50"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo de desconto</th>
              <th className="px-4 py-3">Aplicar a</th>
              <th className="px-4 py-3">Vigência</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-sm text-[#6b7280]">Nenhuma promoção criada.</td></tr>
            )}
            {items.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button onClick={() => { setEditing(p); setShowForm(true); }} className="font-medium text-[#25d366] hover:underline">{p.name}</button>
                </td>
                <td className="px-4 py-3 text-[#374151]">{p.type === "percent" ? `${p.value}%` : `R$ ${p.value}`}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-[#374151]">{scopeLabel(p.scope_type)}</span></td>
                <td className="px-4 py-3 text-[#6b7280]">{formatPeriod(p.starts_at, p.ends_at)}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", p.active ? "bg-[#f0fdf4] text-[#25d366]" : "bg-gray-100 text-[#6b7280]")}>
                    {p.active ? "Ativada" : "Desativada"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => toggle.mutate(p)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" title={p.active ? "Desativar" : "Ativar"}>
                      {p.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { if (confirm("Excluir?")) remove.mutate(p.id); }} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 0 && <p className="text-xs text-[#6b7280]">Mostrando 1-{items.length} de {items.length}</p>}
      <a href="#" className="inline-flex items-center gap-1 text-sm text-[#25d366] hover:underline">
        <Info className="h-3.5 w-3.5" /> Mais sobre promoções e descontos ↗
      </a>
    </div>
  );
}

function scopeLabel(s: string) {
  return s === "store" ? "Toda a loja" : s === "category" ? "Categorias" : "Produtos";
}
function formatPeriod(s: string | null, e: string | null) {
  if (!s && !e) return "Ilimitada";
  const f = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  return `${f(s)} → ${f(e)}`;
}

function PromoForm({ editing, storeId, onDone }: { editing: any; storeId: string; onDone: () => void }) {
  const [name, setName] = useState(editing?.name ?? "");
  const [kind, setKind] = useState<"buyxpayy" | "price" | "progressive">("price");
  const [buyX, setBuyX] = useState("3");
  const [payY, setPayY] = useState("2");
  const [type, setType] = useState<"percent" | "fixed">(editing?.type ?? "percent");
  const [value, setValue] = useState(editing?.value?.toString() ?? "10");
  const [scope, setScope] = useState<"store" | "category" | "product">(editing?.scope_type ?? "store");
  const [combine, setCombine] = useState({ price: false, shipping: false, cart: false, apps: false });
  const [period, setPeriod] = useState<"ilimitada" | "periodo">(editing?.starts_at || editing?.ends_at ? "periodo" : "ilimitada");
  const [startsAt, setStartsAt] = useState(editing?.starts_at?.slice(0, 10) ?? "");
  const [endsAt, setEndsAt] = useState(editing?.ends_at?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const finalType = kind === "buyxpayy" ? "percent" : type;
      const finalValue = kind === "buyxpayy"
        ? Math.round((1 - (Number(payY) / Number(buyX))) * 100)
        : Number(value);
      const payload = {
        store_id: storeId,
        name: name.trim(),
        type: finalType as any,
        value: finalValue,
        scope_type: scope as any,
        scope_ids: [] as any,
        starts_at: period === "periodo" && startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: period === "periodo" && endsAt ? new Date(endsAt).toISOString() : null,
        active: true,
      };
      const { error } = editing
        ? await supabase.from("promotions").update(payload).eq("id", editing.id)
        : await supabase.from("promotions").insert(payload);
      if (error) throw error;
      toast.success("Promoção salva");
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{editing ? "Editar" : "Criar"} promoção</h1>

      <FormCard title="Nome">
        <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" placeholder="Ex.: Promo de inverno" />
        <p className="mt-1.5 text-xs text-[#6b7280]">Esse nome não será mostrado para seus clientes.</p>
      </FormCard>

      <FormCard title="Tipo de desconto">
        <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]">
          <option value="buyxpayy">Compre X e pague Y</option>
          <option value="price">Desconto sobre preços</option>
          <option value="progressive">Desconto progressivo</option>
        </select>
        {kind === "buyxpayy" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm">Comprando<input type="number" value={buyX} onChange={(e) => setBuyX(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" /></label>
            <label className="text-sm">Pague<input type="number" value={payY} onChange={(e) => setPayY(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" /></label>
          </div>
        )}
        {kind === "price" && (
          <div className="mt-3 flex items-center gap-2">
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-32 rounded-lg border border-gray-200 px-3 text-sm" />
            <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1">
              {(["percent", "fixed"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={cn("rounded-full px-3 py-1 text-xs font-medium", type === t ? "bg-[#25d366] text-white" : "text-[#374151]")}>{t === "percent" ? "%" : "R$"}</button>
              ))}
            </div>
          </div>
        )}
        {kind === "progressive" && <p className="mt-2 text-sm text-[#6b7280]">Configure faixas de quantidade que ativam descontos crescentes.</p>}
      </FormCard>

      <FormCard title="Aplicar a">
        <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1">
          {([["store", "Toda a loja"], ["category", "Categorias"], ["product", "Produtos"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setScope(v as any)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", scope === v ? "bg-[#25d366] text-white" : "text-[#374151]")}>{l}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#6b7280]">{scope === "store" ? "A promoção será aplicada a todos os produtos." : scope === "category" ? "Selecione as categorias na próxima etapa." : "Selecione os produtos na próxima etapa."}</p>
      </FormCard>

      <FormCard title="Combinar com">
        {[
          ["price", "Descontos sobre preços"],
          ["shipping", "Frete grátis"],
          ["cart", "Descontos sobre o valor do carrinho"],
          ["apps", "Descontos de aplicativos"],
        ].map(([k, l]) => (
          <label key={k} className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={(combine as any)[k]} onChange={(e) => setCombine((c) => ({ ...c, [k]: e.target.checked }))} className="h-4 w-4 accent-[#25d366]" />
            {l}
          </label>
        ))}
      </FormCard>

      <FormCard title="Limites de uso">
        <p className="mb-1 text-xs font-medium text-[#6b7280]">Data</p>
        <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1">
          {(["ilimitada", "periodo"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", period === p ? "bg-[#25d366] text-white" : "text-[#374151]")}>{p === "ilimitada" ? "Ilimitada" : "Período"}</button>
          ))}
        </div>
        {period === "periodo" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-[#6b7280]">Início<input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" /></label>
            <label className="text-xs text-[#6b7280]">Fim<input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" /></label>
          </div>
        )}
      </FormCard>

      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button onClick={save} disabled={saving} className="h-10 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60">{saving ? "Salvando…" : editing ? "Salvar" : "Criar"}</button>
      </div>
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
