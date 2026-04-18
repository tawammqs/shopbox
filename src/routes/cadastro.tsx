import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, createCheckoutSession } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Comece grátis — ShopBox" },
      { name: "description", content: "Crie sua conta e sua loja em minutos." },
    ],
  }),
  component: SignupPage,
});

const SEGMENTS = [
  "Moda Feminina",
  "Moda Masculina",
  "Moda Infantil",
  "Calçados",
  "Acessórios",
  "Beleza e Cosméticos",
  "Casa e Decoração",
  "Outros",
];

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  stripe_price_id: string | null;
  features: string[];
};

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    storeSlug: "",
    segment: SEGMENTS[0],
  });
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, slug, name, price_cents, stripe_price_id, features")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (!form.storeSlug || form.storeSlug.length < 3) {
      toast.error("URL da loja inválida");
      return;
    }
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", form.storeSlug)
      .maybeSingle();
    if (existing) {
      toast.error("Essa URL de loja já está em uso. Escolha outra.");
      return;
    }
    setStep(2);
  }

  async function handleSelectPlan(plan: Plan) {
    if (!plan.stripe_price_id) {
      toast.error("Plano sem preço configurado");
      return;
    }
    setSelectedPlan(plan);
    setSubmitting(true);

    // 1) Create the auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/painel`,
      },
    });
    if (signUpError || !signUpData.user) {
      setSubmitting(false);
      toast.error(signUpError?.message || "Erro ao criar conta");
      return;
    }

    // Sign in to get session (auto-confirm is on)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      setSubmitting(false);
      toast.error("Conta criada, mas erro ao iniciar sessão. Tente entrar.");
      navigate({ to: "/login" });
      return;
    }

    // 2) Create the store
    const { error: storeError } = await supabase.from("stores").insert({
      owner_user_id: signUpData.user.id,
      name: form.storeName,
      slug: form.storeSlug,
      segment: form.segment,
      plan_id: plan.id,
      subscription_status: "trialing",
    });
    if (storeError) {
      setSubmitting(false);
      toast.error("Erro ao criar loja: " + storeError.message);
      return;
    }

    // 3) Create checkout session
    try {
      const secret = await createCheckoutSession({
        priceId: plan.stripe_price_id,
        customerEmail: form.email,
        userId: signUpData.user.id,
        returnUrl: `${window.location.origin}/painel?checkout=success`,
      });
      setClientSecret(secret);
      setStep(3);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="block text-center font-display text-3xl font-bold mb-2">
          ShopBox
        </Link>
        <p className="text-center text-sm text-muted-foreground mb-10">
          Etapa {step} de 3 · {step === 1 ? "Sua conta" : step === 2 ? "Escolha seu plano" : "Pagamento"}
        </p>

        {/* Stepper */}
        <div className="mx-auto mb-10 flex max-w-md items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s <= step
                    ? "bg-foreground text-background"
                    : "border border-border bg-background text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`h-px flex-1 ${s < step ? "bg-foreground" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1} className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha (mínimo 8 caracteres)</Label>
              <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="border-t border-border pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da sua loja</Label>
                <Input
                  id="storeName"
                  required
                  value={form.storeName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, storeName: v, storeSlug: slugify(v) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL da loja</Label>
                <div className="flex items-center rounded-md border border-input bg-background overflow-hidden">
                  <span className="px-3 text-sm text-muted-foreground border-r border-border">shopbox.app/loja/</span>
                  <input
                    id="slug"
                    required
                    minLength={3}
                    value={form.storeSlug}
                    onChange={(e) => setForm({ ...form, storeSlug: slugify(e.target.value) })}
                    className="flex-1 bg-transparent px-3 py-1 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento</Label>
                <select
                  id="segment"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.segment}
                  onChange={(e) => setForm({ ...form, segment: e.target.value })}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Continuar →
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="underline">Entrar</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-3">
            {plans?.map((plan) => {
              const highlighted = plan.slug === "profissional";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col ${
                    highlighted ? "border-foreground ring-2 ring-foreground" : "border-border"
                  }`}
                >
                  {highlighted && (
                    <span className="self-start mb-3 inline-block rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
                      Mais popular
                    </span>
                  )}
                  <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="font-display text-3xl font-bold">
                      R$ {(plan.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {plan.features.slice(0, 6).map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={submitting}
                    className="mt-6 w-full"
                    variant={highlighted ? "default" : "outline"}
                  >
                    {submitting && selectedPlan?.id === plan.id ? "Preparando..." : "Escolher"}
                  </Button>
                </div>
              );
            })}
            <div className="md:col-span-3 text-center">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">
                ← Voltar
              </button>
            </div>
          </div>
        )}

        {step === 3 && clientSecret && (
          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm overflow-hidden">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret: () => Promise.resolve(clientSecret) }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
