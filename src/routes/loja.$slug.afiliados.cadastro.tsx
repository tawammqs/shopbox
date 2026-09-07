import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import { generateAffiliateSlug, registerAffiliate, saveAffiliateSession, TS_LIME } from "@/lib/affiliates";
import { maskPhoneBR } from "@/lib/masks";
import { affiliateInputCls as inputCls, AffiliateUnavailable as Unavailable } from "@/components/storefront/AffiliateShare";

export const Route = createFileRoute("/loja/$slug/afiliados/cadastro")({
  head: () => ({
    meta: [
      { title: "Seja um afiliado" },
      { name: "description", content: "Cadastre-se como afiliado, compartilhe seu link personalizado e ganhe comissão em cada venda." },
      { property: "og:title", content: "Seja um afiliado" },
      { property: "og:description", content: "Compartilhe seu link e ganhe comissão em cada venda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AffiliateSignupPage,
});

function AffiliateSignupPage() {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", password: "", confirmPassword: "" });
  const [ref, setRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get("ref"));
  }, []);

  if (!store.affiliates_enabled) return <Unavailable slug={store.slug} />;

  const slugPreview = generateAffiliateSlug(form.name);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "whatsapp" ? maskPhoneBR(e.target.value) : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error("Informe seu nome");
    if (form.password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres");
    if (form.password !== form.confirmPassword) return toast.error("As senhas não conferem");
    setLoading(true);
    try {
      const affiliate = await registerAffiliate({
        storeId: store.id,
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
        password: form.password,
        referredBySlug: ref,
      });
      saveAffiliateSession(affiliate);
      toast.success(`Bem-vindo(a), ${affiliate.name}! Seu link: /${affiliate.affiliate_slug}`);
      navigate({ to: "/loja/$slug/afiliados/painel", params: { slug: store.slug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-8 text-center">
        {store.logo_url && <img src={store.logo_url} alt={store.name} className="mx-auto mb-4 h-10 object-contain" />}
        <h1 className="text-xl font-bold text-foreground">Seja um afiliado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ganhe <strong className="text-foreground">{store.affiliate_commission_direct}%</strong> de comissão por cada venda que
          você indicar na {store.name}.
        </p>
        {store.affiliate_commission_referrer > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            E mais {store.affiliate_commission_referrer}% sobre as vendas dos afiliados que você indicar.
          </p>
        )}
        {ref && <p className="mt-2 text-xs font-semibold" style={{ color: TS_LIME }}>Indicado por: {ref}</p>}
      </div>

      {/* Como funciona a comissão (dois níveis) */}
      <div style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 24, textAlign: "left" }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#111827" }}>
          💰 Como funciona sua comissão
        </h3>

        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>
            {store.affiliate_commission_direct}%
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: "#111827" }}>Suas vendas diretas</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
              Você compartilha seu link, alguém compra → você ganha {store.affiliate_commission_direct}% do valor da venda via PIX
            </p>
          </div>
        </div>

        {store.affiliate_commission_referrer > 0 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: TS_LIME, color: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>
              {store.affiliate_commission_referrer}%
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: "#111827" }}>Vendas da sua rede</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
                Você indica alguém para ser afiliado usando seu link → quando essa pessoa vende, você também ganha {store.affiliate_commission_referrer}% de cada venda dela, automaticamente
              </p>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 14, border: "0.5px solid #e5e7eb" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Exemplo prático
          </p>
          <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px" }}>
            🛍️ Você indica um tênis de <strong>R$300</strong> → ganha <strong>R$ {(300 * store.affiliate_commission_direct / 100).toFixed(2).replace(".", ",")}</strong>
          </p>
          {store.affiliate_commission_referrer > 0 && (
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px" }}>
              👥 Você recruta uma amiga como afiliada → ela vende um tênis de <strong>R$300</strong> → você ganha <strong>R$ {(300 * store.affiliate_commission_referrer / 100).toFixed(2).replace(".", ",")}</strong> automaticamente
            </p>
          )}
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            Pagamentos via PIX todo dia 20 do mês
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} placeholder="Seu nome completo" value={form.name} onChange={set("name")} required />
        {slugPreview && (
          <p className="-mt-1 px-1 text-xs text-muted-foreground">
            Seu identificador nos links: <code className="font-semibold text-foreground">{slugPreview}</code>
          </p>
        )}
        <input className={inputCls} type="email" placeholder="Seu e-mail" value={form.email} onChange={set("email")} required />
        <input className={inputCls} placeholder="Seu WhatsApp" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} />
        <input className={inputCls} type="password" placeholder="Crie uma senha" value={form.password} onChange={set("password")} required minLength={6} />
        <input className={inputCls} type="password" placeholder="Confirme a senha" value={form.confirmPassword} onChange={set("confirmPassword")} required />
        <button
          type="submit"
          disabled={loading || !form.name || !form.email || !form.password || !form.confirmPassword}
          className="w-full rounded-xl py-3 font-bold text-[#111] disabled:opacity-40"
          style={{ backgroundColor: TS_LIME }}
        >
          {loading ? "Cadastrando..." : "Criar minha conta de afiliado"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Já é afiliado?{" "}
        <Link
          to="/loja/$slug/afiliados/login"
          params={{ slug: store.slug }}
          className="font-semibold text-[#111] underline decoration-2 underline-offset-2"
          style={{ textDecorationColor: TS_LIME }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
