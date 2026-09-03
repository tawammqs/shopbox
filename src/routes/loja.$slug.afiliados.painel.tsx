import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  useAffiliateSession,
  type AffiliateSale,
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
  const { affiliate } = useAffiliateSession(store.id);
  const [checked, setChecked] = useState(false);

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
  const sales: AffiliateSale[] = data?.sales ?? [];
  const totalSold = sales.filter((s) => s.level === 1).reduce((a, s) => a + Number(s.order_total), 0);
  const pending = sales.filter((s) => s.status === "pending").reduce((a, s) => a + Number(s.commission_amount), 0);
  const paid = sales.filter((s) => s.status === "paid").reduce((a, s) => a + Number(s.commission_amount), 0);
  const referrals = data?.referrals ?? [];

  const copy = async (url: string) => {
    const ok = await copyToClipboard(url);
    ok ? toast.success("Link copiado! 🔗") : toast.error("Não foi possível copiar");
  };

  const logout = () => {
    clearAffiliateSession();
    navigate({ to: "/loja/$slug", params: { slug: store.slug } });
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

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Vendas" value={String(sales.filter((s) => s.level === 1).length)} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Total vendido" value={formatBRL(totalSold)} />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Comissão pendente" value={formatBRL(pending)} accent />
        <Metric icon={<Users className="h-4 w-4" />} label="Comissão paga" value={formatBRL(paid)} />
      </div>

      {/* Links */}
      <div className="mb-4 rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Meus links de afiliado</h3>
        <LinkRow label="Link da loja completa:" url={affiliateStoreUrl(store.slug, affiliate.affiliate_slug)} onCopy={copy} />
        <LinkRow label="Link para recrutar afiliados:" url={affiliateRecruitUrl(store.slug, affiliate.affiliate_slug)} onCopy={copy} />
        <p className="mt-3 text-xs text-muted-foreground">
          💡 Navegue pela{" "}
          <Link to="/loja/$slug" params={{ slug: store.slug }} className="text-[#25d366] underline">loja</Link>{" "}
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
                  <p className="font-bold text-[#25d366]">+{formatBRL(Number(s.commission_amount))}</p>
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
      <p className={accent ? "text-lg font-bold text-[#25d366]" : "text-lg font-bold text-foreground"}>{value}</p>
    </div>
  );
}

function LinkRow({ label, url, onCopy }: { label: string; url: string; onCopy: (u: string) => void }) {
  return (
    <div className="mb-2 rounded-lg bg-muted/50 p-3 last:mb-0">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-foreground">{url}</code>
        <button onClick={() => onCopy(url)} className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#25d366]">
          <Copy className="h-3 w-3" /> Copiar
        </button>
      </div>
    </div>
  );
}
