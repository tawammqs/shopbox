import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Send,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/marketing/grupo-automatico")({
  head: () => ({
    meta: [
      { title: "Grupo Automático — ShopBox" },
      {
        name: "description",
        content:
          "Agende o envio automático de ofertas nos seus grupos VIP do WhatsApp direto pelo painel ShopBox.",
      },
      { property: "og:title", content: "Grupo Automático — ShopBox" },
      {
        property: "og:description",
        content: "Conecte o WhatsApp, sincronize seus grupos e agende ofertas em poucos cliques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const MAX_GROUPS = 5;

const WA_FUNCTIONS_BASE = "https://ygnyttmfnmxbhxufcftw.supabase.co/functions/v1";

async function callWaFunction<T = any>(name: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${WA_FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error || json?.message || `Erro ${res.status} ao chamar ${name}`);
  }
  return json as T;
}

type Conn = {
  id: string;
  phone_number: string | null;
  connected_at: string | null;
  active: boolean;
};

type Group = {
  id: string;
  group_jid: string;
  group_name: string;
  group_members_count: number;
  active: boolean;
};

type Campaign = {
  id: string;
  group_ids: string[];
  product_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  created_at: string;
};

type ProductLite = {
  id: string;
  title: string;
  price: number;
  promo_price: number | null;
  url_slug: string | null;
  slug: string;
  image: string | null;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Page() {
  const { data: store, isLoading } = useMyStore();

  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!store) return <p className="text-sm text-gray-500">Loja não encontrada.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-[Poppins,system-ui,sans-serif] text-sm">
      <header>
        <h1 className="text-2xl font-bold text-[#111827]">Grupo Automático</h1>
        <p className="mt-1 text-xs text-[#6b7280]">
          Conecte seu WhatsApp, sincronize os grupos VIP e agende o envio de ofertas.
        </p>
      </header>

      <ConnectionSection storeId={store.id} />
      <GroupsSection storeId={store.id} />
      <ScheduleSection storeId={store.id} storeSlug={store.slug} />
      <HistorySection storeId={store.id} />
    </div>
  );
}

/* ---------------- 1. Conexão ---------------- */

function useConnection(storeId: string) {
  return useQuery({
    queryKey: ["mkt-wa-connection", storeId],
    queryFn: async (): Promise<Conn | null> => {
      const { data, error } = await supabase
        .from("marketing_whatsapp_connections")
        .select("id, phone_number, connected_at, active")
        .eq("store_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return (data as Conn) ?? null;
    },
  });
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: typeof Users;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#111827]">
          <Icon className="h-4 w-4 text-[#25d366]" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ConnectionSection({ storeId }: { storeId: string }) {
  const { data: conn, isLoading } = useConnection(storeId);
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const connected = !!conn?.active && !!conn?.phone_number;

  const connect = useMutation({
    mutationFn: () => callWaFunction("get-qr-code", { storeId }),
    onSuccess: (data: any) => {
      const code =
        data?.qr ?? data?.qrcode ?? data?.qr_code ?? data?.code ?? data?.data ?? null;
      setQr(typeof code === "string" ? code : null);
      setOpen(true);
      if (!code) toast.error("O servidor não retornou um QR Code.");
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Não foi possível gerar o QR Code. Tente novamente."),
  });

  return (
    <Section icon={Smartphone} title="Conectar WhatsApp">
      <div className="flex flex-wrap items-center gap-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : connected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366]/10 px-3 py-1 text-xs font-medium text-[#15803d]">
            <Check className="h-3.5 w-3.5" /> Conectado · {conn!.phone_number}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
            <X className="h-3.5 w-3.5" /> Desconectado
          </span>
        )}
        <button
          onClick={() => connect.mutate()}
          disabled={connect.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60"
        >
          {connect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {connect.isPending ? "Gerando QR Code…" : "Conectar WhatsApp via QR Code"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[#9ca3af]">
        Abra o WhatsApp no celular → Aparelhos conectados → Conectar um aparelho.
      </p>

      {open && <QrModal qr={qr} onClose={() => setOpen(false)} />}
    </Section>
  );
}

function QrModal({ qr, onClose }: { qr: string | null; onClose: () => void }) {
  const isImage = !!qr && (/^data:image\//.test(qr) || /^https?:\/\//.test(qr));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#111827]">Conectar WhatsApp</h3>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto flex min-h-[232px] items-center justify-center rounded-xl border border-gray-200 p-4">
          {qr ? (
            isImage ? (
              <img
                src={qr}
                alt="QR Code do WhatsApp"
                className="h-[200px] w-[200px] md:h-[250px] md:w-[250px]"
              />
            ) : (
              <QRCodeSVG
                value={qr}
                className="h-[200px] w-[200px] md:h-[250px] md:w-[250px]"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-[#9ca3af]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xs">Carregando QR Code…</p>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-[#374151]">Leia com seu celular</p>
        <p className="mt-1 text-xs text-[#9ca3af]">
          Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho.
        </p>
      </div>
    </div>
  );
}

/* ---------------- 2. Grupos ---------------- */

function useGroups(storeId: string) {
  return useQuery({
    queryKey: ["mkt-groups", storeId],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase
        .from("marketing_groups")
        .select("id, group_jid, group_name, group_members_count, active")
        .eq("store_id", storeId)
        .order("group_name");
      if (error) throw error;
      return (data ?? []) as Group[];
    },
  });
}

function GroupsSection({ storeId }: { storeId: string }) {
  const { data: groups = [], isLoading } = useGroups(storeId);
  const qc = useQueryClient();

  const sync = useMutation({
    mutationFn: () => callWaFunction("Sync-whatsapp-groups", { storeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mkt-groups", storeId] });
      toast.success("Grupos sincronizados");
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Conecte o WhatsApp para sincronizar seus grupos."),
  });

  const toggle = useMutation({
    mutationFn: async (g: Group) => {
      const { error } = await supabase
        .from("marketing_groups")
        .update({ active: !g.active })
        .eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mkt-groups", storeId] }),
  });

  return (
    <Section
      icon={Users}
      title="Grupos VIP"
      action={
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-gray-50 disabled:opacity-60"
        >
          {sync.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Sincronizar Grupos
        </button>
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : groups.length === 0 ? (
        <p className="text-xs text-[#9ca3af]">Nenhum grupo sincronizado</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {groups.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#111827]">{g.group_name}</p>
                <p className="text-xs text-[#9ca3af]">{g.group_members_count} membros</p>
              </div>
              <button
                onClick={() => toggle.mutate(g)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  g.active ? "bg-[#25d366]/10 text-[#15803d]" : "bg-gray-100 text-gray-500",
                )}
              >
                {g.active ? "Ativo" : "Inativo"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------------- 3. Agendar ---------------- */

function ScheduleSection({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const { data: groups = [] } = useGroups(storeId);
  const qc = useQueryClient();

  const [selected, setSelected] = useState<string[]>([]);
  const [product, setProduct] = useState<ProductLite | null>(null);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("10:00");

  function toggleGroup(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_GROUPS) {
        toast.error(`Selecione até ${MAX_GROUPS} grupos`);
        return prev;
      }
      return [...prev, id];
    });
  }

  const save = useMutation({
    mutationFn: async (now: boolean) => {
      if (selected.length === 0) throw new Error("Selecione pelo menos um grupo");
      if (!product) throw new Error("Selecione um produto");
      const scheduled = now ? new Date().toISOString() : new Date(`${date}T${time}:00`).toISOString();
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert({
          store_id: storeId,
          group_ids: selected,
          product_id: product.id,
          scheduled_at: scheduled,
          status: "scheduled",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (now) {
        try {
          await callWaFunction("send-scheduled-campaign", { campaignId: data.id });
        } catch (e: any) {
          throw new Error(
            `Campanha salva, mas o envio falhou: ${e?.message ?? "erro desconhecido"}`,
          );
        }
      }
      return { now };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["mkt-campaigns", storeId] });
      setSelected([]);
      setProduct(null);
      toast.success(r?.now ? "Oferta enviada agora!" : "Campanha agendada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível salvar"),
  });

  return (
    <Section icon={Calendar} title="Agendar nova oferta">
      <div className="space-y-5">
        <div>
          <label className="text-base font-medium text-[#374151]">Enviar para quais grupos?</label>
          {groups.length === 0 ? (
            <p className="mt-1 text-xs text-[#9ca3af]">Selecione até 5 grupos (sincronize primeiro)</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    selected.includes(g.id)
                      ? "border-[#25d366] bg-[#25d366]/10 text-[#15803d]"
                      : "border-gray-200 text-[#374151] hover:bg-gray-50",
                  )}
                >
                  {selected.includes(g.id) ? "☑ " : "☐ "}
                  {g.group_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <ProductPicker storeId={storeId} value={product} onChange={setProduct} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-base font-medium text-[#374151]">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-base font-medium text-[#374151]">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
            />
          </div>
        </div>

        <MessagePreview product={product} storeSlug={storeSlug} />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => save.mutate(false)}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60"
          >
            <Clock className="h-4 w-4" /> Agendar Oferta
          </button>
          <button
            onClick={() => save.mutate(true)}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#374151] hover:bg-gray-50 disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> Enviar Agora
          </button>
        </div>
      </div>
    </Section>
  );
}

function ProductPicker({
  storeId,
  value,
  onChange,
}: {
  storeId: string;
  value: ProductLite | null;
  onChange: (p: ProductLite | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["mkt-product-search", storeId, term],
    enabled: open,
    queryFn: async (): Promise<ProductLite[]> => {
      let q = supabase
        .from("products")
        .select("id, title, price, promo_price, slug, url_slug, product_images(url, position)")
        .eq("store_id", storeId)
        .eq("active", true)
        .limit(8);
      if (term.trim()) q = q.or(`title.ilike.%${term.trim()}%,sku.ilike.%${term.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        promo_price: p.promo_price != null ? Number(p.promo_price) : null,
        slug: p.slug,
        url_slug: p.url_slug,
        image:
          (p.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position)[0]?.url ??
          null,
      }));
    },
  });

  return (
    <div ref={boxRef} className="relative">
      <label className="text-base font-medium text-[#374151]">Qual produto?</label>
      {value ? (
        <div className="mt-1 flex items-center gap-3 rounded-lg border border-gray-200 p-2">
          <Thumb url={value.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#111827]">{value.title}</p>
            <p className="text-xs text-[#6b7280]">{formatBRL(value.promo_price ?? value.price)}</p>
          </div>
          <button onClick={() => onChange(null)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <input
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          placeholder="Digite nome ou SKU"
          className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm"
        />
      )}

      {open && !value && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {isFetching ? (
            <div className="p-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-[#9ca3af]">Nenhum produto encontrado</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-gray-50 p-2 text-left hover:bg-gray-50"
              >
                <Thumb url={p.image} />
                <span className="min-w-0 flex-1 truncate text-sm text-[#111827]">{p.title}</span>
                <span className="text-xs text-[#6b7280]">{formatBRL(p.promo_price ?? p.price)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  return url ? (
    <img src={url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded bg-gray-100" />
  );
}

function productLink(storeSlug: string, p: ProductLite) {
  return `shopboxapp.com.br/loja/${storeSlug}/produto/${p.url_slug || p.slug}`;
}

function MessagePreview({ product, storeSlug }: { product: ProductLite | null; storeSlug: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Preview</p>
      <div className="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="aspect-video w-full bg-gray-100">
          {product?.image && (
            <img src={product.image} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="text-sm font-medium text-[#111827]">
            {product?.title ?? "Nome do produto"}
          </p>
          <p className="text-sm font-semibold text-[#111827]">
            {product ? formatBRL(product.promo_price ?? product.price) : "R$ 0,00"}
          </p>
          <p className="truncate text-xs text-[#2563eb]">
            {product ? productLink(storeSlug, product) : `shopboxapp.com.br/loja/${storeSlug}/...`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 4. Histórico ---------------- */

const PAGE_SIZE = 10;

function HistorySection({ storeId }: { storeId: string }) {
  const [page, setPage] = useState(0);
  const since = useMemo(() => new Date(Date.now() - 30 * 86400_000).toISOString(), []);

  const { data, isLoading } = useQuery({
    queryKey: ["mkt-campaigns", storeId, page],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("marketing_campaigns")
        .select("id, group_ids, product_id, scheduled_at, sent_at, status, created_at", {
          count: "exact",
        })
        .eq("store_id", storeId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as Campaign[], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const ids = rows.map((r) => r.product_id).filter(Boolean) as string[];

  const { data: titles = {} } = useQuery({
    queryKey: ["mkt-campaign-products", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title").in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => (map[p.id] = p.title));
      return map;
    },
  });

  const total = data?.count ?? 0;

  return (
    <Section icon={Clock} title="Últimas Campanhas">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-[#9ca3af]">Nenhuma campanha nos últimos 30 dias.</p>
      ) : (
        <>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[#9ca3af]">
                  <th className="px-2 py-2 font-medium">Data</th>
                  <th className="px-2 py-2 font-medium">Hora</th>
                  <th className="px-2 py-2 font-medium">Grupos</th>
                  <th className="px-2 py-2 font-medium">Produto</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = new Date(r.scheduled_at);
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-2 py-2.5 text-[#374151]">
                        {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="px-2 py-2.5 text-[#374151]">
                        {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-2 py-2.5 text-[#374151]">{r.group_ids?.length ?? 0}</td>
                      <td className="max-w-[180px] truncate px-2 py-2.5 text-[#374151]">
                        {(r.product_id && titles[r.product_id]) || "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#6b7280]">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span>
              {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              Próximo →
            </button>
          </div>
        </>
      )}
    </Section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    sent: { label: "✅ Enviado", cls: "bg-[#25d366]/10 text-[#15803d]" },
    scheduled: { label: "⏰ Agendado", cls: "bg-amber-50 text-amber-700" },
    failed: { label: "❌ Falhou", cls: "bg-red-50 text-red-600" },
    draft: { label: "Rascunho", cls: "bg-gray-100 text-gray-600" },
  };
  const s = map[status] ?? map.draft!;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>{s.label}</span>
  );
}
