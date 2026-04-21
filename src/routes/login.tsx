import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — ShopBox" },
      { name: "description", content: "Acesse o painel da sua loja ShopBox." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (redirect && (redirect.startsWith("/superadmin") || redirect.startsWith("/admin"))) {
      toast.info("Faça login para acessar o painel");
    }
  }, [redirect]);

  // Detecta se o que o usuário digitou é um e-mail ou um WhatsApp.
  // E-mail: contém "@". WhatsApp: ao menos 8 dígitos no que foi digitado.
  function looksLikeEmail(value: string) {
    return value.includes("@");
  }

  async function resolveEmail(value: string): Promise<string | null> {
    const trimmed = value.trim();
    if (looksLikeEmail(trimmed)) return trimmed;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 8) return null;
    const { data, error } = await supabase.rpc("email_for_whatsapp", { _whatsapp: digits });
    if (error) {
      console.error("email_for_whatsapp error:", error);
      return null;
    }
    return (data as string | null) ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const email = await resolveEmail(identifier);
    if (!email) {
      setLoading(false);
      toast.error("Nenhuma loja encontrada com esse WhatsApp. Verifique o número ou use seu e-mail.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail/WhatsApp ou senha incorretos" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    if (redirect && redirect.startsWith("/")) {
      window.location.href = redirect;
    } else {
      navigate({ to: "/admin/dashboard" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-display text-3xl font-bold mb-8">
          ShopBox
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold mb-1">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">Acesse o painel da sua loja</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-foreground">
                  Esqueci
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" className="font-medium text-foreground hover:underline">
              Comece grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
