import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import { loginAffiliate, saveAffiliateSession, TS_LIME } from "@/lib/affiliates";
import { affiliateInputCls as inputCls, AffiliateUnavailable } from "@/components/storefront/AffiliateShare";

export const Route = createFileRoute("/loja/$slug/afiliados/login")({
  head: () => ({
    meta: [
      { title: "Área do Afiliado — Login" },
      { name: "description", content: "Entre com seu email e senha para acessar seus links de afiliado, vendas e comissões." },
      { property: "og:title", content: "Área do Afiliado" },
      { property: "og:description", content: "Acesse seus links, vendas e comissões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AffiliateLoginPage,
});

function AffiliateLoginPage() {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!store.affiliates_enabled) return <AffiliateUnavailable slug={store.slug} />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginAffiliate(store.id, email, password);
      if ("error" in res) {
        toast.error(res.error === "invalid_password" ? "Senha incorreta." : "Email não encontrado.");
        return;
      }
      saveAffiliateSession(res.affiliate);
      toast.success(`Olá, ${res.affiliate.name}!`);
      navigate({ to: "/loja/$slug/afiliados/painel", params: { slug: store.slug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-8 text-center">
        {store.logo_url && <img src={store.logo_url} alt={store.name} className="mx-auto mb-4 h-10 object-contain" />}
        <h1 className="text-xl font-bold text-foreground">Área do Afiliado</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre com seu email e senha</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-3">
        <input className={inputCls} type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-xl py-3 font-bold text-[#111] disabled:opacity-40"
          style={{ backgroundColor: TS_LIME }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Ainda não é afiliado?{" "}
        <Link
          to="/loja/$slug/afiliados/cadastro"
          params={{ slug: store.slug }}
          className="font-semibold text-[#111] underline decoration-2 underline-offset-2"
          style={{ textDecorationColor: TS_LIME }}
        >
          Cadastre-se aqui
        </Link>
      </p>
    </div>
  );
}
