import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Star, Download, Check, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { formatBRL } from "@/lib/themes";
import { toast } from "sonner";

export const Route = createFileRoute("/temas/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("themes").select("*").eq("slug", params.slug).eq("status", "approved").maybeSingle();
    return { theme: data };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.theme;
    if (!t) return { meta: [{ title: "Tema — Shopbox" }] };
    return {
      meta: [
        { title: `${t.name} — Tema Shopbox` },
        { name: "description", content: t.tagline ?? `Tema ${t.name} para sua loja` },
        { property: "og:title", content: `${t.name} — Tema Shopbox` },
        { property: "og:description", content: t.tagline ?? "" },
        ...(t.preview_desktop_url ? [{ property: "og:image", content: t.preview_desktop_url }] : []),
      ],
    };
  },
  component: ThemeDetailPage,
  notFoundComponent: () => <div className="p-12 text-center">Tema não encontrado.</div>,
});

function ThemeDetailPage() {
  const { theme } = Route.useLoaderData() as { theme: any };
  const { user } = useAuth();
  const { data: store } = useMyStore();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const ownedQ = useQuery({
    queryKey: ["theme-owned", store?.id, theme?.id],
    enabled: !!store && !!theme,
    queryFn: async () => {
      const { data } = await supabase.from("theme_purchases").select("status").eq("store_id", store!.id).eq("theme_id", theme.id).maybeSingle();
      return data?.status === "completed" || theme.is_free;
    },
  });

  if (!theme) return <div className="p-12 text-center">Tema não encontrado.</div>;

  const carousel: string[] = Array.isArray(theme.carousel_urls) ? theme.carousel_urls : [];
  const heroImg = carousel[activeImg] ?? theme.preview_desktop_url;
  const c = theme.tokens?.colors ?? {};

  async function handleBuy() {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!store) { toast.error("Você precisa ter uma loja para comprar temas"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-theme-checkout", {
        body: { themeId: theme.id, storeId: store.id, environment: getStripeEnvironment() },
      });
      if (error) throw error;
      if (data?.free) {
        toast.success("Tema desbloqueado!");
        navigate({ to: "/admin/temas" });
        return;
      }
      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setCheckoutOpen(true);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar compra");
    } finally {
      setLoading(false);
    }
  }

  const owned = ownedQ.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link to="/temas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para temas
        </Link>
      </div>

      <div className="container mx-auto grid gap-10 px-4 pb-16 lg:grid-cols-[1.4fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border" style={{ background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}22)` }}>
            {heroImg ? (
              <img src={heroImg} alt={theme.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-20 w-32 rounded-lg" style={{ background: c.primary }} />
                  <p className="font-display text-2xl font-bold" style={{ color: c.primary, fontFamily: theme.tokens?.fonts?.display }}>{theme.name}</p>
                </div>
              </div>
            )}
          </div>
          {carousel.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {carousel.map((url, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-primary" : "border-border"}`}>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + CTA */}
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {theme.segment_tags.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              {theme.style_tags.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
            <h1 className="font-display text-4xl font-bold">{theme.name}</h1>
            {theme.tagline && <p className="mt-2 text-lg text-muted-foreground">{theme.tagline}</p>}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {theme.rating_avg.toFixed(1)} ({theme.rating_count} avaliações)</span>
              <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {theme.install_count} instalações</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-baseline gap-2">
              {theme.is_free ? (
                <span className="font-display text-3xl font-bold text-emerald-600">Gratuito</span>
              ) : (
                <span className="font-display text-3xl font-bold">{formatBRL(theme.price_cents)}</span>
              )}
              {!theme.is_free && <span className="text-sm text-muted-foreground">pagamento único</span>}
            </div>
            {owned ? (
              <Button asChild className="w-full" size="lg">
                <Link to="/admin/temas">Já desbloqueado — ir para meus temas</Link>
              </Button>
            ) : (
              <Button onClick={handleBuy} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : theme.is_free ? "Adicionar gratuitamente" : `Comprar — ${formatBRL(theme.price_cents)}`}
              </Button>
            )}
            {theme.demo_url && (
              <Button asChild variant="outline" className="mt-2 w-full">
                <a href={theme.demo_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" /> Ver demo ao vivo</a>
              </Button>
            )}
          </div>

          {theme.description && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-2 font-display text-lg font-bold">Sobre este tema</h2>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
            </div>
          )}

          {Array.isArray(theme.features) && theme.features.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">O que está incluído</h2>
              <ul className="space-y-2">
                {(theme.features as string[]).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl p-0">
          {clientSecret && (
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret: async () => clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
