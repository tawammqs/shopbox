import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Plus, Eye, EyeOff, Trash2, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/descontos/cupons")({
  head: () => ({ meta: [{ title: "Cupons — ShopBox" }] }),
  component: CuponsPage,
});

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_cart: number;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  first_purchase_only: boolean;
  expires_at: string | null;
};

function CuponsPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const list = useQuery({
    queryKey: ["coupons-page", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Coupon[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons-page"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cupom excluído");
      qc.invalidateQueries({ queryKey: ["coupons-page"] });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = list.data ?? [];
    if (!q) return items;
    return items.filter((c) => c.code.toLowerCase().includes(q));
  }, [list.data, search]);

  const count = filtered.length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Cupons</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Crie cupons de desconto para seus clientes.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/descontos"
            className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50"
          >
            Conhecer mais descontos
          </Link>
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#25d366] px-4 text-sm font-semibold text-white hover:bg-[#1fb959]"
          >
            <Plus className="h-4 w-4" /> Criar cupom
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por código"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#25d366]"
          />
        </div>
        <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
          <SlidersHorizontal className="h-4 w-4" /> Filtrar
        </button>
        <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
          <ArrowUpDown className="h-4 w-4" /> A-Z
        </button>
      </div>

      <p className="text-xs text-[#6b7280]">{count} cupons</p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-[#f9fafb] text-left text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Frete</th>
              <th className="px-4 py-3">Vigência</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Limites</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[#6b7280]">Carregando…</td></tr>
            )}
            {!list.isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[#6b7280]">Nenhum cupom.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><span className="font-mono text-sm font-semibold uppercase text-[#25d366] hover:underline">{c.code}</span></td>
                <td className="px-4 py-3 text-[#111827]">
                  {c.type === "percent" ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-[#6b7280]">Não incluído</td>
                <td className="px-4 py-3 text-[#6b7280]">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}
                </td>
                <td className="px-4 py-3 text-[#111827]">{c.uses_count}</td>
                <td className="px-4 py-3 text-[#6b7280]">{c.max_uses ? c.max_uses : "Ilimitado"}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    c.active ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#f3f4f6] text-[#374151]",
                  )}>
                    {c.active ? "Ativado" : "Desativado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => toggle.mutate({ id: c.id, active: !c.active })}
                      className="rounded p-1.5 text-[#9ca3af] hover:bg-gray-100 hover:text-[#111827]"
                      title={c.active ? "Desativar" : "Ativar"}
                    >
                      {c.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => { setEditing(c); setOpen(true); }}
                      className="rounded p-1.5 text-[#9ca3af] hover:bg-gray-100 hover:text-[#111827]"
                      title="Editar"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Excluir cupom?")) remove.mutate(c.id); }}
                      className="rounded p-1.5 text-[#9ca3af] hover:bg-gray-100 hover:text-red-600"
                      title="Excluir"
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

      <CouponDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        storeId={store?.id ?? ""}
        onSaved={() => qc.invalidateQueries({ queryKey: ["coupons-page"] })}
      />
    </div>
  );
}

function CouponDialog({
  open, onOpenChange, editing, storeId, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: Coupon | null; storeId: string; onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed" | "shipping">("percent");
  const [value, setValue] = useState("10");
  const [includeShipping, setIncludeShipping] = useState(false);
  const [scope, setScope] = useState<"all" | "categories" | "products">("all");
  const [combine, setCombine] = useState(false);
  const [perCoupon, setPerCoupon] = useState<"ilimitado" | "limitado">("ilimitado");
  const [maxUses, setMaxUses] = useState("");
  const [perCustomer, setPerCustomer] = useState<"ilimitado" | "limitado" | "primeira">("ilimitado");
  const [dateMode, setDateMode] = useState<"ilimitado" | "periodo">("ilimitado");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minCart, setMinCart] = useState("0");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCode(editing.code);
      setType(editing.type);
      setValue(String(editing.value));
      setMaxUses(editing.max_uses ? String(editing.max_uses) : "");
      setPerCoupon(editing.max_uses ? "limitado" : "ilimitado");
      setPerCustomer(editing.first_purchase_only ? "primeira" : "ilimitado");
      setDateMode(editing.expires_at ? "periodo" : "ilimitado");
      setDateTo(editing.expires_at ? editing.expires_at.slice(0, 10) : "");
      setMinCart(String(editing.min_cart));
    } else {
      setCode(""); setType("percent"); setValue("10"); setIncludeShipping(false);
      setScope("all"); setCombine(false); setPerCoupon("ilimitado"); setMaxUses("");
      setPerCustomer("ilimitado"); setDateMode("ilimitado"); setDateFrom(""); setDateTo(""); setMinCart("0");
    }
  }, [open, editing]);

  async function save() {
    if (!code.trim()) return toast.error("Código obrigatório");
    const dbType = type === "shipping" ? "percent" : type;
    const dbValue = type === "shipping" ? 100 : Number(value);
    const payload = {
      store_id: storeId,
      code: code.toUpperCase().trim(),
      type: dbType,
      value: dbValue,
      min_cart: Number(minCart) || 0,
      max_uses: perCoupon === "limitado" && maxUses ? Number(maxUses) : null,
      expires_at: dateMode === "periodo" && dateTo ? new Date(dateTo).toISOString() : null,
      active: true,
      first_purchase_only: perCustomer === "primeira",
    };
    const { error } = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Cupom salvo");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cupom" : "Criar cupom"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card title="Código do cupom" hint="Este é o código que seu cliente deverá inserir no momento da compra.">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BEMVINDO10"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm font-mono uppercase outline-none focus:border-[#25d366]"
            />
          </Card>

          <Card title="Tipo de desconto">
            <Pills
              value={type}
              onChange={(v) => setType(v as any)}
              options={[
                { v: "percent", label: "Porcentagem" },
                { v: "fixed", label: "Valor fixo" },
                { v: "shipping", label: "Frete grátis" },
              ]}
            />
            {type !== "shipping" && (
              <div className="mt-3 flex items-center gap-2">
                {type === "fixed" && <span className="text-sm font-medium">R$</span>}
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  className="h-10 w-40 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
                />
                {type === "percent" && <span className="text-sm font-medium">%</span>}
              </div>
            )}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeShipping} onChange={(e) => setIncludeShipping(e.target.checked)} />
              Incluir custo de envio no desconto
            </label>
          </Card>

          <Card title="Aplicar a">
            <Pills
              value={scope}
              onChange={(v) => setScope(v as any)}
              options={[
                { v: "all", label: "Toda a loja" },
                { v: "categories", label: "Categorias" },
                { v: "products", label: "Produtos" },
              ]}
            />
            <p className="mt-2 text-xs text-[#6b7280]">
              {scope === "all" && "O desconto será aplicado a todos os produtos da loja."}
              {scope === "categories" && "O desconto será aplicado apenas a categorias selecionadas."}
              {scope === "products" && "O desconto será aplicado apenas a produtos selecionados."}
            </p>
          </Card>

          <Card title="Limites de uso">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={combine} onChange={(e) => setCombine(e.target.checked)} />
              Permitir combinar com outras promoções
            </label>

            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-[#6b7280]">Por cupom</p>
              <Pills
                value={perCoupon}
                onChange={(v) => setPerCoupon(v as any)}
                options={[
                  { v: "ilimitado", label: "Ilimitado" },
                  { v: "limitado", label: "Limitado" },
                ]}
              />
              {perCoupon === "limitado" && (
                <input
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  type="number"
                  placeholder="100"
                  className="mt-2 h-10 w-40 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
                />
              )}
            </div>

            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-[#6b7280]">Por cliente</p>
              <Pills
                value={perCustomer}
                onChange={(v) => setPerCustomer(v as any)}
                options={[
                  { v: "ilimitado", label: "Ilimitado" },
                  { v: "limitado", label: "Limitado" },
                  { v: "primeira", label: "Primeira compra" },
                ]}
              />
            </div>

            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-[#6b7280]">Data</p>
              <Pills
                value={dateMode}
                onChange={(v) => setDateMode(v as any)}
                options={[
                  { v: "ilimitado", label: "Ilimitado" },
                  { v: "periodo", label: "Período" },
                ]}
              />
              {dateMode === "periodo" && (
                <div className="mt-2 flex gap-2">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]" />
                </div>
              )}
            </div>

            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-[#6b7280]">Valor do carrinho</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Acima de R$</span>
                <input
                  type="number"
                  value={minCart}
                  onChange={(e) => setMinCart(e.target.value)}
                  className="h-10 w-40 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
                />
              </div>
            </div>
          </Card>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={save} className="inline-flex h-10 items-center rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959]">
            Salvar cupom
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      {hint && <p className="mt-1 text-xs text-[#6b7280]">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Pills({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            value === o.v ? "bg-[#25d366] text-white" : "text-[#374151] hover:bg-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
