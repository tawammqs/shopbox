import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useMyStore";
import { formatBRL } from "@/lib/format";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { toast } from "sonner";

export const Route = createFileRoute("/temas/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Tema ${params.slug} — ShopBox` },
      { name: "description", content: "Detalhes e preview do tema." },
    ],
  }),
  component: ThemeDetailPage,
});

type ThemeFull = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_cents: number;
  is_free: boolean;
  preview_desktop_url: string | null;
  carousel_urls: string[];
  features: string[];
  demo_url: string | null;
};

function ThemeDetailPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { data: store } = useMyStore();
  const navigate = useNavigate();

  const themeQ = useQuery({
    queryKey: ["theme", slug],
    queryFn: async (): Promise<ThemeFull> => {
      const { data, error } = await supabase
        .from("themes")
        .select(
          "id, slug, name, tagline, description, price_cents, is_free, preview_desktop_url, carousel_urls, features, demo_url",
        )
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return {
        ...data,
        features: Array.isArray(data.features) ? (data.features as string[]) : [],
        carousel_urls: Array.isArray(data.carousel_urls)
          ? (data.carousel_urls as string[])
          : [],
      };
    },
  });

  const purchaseQ = useQuery({
    queryKey: ["theme-purchase", store?.id, themeQ.data?.id],
    enabled: !!store?.id && !!themeQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("theme_purchases")
        .select("id, status")
        .eq("store_id", store!.id)
        .eq("theme_id", themeQ.data!.id)
        .maybeSingle();
      return data;
    },
  });

  const isOwned =
    themeQ.data?.is_free || purchaseQ.data?.status === "completed";

  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const applyMut = useMutation({
    mutationFn: async () => {
      if (!store || !themeQ.data) return;
      const { error } = await (supabase as any)
        .from("store_theme_settings")
        .upsert(
          { store_id: store.id, active_theme_id: themeQ.data.id },
          { onConflict: "store_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tema aplicado! Sua loja já está com o novo visual.");
      if (store?.slug) window.open(`/loja/${store.slug}`, "_blank");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao aplicar tema"),
  });

  const startPurchase = useCallback(async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!store || !themeQ.data) return;
    if (themeQ.data.is_free) {
      applyMut.mutate();
      return;
    }
    if (isOwned) {
      applyMut.mutate();
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-theme-checkout",
        {
          body: {
            themeId: themeQ.data.id,
            storeId: store.id,
            environment: getStripeEnvironment(),
            returnUrl: `${window.location.origin}/temas/${themeQ.data.slug}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
          },
        },
      );
      if (error) throw error;
      if (data?.free) {
        applyMut.mutate();
        return;
      }
      if (!data?.clientSecret) throw new Error("Falha ao iniciar pagamento");
      setCheckoutSecret(data.clientSecret);
      setCheckoutOpen(true);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar pagamento");
    }
  }, [user, store, themeQ.data, isOwned, applyMut, navigate]);

  if (themeQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!themeQ.data) return null;
  const t = themeQ.data;
  const price = t.price_cents / 100;
  const carousel = t.carousel_urls.length
    ? t.carousel_urls
    : t.preview_desktop_url
      ? [t.preview_desktop_url]
      : [];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/temas"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} /> Voltar ao marketplace
        </Link>

        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          {/* Preview column */}
          <div>
            <PreviewCarousel images={carousel} themeName={t.name} />
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div
              className="rounded-2xl bg-white p-7"
              style={{ border: "1px solid #e8e8e8" }}
            >
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#111",
                  lineHeight: 1.15,
                  margin: 0,
                  marginBottom: 10,
                }}
              >
                {t.name}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "#666",
                  lineHeight: 1.75,
                  margin: 0,
                  marginBottom: 24,
                }}
              >
                {t.description ?? t.tagline}
              </p>

              <div style={{ marginBottom: 20 }}>
                {t.is_free ? (
                  <p
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "#25D366",
                      margin: 0,
                    }}
                  >
                    Gratuito
                  </p>
                ) : (
                  <>
                    <p
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: "#111",
                        margin: 0,
                      }}
                    >
                      {formatBRL(price)}
                    </p>
                    <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
                      pagamento único · acesso vitalício
                    </p>
                  </>
                )}
              </div>

              <Button
                onClick={startPurchase}
                disabled={applyMut.isPending}
                className="h-14 w-full text-base font-semibold"
                style={{
                  background: isOwned || t.is_free ? "#25D366" : "#0f0f0f",
                  color: "#fff",
                }}
              >
                {applyMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : t.is_free ? (
                  "Aplicar tema gratuitamente"
                ) : isOwned ? (
                  "Aplicar tema"
                ) : (
                  `Comprar por ${formatBRL(price)}`
                )}
              </Button>

              <p
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                ✓ Acesso vitalício · ✓ Suporte incluído · ✓ Atualizações gratuitas
              </p>

              {!user && (
                <p className="mt-4 rounded-lg bg-[#f8f8f8] p-3 text-center text-xs text-muted-foreground">
                  Você precisa estar logado para adquirir um tema.{" "}
                  <Link to="/login" className="font-semibold text-foreground underline">
                    Entrar
                  </Link>
                </p>
              )}

              <div className="mt-6 border-t pt-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#111]">
                  O que está incluído
                </h3>
                <ul className="space-y-2">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#444]">
                      <Check
                        size={16}
                        strokeWidth={3}
                        color="#25D366"
                        className="mt-0.5 shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Embedded Stripe checkout */}
      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          setCheckoutOpen(open);
          if (!open) setCheckoutSecret(null);
        }}
      >
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="px-6 pb-2 pt-6">
            <DialogTitle>Finalizar compra — {t.name}</DialogTitle>
          </DialogHeader>
          <div className="px-2 pb-2">
            {checkoutSecret && (
              <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={{ fetchClientSecret: () => Promise.resolve(checkoutSecret) }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewCarousel({
  images,
  themeName,
}: {
  images: string[];
  themeName: string;
}) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) {
    return (
      <div
        className="flex h-[480px] items-center justify-center rounded-2xl text-white"
        style={{
          background: "linear-gradient(135deg, #25D366 0%, #0f0f0f 100%)",
        }}
      >
        <span className="text-2xl font-bold opacity-60">{themeName}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 10",
          background: `#0f0f0f url(${images[idx]}) center/cover no-repeat`,
          border: "1px solid #e8e8e8",
        }}
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="shrink-0 overflow-hidden rounded-md"
              style={{
                width: 96,
                height: 64,
                background: `#eee url(${src}) center/cover no-repeat`,
                border: i === idx ? "2px solid #0f0f0f" : "2px solid transparent",
              }}
              aria-label={`Preview ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
