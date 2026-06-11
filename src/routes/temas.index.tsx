import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/temas/")({
  head: () => ({
    meta: [
      { title: "Marketplace de Temas — ShopBox" },
      {
        name: "description",
        content:
          "Escolha o visual perfeito para sua loja. Troque com 1 clique. Temas gratuitos e premium feitos para vender mais.",
      },
      { property: "og:title", content: "Marketplace de Temas — ShopBox" },
      {
        property: "og:description",
        content: "Temas profissionais para sua loja. Troque com 1 clique.",
      },
    ],
  }),
  component: ThemesMarketplacePage,
});

type ThemeRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price_cents: number;
  is_free: boolean;
  preview_desktop_url: string | null;
  features: string[];
  display_order: number | null;
};

function ThemesMarketplacePage() {
  const themes = useQuery({
    queryKey: ["themes-marketplace"],
    queryFn: async (): Promise<ThemeRow[]> => {
      const { data, error } = await supabase
        .from("themes")
        .select(
          "id, slug, name, tagline, description, price_cents, is_free, preview_desktop_url, features, display_order",
        )
        .eq("status", "approved")
        .in("slug", ["default", "mio-style"])
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        ...t,
        features: Array.isArray(t.features) ? (t.features as string[]) : [],
      }));
    },
  });

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header
        style={{
          background: "#0f0f0f",
          padding: "80px 40px",
          color: "#fff",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = "/admin/temas"; }}
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            ← Voltar
          </button>
          <h1
            style={{
              fontFamily: "'DM Sans', Inter, sans-serif",
              fontSize: "clamp(34px, 6vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Marketplace de Temas
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "#888",
              marginTop: 12,
              maxWidth: 620,
            }}
          >
            Escolha o visual perfeito para sua loja. Troque com 1 clique.
          </p>
          <p style={{ fontSize: 13, color: "#666", marginTop: 16 }}>
            {(themes.data?.length ?? 0)} temas disponíveis · +12.000 lojas · Suporte
            incluído
          </p>
        </div>
      </header>

      {/* Grid */}
      <section style={{ padding: "64px 40px" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
          {themes.isLoading && (
            <>
              <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
              <div className="h-[520px] animate-pulse rounded-2xl bg-white" />
            </>
          )}
          {themes.data?.map((t) => (
            <ThemeCard key={t.id} theme={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ theme }: { theme: ThemeRow }) {
  const features = theme.features.slice(0, 5);
  const extra = theme.features.length - features.length;
  const price = theme.price_cents / 100;

  return (
    <div
      className="group overflow-hidden bg-white transition-transform hover:-translate-y-1"
      style={{
        borderRadius: 16,
        border: "1px solid #e8e8e8",
      }}
    >
      {/* Preview */}
      <div
        className="relative"
        style={{
          height: 280,
          background: theme.preview_desktop_url
            ? `#0f0f0f url(${theme.preview_desktop_url}) center/cover no-repeat`
            : "linear-gradient(135deg, #25D366 0%, #0f0f0f 100%)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: theme.is_free ? "#25D366" : "#0f0f0f",
            color: "#fff",
            fontSize: theme.is_free ? 11 : 13,
            fontWeight: 700,
            padding: "8px 14px",
            borderRadius: "0 0 0 10px",
            letterSpacing: theme.is_free ? "0.5px" : "0",
          }}
        >
          {theme.is_free ? "GRATUITO" : formatBRL(price)}
        </span>
        <Link
          to="/temas/$slug"
          params={{ slug: theme.slug }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            borderRadius: 9999,
            padding: "10px 24px",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ver preview
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: 24 }}>
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 20,
            fontWeight: 800,
            color: "#111",
            margin: 0,
            marginBottom: 6,
          }}
        >
          {theme.name}
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#666",
            lineHeight: 1.6,
            margin: 0,
            marginBottom: 20,
          }}
        >
          {theme.description ?? theme.tagline}
        </p>

        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {features.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "4px 0",
              }}
            >
              <Check size={14} color="#25D366" strokeWidth={3} />
              <span style={{ fontSize: 13, color: "#444" }}>{f}</span>
            </li>
          ))}
          {extra > 0 && (
            <li style={{ paddingTop: 6 }}>
              <Link
                to="/temas/$slug"
                params={{ slug: theme.slug }}
                style={{
                  fontSize: 13,
                  color: "#0f0f0f",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                + {extra} mais recursos
              </Link>
            </li>
          )}
        </ul>

        <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

        <div className="flex items-center justify-between">
          <div>
            {theme.is_free ? (
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 22,
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
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#111",
                    margin: 0,
                  }}
                >
                  {formatBRL(price)}
                </p>
                <span style={{ fontSize: 12, color: "#aaa", display: "block" }}>
                  pagamento único
                </span>
              </>
            )}
          </div>
          <Link
            to="/temas/$slug"
            params={{ slug: theme.slug }}
            className="inline-flex items-center gap-1"
            style={{
              background: theme.is_free ? "#25D366" : "#0f0f0f",
              color: "#fff",
              borderRadius: 8,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {theme.is_free ? "Aplicar tema" : "Comprar tema"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
