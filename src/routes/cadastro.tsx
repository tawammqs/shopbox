import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, createCheckoutSession } from "@/lib/stripe";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { SEGMENT_GROUPS } from "@/lib/segments";
import { Eye, EyeOff, Check, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Crie sua loja grátis — ShopBox" },
      { name: "description", content: "Crie sua conta e sua loja em minutos. 7 dias grátis para testar." },
      { property: "og:title", content: "Crie sua loja grátis — ShopBox" },
      { property: "og:description", content: "Cadastro rápido em 3 passos. Sem cartão para começar." },
    ],
  }),
  component: SignupPage,
});

const accountSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(80),
    email: z.string().trim().email("E-mail inválido").max(120),
    password: z.string().min(8, "Mínimo 8 caracteres").max(120),
    confirm: z.string().min(8, "Confirme a senha"),
    storeName: z.string().trim().min(2, "Nome da loja obrigatório").max(60),
    segment: z.string().min(1, "Escolha um segmento"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem",
  });

type AccountForm = z.infer<typeof accountSchema>;

type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  stripe_price_id: string | null;
  features: string[];
};

const PLAN_TAGLINES: Record<string, string> = {
  inicial: "Para quem está começando",
  profissional: "Para quem quer vender mais",
  premium: "Para uma loja completa e profissional",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountData, setAccountData] = useState<AccountForm | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [storeSlug, setStoreSlug] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "", email: "", password: "", confirm: "",
      storeName: "", segment: "",
    },
    mode: "onChange",
  });

  const { data: plans } = useQuery({
    queryKey: ["plans-signup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, slug, name, price_cents, stripe_price_id, features")
        .eq("active", true)
        .in("slug", ["inicial", "profissional", "premium"])
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId) ?? null;

  async function onAccountSubmit(values: AccountForm) {
    setSubmitting(true);
    const baseSlug = slugify(values.storeName);
    let candidate = baseSlug;
    let attempt = 0;
    while (attempt < 10) {
      const { data: existing } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      candidate = `${baseSlug}-${attempt + 1}`;
    }
    setStoreSlug(candidate);
    setAccountData(values);
    setStep(2);
    setSubmitting(false);
  }

  async function handleCreateStore() {
    if (!accountData || !selectedPlan) return;
    if (!selectedPlan.stripe_price_id) {
      toast.error("Plano sem preço configurado. Tente outro.");
      return;
    }
    setSubmitting(true);
    try {
      // 1) Sign up user (auto-confirm habilitado no auth — não precisa de email)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: { full_name: accountData.name },
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });
      if (signUpError || !signUpData.user) {
        if (signUpError?.message?.toLowerCase().includes("already")) {
          toast.error("Esse e-mail já está cadastrado. Tente entrar.");
        } else {
          toast.error(signUpError?.message || "Erro ao criar conta");
        }
        return;
      }
      const userId = signUpData.user.id;

      // 2) Sign in (garante sessão ativa para o INSERT passar pela RLS)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: accountData.email,
        password: accountData.password,
      });
      if (signInError || !signInData.session) {
        toast.error("Conta criada, mas erro ao iniciar sessão. Tente entrar.");
        navigate({ to: "/login" });
        return;
      }

      // 3) Create store as INCOMPLETE — webhook will activate after payment confirms
      const { error: storeError } = await supabase.from("stores").insert({
        owner_user_id: userId,
        name: accountData.storeName,
        slug: storeSlug,
        segment: accountData.segment,
        plan_id: selectedPlan.id,
        subscription_status: "incomplete",
        active: false,
        whatsapp: "",
      });
      if (storeError) {
        console.error("Store insert error:", storeError);
        toast.error("Erro ao criar loja: " + storeError.message);
        return;
      }

      // 4) Create checkout session with 7-day trial
      const secret = await createCheckoutSession({
        priceId: selectedPlan.stripe_price_id,
        customerEmail: accountData.email,
        userId,
        trialPeriodDays: 7,
        returnUrl: `${window.location.origin}/admin/dashboard?checkout=success`,
      });
      setClientSecret(secret);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]" style={{ fontFamily: "var(--font-marketing-body)" }}>
      <PaymentTestModeBanner />

      {/* Top bar */}
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
            ShopBox
          </Link>
          <Link to="/login" className="text-sm font-medium text-[#374151] hover:text-[#111827]">
            Já tem conta? Entrar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
        {/* Stepper */}
        <div className="mx-auto mb-10 flex max-w-md items-center">
          {([
            { n: 1, label: "Conta" },
            { n: 2, label: "Plano" },
            { n: 3, label: "Pagamento" },
          ] as const).map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                    step > s.n
                      ? "bg-[#00b7a8] text-white"
                      : step === s.n
                        ? "bg-[#111827] text-white"
                        : "border-2 border-[#e5e7eb] bg-white text-[#9ca3af]"
                  }`}
                >
                  {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span className={`mt-2 text-xs font-medium ${step >= s.n ? "text-[#111827]" : "text-[#9ca3af]"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`mb-6 h-0.5 flex-1 transition ${step > s.n ? "bg-[#00b7a8]" : "bg-[#e5e7eb]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Account */}
        {step === 1 && (
          <form
            onSubmit={form.handleSubmit(onAccountSubmit)}
            className="space-y-5 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm md:p-8"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                Vamos criar sua conta
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">Preencha seus dados e os da loja.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    {...form.register("password")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280]"
                    aria-label="Mostrar senha"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    {...form.register("confirm")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280]"
                    aria-label="Mostrar senha"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirm && (
                  <p className="text-xs text-red-600">{form.formState.errors.confirm.message}</p>
                )}
              </div>
            </div>

            <div className="border-t border-[#e5e7eb] pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName">Nome da loja</Label>
                <Input id="storeName" {...form.register("storeName")} placeholder="Ex: Bella Acessórios" />
                {form.formState.errors.storeName && (
                  <p className="text-xs text-red-600">{form.formState.errors.storeName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="segment">Segmento da loja</Label>
                <Select
                  value={form.watch("segment")}
                  onValueChange={(v) => form.setValue("segment", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="segment">
                    <SelectValue placeholder="Escolha um segmento" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {SEGMENT_GROUPS.map((g) => (
                      <SelectGroup key={g.label}>
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.items.map((it) => (
                          <SelectItem key={it} value={it}>{it}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.segment && (
                  <p className="text-xs text-red-600">{form.formState.errors.segment.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full bg-[#00b7a8] text-white hover:bg-[#009b8e]"
              disabled={!form.formState.isValid || submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Próximo →"}
            </Button>
          </form>
        )}

        {/* STEP 2 — Plan */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                Escolha seu plano
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Você terá 7 dias grátis para testar tudo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {plans?.map((plan) => {
                const selected = selectedPlanId === plan.id;
                const isPopular = plan.slug === "profissional";
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative flex flex-col rounded-2xl bg-white p-6 text-left transition ${
                      selected
                        ? "border-2 border-[#00b7a8] shadow-lg ring-2 ring-[#00b7a8]/20"
                        : "border border-[#e5e7eb] hover:border-[#00b7a8]/50"
                    }`}
                  >
                    {isPopular && !selected && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#111827] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        Mais Popular
                      </span>
                    )}
                    {selected && (
                      <span className="absolute -top-3 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#00b7a8] text-white shadow">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#6b7280]">{PLAN_TAGLINES[plan.slug]}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                        R${(plan.price_cents / 100).toFixed(0)}
                      </span>
                      <span className="text-sm text-[#6b7280]">/mês</span>
                    </div>
                    <ul className="mt-4 flex-1 space-y-2 text-xs text-[#374151]">
                      {plan.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#00b7a8]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#6b7280] hover:text-[#111827]"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <Button
                size="lg"
                className="rounded-full bg-[#00b7a8] text-white hover:bg-[#009b8e]"
                disabled={!selectedPlanId}
                onClick={() => setStep(3)}
              >
                Próximo →
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && selectedPlan && accountData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                Finalizar cadastro
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Revise seu plano e confirme para liberar sua loja.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#6b7280]">Plano selecionado</div>
                  <div className="mt-1 text-xl font-bold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                    {selectedPlan.name}
                  </div>
                  <div className="text-sm text-[#6b7280]">{PLAN_TAGLINES[selectedPlan.slug]}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[#111827]" style={{ fontFamily: "var(--font-marketing)" }}>
                    R${(selectedPlan.price_cents / 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-[#6b7280]">/mês · 7 dias grátis</div>
                </div>
              </div>
              <div className="mt-4 border-t border-[#e5e7eb] pt-4 text-sm text-[#6b7280]">
                Loja: <span className="font-medium text-[#111827]">{accountData.storeName}</span> ·
                URL: <span className="font-mono text-xs">shopbox.app/loja/{storeSlug}</span>
              </div>
            </div>

            {!clientSecret ? (
              <>
                <div className="rounded-xl bg-[#e6f8f6] p-4 text-xs text-[#00857a]">
                  💳 Pagamento processado com segurança via Stripe. PIX também disponível em breve.
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#6b7280] hover:text-[#111827]"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <Button
                    size="lg"
                    onClick={handleCreateStore}
                    disabled={submitting}
                    className="rounded-full bg-[#00b7a8] text-white hover:bg-[#009b8e]"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando sua loja...</>
                    ) : (
                      "Criar minha loja →"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-sm">
                <EmbeddedCheckoutProvider
                  stripe={getStripe()}
                  options={{ fetchClientSecret: () => Promise.resolve(clientSecret) }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
