import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import { affiliateInputCls as inputCls } from "@/components/storefront/AffiliateShare";
import { loginAffiliate, saveAffiliateSession, TS_LIME } from "@/lib/affiliates";

export const Route = createFileRoute("/loja/$slug/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar na loja — Cliente ou Afiliado" },
      { name: "description", content: "Escolha como quer acessar: acompanhe seus pedidos como cliente ou entre na área do afiliado para ver links, vendas e comissões." },
      { property: "og:title", content: "Entrar na loja" },
      { property: "og:description", content: "Acesse como cliente ou como afiliado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorefrontLoginPage,
});

type Mode = "choose" | "client" | "affiliate";

function StorefrontLoginPage() {
  const { store } = useStorefront();
  const [mode, setMode] = useState<Mode>("choose");

  const logo = store.logo_url ? (
    <img src={store.logo_url} alt={store.name} className="mx-auto mb-6 h-10 object-contain" />
  ) : (
    <p className="mb-6 text-center text-lg font-extrabold text-foreground">{store.name}</p>
  );

  if (mode === "affiliate") return <AffiliateLoginForm onBack={() => setMode("choose")} logo={logo} />;
  if (mode === "client") return <ClientAccess onBack={() => setMode("choose")} logo={logo} />;

  return (
    <div className="mx-auto max-w-sm px-4 py-10 text-center">
      {logo}
      <h1 className="text-xl font-bold text-foreground">Entrar</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">Como você quer acessar?</p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMode("client")}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-left transition hover:border-foreground/30"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-2xl">🛍️</div>
          <div>
            <p className="font-semibold text-foreground">Sou cliente</p>
            <p className="text-xs text-muted-foreground">Acompanhe seus pedidos e favoritos</p>
          </div>
        </button>

        {store.affiliates_enabled && (
          <button
            type="button"
            onClick={() => setMode("affiliate")}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-border p-4 text-left transition hover:border-foreground/30"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl" style={{ backgroundColor: TS_LIME }}>
              💰
            </div>
            <div>
              <p className="font-semibold text-foreground">Sou afiliado</p>
              <p className="text-xs text-muted-foreground">Acesse seus links, vendas e comissões</p>
            </div>
          </button>
        )}
      </div>

      {store.affiliates_enabled && (
        <p className="mt-6 text-xs text-muted-foreground">
          Quer ser afiliado?{" "}
          <Link to="/loja/$slug/afiliados" params={{ slug: store.slug }} className="font-semibold text-foreground underline decoration-2 underline-offset-2" style={{ textDecorationColor: TS_LIME }}>
            Saiba mais
          </Link>
        </p>
      )}
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="mb-4 text-xs font-semibold text-muted-foreground hover:text-foreground">
      ← Voltar
    </button>
  );
}

function ClientAccess({ onBack, logo }: { onBack: () => void; logo: React.ReactNode }) {
  const { store } = useStorefront();
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <BackButton onBack={onBack} />
      <div className="text-center">{logo}</div>
      <h1 className="text-center text-xl font-bold text-foreground">Área do cliente</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Suas compras são feitas pelo WhatsApp, então não é preciso criar conta.
      </p>
      <div className="mt-6 space-y-3">
        <Link
          to="/loja/$slug/rastreio"
          params={{ slug: store.slug }}
          className="block rounded-xl py-3 text-center font-bold"
          style={{ backgroundColor: TS_LIME, color: "#111827" }}
        >
          Rastrear meu pedido
        </Link>
        <Link
          to="/loja/$slug/wishlist"
          params={{ slug: store.slug }}
          className="block rounded-xl border border-border py-3 text-center text-sm font-semibold text-foreground"
        >
          Meus favoritos
        </Link>
      </div>
    </div>
  );
}

function AffiliateLoginForm({ onBack, logo }: { onBack: () => void; logo: React.ReactNode }) {
  const { store } = useStorefront();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      <BackButton onBack={onBack} />
      <div className="text-center">{logo}</div>
      <h1 className="text-center text-xl font-bold text-foreground">Área do Afiliado</h1>
      <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">Entre com seu email e senha</p>
      <form onSubmit={handleLogin} className="space-y-3">
        <input className={inputCls} type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-xl py-3 font-bold disabled:opacity-40"
          style={{ backgroundColor: TS_LIME, color: "#111827" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Ainda não é afiliado?{" "}
        <Link to="/loja/$slug/afiliados/cadastro" params={{ slug: store.slug }} className="font-semibold text-foreground underline decoration-2 underline-offset-2" style={{ textDecorationColor: TS_LIME }}>
          Cadastre-se aqui
        </Link>
      </p>
    </div>
  );
}
