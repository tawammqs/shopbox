import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [{ title: "Recuperar senha — ShopBox" }],
  }),
  component: RecoverPage,
});

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

function RecoverPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const email = await resolveEmail(identifier);
      // Mensagem genérica para evitar enumeração de contas — sucesso
      // independente de a conta existir ou não.
      if (email) {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      }
      setSent(true);
    } catch (err) {
      console.error(err);
      // Mesmo em erro inesperado, mostramos sucesso genérico.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center font-display text-3xl font-bold mb-8">
          ShopBox
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold mb-1">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Informe seu e-mail ou WhatsApp e enviaremos um link para redefinir sua senha.
          </p>
          {sent ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 space-y-2">
              <p className="font-medium">✓ Pronto!</p>
              <p>
                Se houver uma conta cadastrada com <strong>{identifier}</strong>, você receberá um
                e-mail em instantes com o link de redefinição.
              </p>
              <p className="text-xs text-emerald-800/80">
                Não recebeu? Verifique a caixa de spam, ou tente novamente com outro e-mail/WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setIdentifier("");
                }}
                className="text-xs underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">E-mail ou WhatsApp</Label>
                <Input
                  id="identifier"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  required
                  placeholder="seu@email.com ou (11) 99999-9999"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O link é sempre enviado por e-mail. O WhatsApp serve apenas para identificar sua
                  conta.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="hover:underline">
              ← Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
