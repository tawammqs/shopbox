import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { maskPhoneBR, onlyDigits } from "@/lib/masks";

export const Route = createFileRoute("/vip/$slug")({
  head: () => ({
    meta: [
      { title: "Grupo VIP — Ofertas exclusivas" },
      { name: "description", content: "Entre no grupo VIP e receba ofertas exclusivas em primeira mão no WhatsApp." },
      { property: "og:title", content: "Grupo VIP — Ofertas exclusivas" },
      { property: "og:description", content: "Entre no grupo VIP e receba ofertas exclusivas em primeira mão no WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VipLanding,
});

// Pixel dedicado à página de captura (por slug de loja)
const LANDING_PIXELS: Record<string, string> = {
  "the-shoes": "27365664036430955",
};

type Cfg = {
  whatsapp_group_link?: string;
  section_title?: string;
  description?: string;
  button_text?: string;
};

function VipLanding() {
  const { slug } = Route.useParams();
  const pixelId = LANDING_PIXELS[slug] ?? null;

  useEffect(() => {
    if (!pixelId) return;
    initPixel(pixelId);
    try {
      window.fbq?.("track", "ViewContent", {
        content_name: "Landing Page Grupo VIP",
        content_category: "VIP Group",
      });
    } catch {
      /* pixel opcional */
    }
  }, [pixelId]);



  const { data, isLoading } = useQuery({
    queryKey: ["vip-landing", slug],
    queryFn: async () => {
      const { data: store, error } = await supabase
        .from("stores")
        .select("id, name, logo_url, accent_color")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!store) return null;
      const { data: addon } = await (supabase as any)
        .from("store_addon_configs")
        .select("config")
        .eq("store_id", store.id)
        .eq("addon_key", "grupo_vip")
        .maybeSingle();
      return { store, cfg: ((addon?.config ?? {}) as Cfg) };
    },
  });

  const [form, setForm] = useState({ name: "", whatsapp: "", city: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dfdac8]">
        <Loader2 className="h-6 w-6 animate-spin text-[#111827]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dfdac8] p-4 text-center">
        <p className="text-sm text-[#111827]">Loja não encontrada.</p>
      </div>
    );
  }

  const { store, cfg } = data;

  const isValid =
    form.name.trim().length >= 2 &&
    onlyDigits(form.whatsapp).length >= 10 &&
    form.city.trim().length >= 2;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");
    const { error: insertError } = await (supabase as any).from("vip_group_leads").insert({
      store_id: store.id,
      name: form.name.trim().slice(0, 100),
      whatsapp: onlyDigits(form.whatsapp),
      city: form.city.trim().slice(0, 100),
      source: "meta_ads",
    });
    setSubmitting(false);
    if (insertError) {
      setError("Não foi possível enviar. Tente novamente.");
      return;
    }
    try {
      (window as any).fbq?.("track", "Lead", {
        content_name: `Grupo VIP ${store.name}`,
        content_category: "VIP Group",
      });
    } catch {
      /* pixel opcional */
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dfdac8] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl">🎉</div>
          <h1 className="mb-2 text-xl font-bold text-[#111827]">Você está dentro!</h1>
          <p className="mb-6 text-sm text-gray-500">Clique abaixo para entrar no grupo exclusivo.</p>
          {cfg.whatsapp_group_link ? (
            <a
              href={cfg.whatsapp_group_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-[#25d366] py-4 text-lg font-bold text-white"
            >
              {cfg.button_text || "Entrar no Grupo VIP →"}
            </a>
          ) : (
            <p className="text-sm text-gray-500">
              Recebemos seus dados. Em breve entraremos em contato pelo WhatsApp.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#dfdac8] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        {store.logo_url && (
          <img src={store.logo_url} alt={store.name} className="mx-auto mb-6 h-10 object-contain" />
        )}

        <h1 className="mb-1 text-center text-xl font-bold text-[#111827]">
          {cfg.section_title || `Grupo VIP ${store.name}`}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {cfg.description || "Preencha seus dados para ter acesso às ofertas exclusivas."}
        </p>

        <div className="space-y-3">
          <input
            placeholder="Seu nome completo"
            maxLength={100}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />
          <input
            type="tel"
            inputMode="tel"
            placeholder="WhatsApp com DDD"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: maskPhoneBR(e.target.value) }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />
          <input
            placeholder="Sua cidade"
            maxLength={100}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="mt-4 w-full rounded-xl py-4 text-sm font-bold transition-all"
          style={{
            backgroundColor: isValid ? "#111827" : "#e5e7eb",
            color: isValid ? "#ffffff" : "#9ca3af",
            cursor: isValid && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "Aguarde..." : "Quero entrar no grupo VIP →"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-400">
          Seus dados estão seguros e não serão compartilhados.
        </p>
      </div>
    </div>
  );
}
