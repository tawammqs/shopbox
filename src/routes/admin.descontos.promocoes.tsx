import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Trash2, Info, Search, Store, FolderOpen, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { promotionStatus } from "@/lib/promotions";

export const Route = createFileRoute("/admin/descontos/promocoes")({
  head: () => ({ meta: [{ title: "Promoções — ShopBox" }] }),
  component: Page,
});

const STATUS_UI = {
  active: { label: "🟢 Ativa", cls: "bg-[#f0fdf4] text-[#15803d]" },
  scheduled: { label: "⏰ Agendada", cls: "bg-amber-50 text-amber-700" },
  ended: { label: "🔴 Encerrada", cls: "bg-red-50 text-red-600" },
  inactive: { label: "Desativada", cls: "bg-gray-100 text-[#6b7280]" },
} as const;

function Page() {
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["promotions"] });
    qc.invalidateQueries({ queryKey: ["active-promotion"] });
  };

  const toggle = useMutation({
    mutationFn: async (p: any) => { await supabase.from("promotions").update({ active: !p.active }).eq("id", p.id); },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("promotions").delete().eq("id", id); },
    onSuccess: () => { toast.success("Excluído"); invalidate(); },
  });

  if (showForm && store) {
    return <PromoForm editing={editing} storeId={store.id} onDone={() => { setShowForm(false); setEditing(null); invalidate(); }} />;
  }

  const items = list.data ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Promoções</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate({ to: "/admin/descontos/cupons" })} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
            Cupons
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="h-10 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]">
            + Criar promoção
          </button>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-[#25d366] bg-[#f0fdf4] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#25d366]" />
        <p className="text-sm text-[#374151]">
          Promoções com temporizador mostram o preço original riscado, o preço com desconto e uma contagem regressiva embaixo de cada produto.
          Quando o tempo acaba, o desconto some automaticamente.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-[#6b7280]">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Desconto</th>
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
            {items.map((p: any) => {
              const st = STATUS_UI[promotionStatus(p)];
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="font-medium text-[#25d366] hover:underline">{p.name}</button>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{p.type === "percent" ? `${Number(p.value)}%` : formatBRL(Number(p.value))}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-[#374151]">{scopeLabel(p.scope_type)}</span></td>
                  <td className="px-4 py-3 text-[#6b7280]">{formatPeriod(p.starts_at, p.ends_at)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", st.cls)}>{st.label}</span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function scopeLabel(s: string) {
  return s === "all" || s === "store" ? "Toda a loja" : s === "category" || s === "subcategory" ? "Categorias" : "Produtos";
}
function formatPeriod(s: string | null, e: string | null) {
  if (!s && !e) return "Ilimitada";
  const f = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
  return `${f(s)} → ${f(e)}`;
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

type Scope = "all" | "category" | "products";

function PromoForm({ editing, storeId, onDone }: { editing: any; storeId: string; onDone: () => void }) {
  const initialScope: Scope = editing?.scope_type === "category" || editing?.scope_type === "subcategory" ? "category" : editing?.scope_type === "products" ? "products" : "all";
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    discount_type: (editing?.type ?? "percent") as "percent" | "fixed",
    discount_value: editing ? Number(editing.value) : 5,
    applies_to: initialScope,
    category_ids: (initialScope === "category" ? (editing?.scope_ids ?? []) : []) as string[],
    product_ids: (initialScope === "products" ? (editing?.scope_ids ?? []) : []) as string[],
    starts_at: editing ? toLocalInput(editing.starts_at) : toLocalInput(new Date().toISOString()),
    ends_at: toLocalInput(editing?.ends_at),
    timer_label: editing?.timer_label ?? "Oferta termina em:",
    bg_color: editing?.bg_color ?? "#111827",
    text_color: editing?.text_color ?? "#ffffff",
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const previewPrice = form.discount_type === "percent"
    ? 199.99 * (1 - (form.discount_value || 0) / 100)
    : Math.max(0, 199.99 - (form.discount_value || 0));

  async function save() {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    if (!(form.discount_value > 0)) return toast.error("Informe o valor do desconto");
    if (form.discount_type === "percent" && form.discount_value > 100) return toast.error("Desconto máximo de 100%");
    if (!form.ends_at) return toast.error("Informe a data de término");
    if (form.starts_at && new Date(form.ends_at) <= new Date(form.starts_at)) return toast.error("O término deve ser depois do início");
    if (form.applies_to === "category" && form.category_ids.length === 0) return toast.error("Selecione ao menos uma categoria");
    if (form.applies_to === "products" && form.product_ids.length === 0) return toast.error("Selecione ao menos um produto");
    setSaving(true);
    try {
      const payload = {
        store_id: storeId,
        name: form.name.trim(),
        type: form.discount_type,
        value: form.discount_value,
        scope_type: form.applies_to,
        scope_ids: (form.applies_to === "category" ? form.category_ids : form.applies_to === "products" ? form.product_ids : []) as any,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        timer_label: form.timer_label.trim() || null,
        bg_color: form.bg_color || "#111827",
        text_color: form.text_color || "#ffffff",
        active: editing ? editing.active : true,
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

  const input = "mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{editing ? "Editar" : "Criar"} promoção</h1>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <label className="text-sm font-medium">Nome da promoção</label>
          <input placeholder="Ex: Black Friday, Liquidação de Verão..." value={form.name} onChange={(e) => set("name", e.target.value)} className={input} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Tipo de desconto</label>
            <select value={form.discount_type} onChange={(e) => set("discount_type", e.target.value as any)} className={input}>
              <option value="percent">Porcentagem (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">{form.discount_type === "percent" ? "Desconto (%)" : "Desconto (R$)"}</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={form.discount_type === "percent" ? 100 : undefined} step={0.5}
                value={Number.isFinite(form.discount_value) ? form.discount_value : ""}
                onChange={(e) => set("discount_value", parseFloat(e.target.value))} className={input} />
              <span className="mt-1 shrink-0 text-sm text-gray-500">{form.discount_type === "percent" ? "%" : "R$"}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Aplicar em</label>
          <div className="mt-1 flex gap-2">
            {([
              { value: "all", label: "Toda a loja", Icon: Store },
              { value: "category", label: "Categorias", Icon: FolderOpen },
              { value: "products", label: "Produtos específicos", Icon: Package },
            ] as const).map((opt) => (
              <button key={opt.value} type="button" onClick={() => set("applies_to", opt.value)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                  form.applies_to === opt.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-[#374151] hover:bg-gray-50")}>
                <opt.Icon className="h-3.5 w-3.5" /> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {form.applies_to === "category" && (
          <CategoryMultiSelect storeId={storeId} selected={form.category_ids} onChange={(ids) => set("category_ids", ids)} />
        )}
        {form.applies_to === "products" && (
          <ProductMultiSelect storeId={storeId} selected={form.product_ids} onChange={(ids) => set("product_ids", ids)} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Início</label>
            <input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className={input} />
          </div>
          <div>
            <label className="text-sm font-medium">Término</label>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} className={input} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Texto do temporizador</label>
          <input placeholder="Ex: Oferta termina em:" value={form.timer_label} onChange={(e) => set("timer_label", e.target.value)} className={input} />
          <p className="mt-1 text-xs text-gray-400">Aparece embaixo de cada produto durante a promoção</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Cor de fundo da barra</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={form.bg_color} onChange={(e) => set("bg_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200" />
              <input value={form.bg_color} onChange={(e) => set("bg_color", e.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Cor do texto</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200" />
              <input value={form.text_color} onChange={(e) => set("text_color", e.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" />
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ backgroundColor: form.bg_color, color: form.text_color }}>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] font-medium">
            <span style={{ fontWeight: 800, fontSize: 15 }}>
              {form.discount_type === "percent" ? `${form.discount_value || 0}% OFF` : `R$${form.discount_value || 0} OFF`}
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span className="flex items-center gap-2">
              <span style={{ opacity: 0.8 }}>{form.timer_label || "Oferta termina em:"}</span>
              <span className="flex items-center gap-1 font-mono">00 : 23 : 45</span>
            </span>
          </div>
        </div>



        <div className="rounded-xl bg-gray-50 p-4">
          <p className="mb-2 text-xs text-gray-400">Preview no produto:</p>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 line-through">{formatBRL(199.99)}</span>
            <span className="text-lg font-bold text-red-500">{formatBRL(previewPrice)}</span>
            {form.timer_label && <div className="mt-2 text-xs text-gray-500">{form.timer_label}</div>}
            <div className="mt-1 flex items-center gap-1">
              {["08", "23", "45"].map((v, i) => (
                <span key={i} className="contents">
                  {i > 0 && <span className="text-xs font-bold text-gray-400">:</span>}
                  <span className="min-w-[28px] rounded-md bg-gray-900 px-1.5 py-0.5 text-center font-mono text-xs text-white">{v}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button onClick={save} disabled={saving} className="h-10 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60">{saving ? "Salvando…" : editing ? "Salvar" : "Criar"}</button>
      </div>
    </div>
  );
}

function CategoryMultiSelect({ storeId, selected, onChange }: { storeId: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const q = useQuery({
    queryKey: ["admin-categories-select", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, parent_id").eq("store_id", storeId).order("display_order");
      return data ?? [];
    },
  });
  const cats = q.data ?? [];
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="mb-2 text-xs font-medium text-[#6b7280]">Categorias ({selected.length} selecionadas)</p>
      {cats.length === 0 && <p className="text-xs text-gray-400">Nenhuma categoria cadastrada.</p>}
      <div className="flex flex-wrap gap-2">
        {cats.map((c: any) => {
          const parent = c.parent_id ? cats.find((x: any) => x.id === c.parent_id)?.name : null;
          const on = selected.includes(c.id);
          return (
            <button key={c.id} type="button" onClick={() => toggle(c.id)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium", on ? "border-[#25d366] bg-[#25d366]/10 text-[#15803d]" : "border-gray-200 text-[#374151]")}>
              {parent ? `${parent} › ` : ""}{c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductMultiSelect({ storeId, selected, onChange }: { storeId: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["admin-products-select", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, price, product_images(url, position)").eq("store_id", storeId).order("title");
      return data ?? [];
    },
  });
  const items = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (q.data ?? []).filter((p: any) => !t || p.title.toLowerCase().includes(t));
  }, [q.data, term]);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#6b7280]">Produtos ({selected.length} selecionados)</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar produto" className="h-8 rounded-lg border border-gray-200 pl-7 pr-2 text-xs outline-none focus:border-[#25d366]" />
        </div>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {items.map((p: any) => {
          const img = (p.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position)[0]?.url;
          const on = selected.includes(p.id);
          return (
            <label key={p.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm", on ? "bg-[#25d366]/10" : "hover:bg-gray-50")}>
              <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[#25d366]" />
              {img ? <img src={img} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-gray-100" />}
              <span className="flex-1 truncate">{p.title}</span>
              <span className="text-xs text-gray-500">{formatBRL(Number(p.price))}</span>
            </label>
          );
        })}
        {items.length === 0 && <p className="p-2 text-xs text-gray-400">Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}
