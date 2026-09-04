import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, LogOut, Users, Wallet, ShoppingBag, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import {
  affiliateRecruitUrl,
  affiliateStoreUrl,
  clearAffiliateSession,
  copyToClipboard,
  fetchAffiliateDashboard,
  readAffiliateSession,
  saveAffiliateSession,
  setAffiliatePixKey,
  useAffiliateSession,
  TS_LIME,
  type AffiliateSale,
  type AffiliatePayment,
} from "@/lib/affiliates";
import { AffiliateUnavailable } from "@/components/storefront/AffiliateShare";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/loja/$slug/afiliados/painel")({
  head: () => ({
    meta: [
      { title: "Painel do Afiliado" },
      { name: "description", content: "Acompanhe seus links, vendas indicadas e comissões." },
      { property: "og:title", content: "Painel do Afiliado" },
      { property: "og:description", content: "Seus links, vendas e comissões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AffiliateDashboardPage,
});

function AffiliateDashboardPage() {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { affiliate } = useAffiliateSession(store.id);
  const [checked, setChecked] = useState(false);
  const [editingPix, setEditingPix] = useState(false);
  const [newPixKey, setNewPixKey] = useState("");
  const [savingPix, setSavingPix] = useState(false);

  useEffect(() => {
    const a = readAffiliateSession();
    if (!a || a.store_id !== store.id) {
      navigate({ to: "/loja/$slug/afiliados/login", params: { slug: store.slug }, replace: true });
    } else {
      setChecked(true);
    }
  }, [store.id, store.slug, navigate]);

  const q = useQuery({
    queryKey: ["affiliate-dashboard", affiliate?.session_token],
    queryFn: () => fetchAffiliateDashboard(affiliate!.session_token!),
    enabled: !!affiliate?.session_token,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (q.isSuccess && q.data === null) {
      clearAffiliateSession();
      toast.error("Sessão expirada. Entre novamente.");
      navigate({ to: "/loja/$slug/afiliados/login", params: { slug: store.slug }, replace: true });
    }
  }, [q.isSuccess, q.data, navigate, store.slug]);

  if (!store.affiliates_enabled) return <AffiliateUnavailable slug={store.slug} />;
  if (!checked || !affiliate) return null;

  const data = q.data ?? null;
  const live = data?.affiliate ?? affiliate;
  const sales: AffiliateSale[] = data?.sales ?? [];
  const payments: AffiliatePayment[] = data?.payments ?? [];
  const activeSales = sales.filter((s) => s.status !== "cancelled");
  const totalSold = activeSales.filter((s) => s.level === 1).reduce((a, s) => a + Number(s.order_total), 0);
  const sumBy = (st: string) => sales.filter((s) => s.status === st).reduce((a, s) => a + Number(s.commission_amount), 0);
  const awaiting = sumBy("pending");
  const pending = live.pending_commission != null ? Number(live.pending_commission) : sumBy("confirmed");
  const paid = live.paid_commission != null ? Number(live.paid_commission) : sumBy("paid");
  const STATUS_UI: Record<string, { label: string; color: string }> = {
    pending: { label: "⏳ Pendente", color: "#b45309" },
    confirmed: { label: "✅ Confirmada", color: "#15803d" },
    paid: { label: "✅ Paga", color: "#15803d" },
    cancelled: { label: "❌ Cancelada", color: "#b91c1c" },
  };
  const referrals = data?.referrals ?? [];
  const pixKey = live.pix_key ?? null;

  const copy = async (url: string) => {
    const ok = await copyToClipboard(url);
    ok ? toast.success("Link copiado! 🔗") : toast.error("Não foi possível copiar");
  };

  const logout = () => {
    clearAffiliateSession();
    navigate({ to: "/loja/$slug", params: { slug: store.slug } });
  };

  const savePixKey = async () => {
    if (!affiliate.session_token) return;
    if (!newPixKey.trim()) { toast.error("Informe a chave PIX"); return; }
    setSavingPix(true);
    try {
      const updated = await setAffiliatePixKey(affiliate.session_token, newPixKey.trim());
      if (!updated) throw new Error("Sessão expirada");
      saveAffiliateSession({ ...affiliate, ...updated, session_token: affiliate.session_token });
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] });
      toast.success("Chave PIX atualizada!");
      setEditingPix(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar chave PIX");
    } finally {
      setSavingPix(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Painel do afiliado</p>
          <h1 className="text-2xl font-bold text-foreground">Olá, {affiliate.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu identificador: <code className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">{affiliate.affiliate_slug}</code>
            {" · "}Comissão: <strong>{Number(affiliate.commission_percent)}%</strong>
            {Number(affiliate.referral_commission_percent) > 0 && (
              <> · Indicações: <strong>{Number(affiliate.referral_commission_percent)}%</strong></>
            )}
          </p>
        </div>
        <button onClick={logout} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>

      {/* Balance card */}
      <div className="mb-4 rounded-2xl p-5" style={{ background: "#111", color: "#fff" }}>
        <p className="mb-1 text-xs opacity-60">Saldo a receber via PIX</p>
        <p className="text-3xl font-bold" style={{ color: TS_LIME }}>{formatBRL(pending)}</p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="min-w-0">
            <p className="text-xs opacity-60">Chave PIX cadastrada</p>
            <p className="mt-0.5 truncate font-mono text-sm">{pixKey || "Não cadastrada"}</p>
          </div>
          <button
            type="button"
            onClick={() => { setNewPixKey(pixKey ?? ""); setEditingPix(true); }}
            className="shrink-0 rounded-lg border border-white/30 px-3 py-1.5 text-xs"
          >
            {pixKey ? "Alterar" : "Cadastrar"}
          </button>
        </div>
      </div>

      {editingPix && (
        <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">Sua chave PIX</p>
          <input
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            value={newPixKey}
            onChange={(e) => setNewPixKey(e.target.value)}
            className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditingPix(false)} className="flex-1 rounded-lg border border-border py-2 text-sm text-foreground">
              Cancelar
            </button>
            <button
              type="button"
              onClick={savePixKey}
              disabled={savingPix}
              className="flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: "#111", color: "#fff" }}
            >
              {savingPix ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Vendas" value={String(sales.filter((s) => s.level === 1).length)} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Total vendido" value={formatBRL(totalSold)} />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Comissão pendente" value={formatBRL(pending)} accent />
        <Metric icon={<Users className="h-4 w-4" />} label="Comissão paga" value={formatBRL(paid)} />
      </div>

      {/* Payments history */}
      <div className="mb-4 rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Histórico de recebimentos</h3>
        {payments.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">Nenhum pagamento recebido ainda.</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
              <div>
                <p className="font-medium text-foreground">PIX recebido</p>
                <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString("pt-BR")}</p>
                {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
              </div>
              <span className="font-bold text-[#1fb857]">+ {formatBRL(Number(p.amount))}</span>
            </div>
          ))
        )}
      </div>

      {/* Links */}
      <div className="mb-4 rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Meus links de afiliado</h3>
        <LinkRow label="Link da loja completa:" url={affiliateStoreUrl(store.slug, affiliate.affiliate_slug)} onCopy={copy} />
        <LinkRow label="Link para recrutar afiliados:" url={affiliateRecruitUrl(store.slug, affiliate.affiliate_slug)} onCopy={copy} />
        <p className="mt-3 text-xs text-muted-foreground">
          💡 Navegue pela{" "}
          <Link
            to="/loja/$slug"
            params={{ slug: store.slug }}
            className="font-semibold text-[#111] underline decoration-2 underline-offset-2"
            style={{ textDecorationColor: TS_LIME }}
          >loja</Link>{" "}
          logado e use o botão <strong>Compartilhar</strong> em qualquer produto para copiar seu link personalizado.
        </p>
      </div>

      {/* Sales */}
      <div className="mb-4 rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Vendas e comissões</h3>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda. Compartilhe seus links! 🚀</p>
        ) : (
          <div className="divide-y divide-border">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {s.customer_name || "Cliente"}{" "}
                    {s.level === 2 && (
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        indicação{s.source_name ? `: ${s.source_name}` : ""}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")} · Pedido {formatBRL(Number(s.order_total))}
                    {Array.isArray(s.items) && s.items.length > 0 && ` · ${s.items.length} item(ns)`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold" style={{ color: TS_LIME }}>+{formatBRL(Number(s.commission_amount))}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{s.status === "paid" ? "Paga" : s.status === "cancelled" ? "Cancelada" : "Pendente"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referrals */}
      <div className="rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Afiliados que você indicou ({referrals.length})</h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Compartilhe o link de recrutamento e ganhe comissão sobre as vendas dos seus indicados.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {referrals.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span className="text-foreground">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.affiliate_slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <p className={accent ? "text-lg font-bold" : "text-lg font-bold text-foreground"} style={accent ? { color: TS_LIME } : undefined}>{value}</p>
    </div>
  );
}

function LinkRow({ label, url, onCopy }: { label: string; url: string; onCopy: (u: string) => void }) {
  return (
    <div className="mb-2 rounded-lg bg-muted/50 p-3 last:mb-0">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-foreground">{url}</code>
        <button onClick={() => onCopy(url)} className="flex shrink-0 items-center gap-1 text-xs font-semibold" style={{ color: TS_LIME }}>
          <Copy className="h-3 w-3" /> Copiar
        </button>
      </div>
    </div>
  );
}
