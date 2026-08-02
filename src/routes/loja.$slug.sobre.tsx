import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStorefront } from "@/components/storefront/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { mergeSobre, type SobreConfig } from "@/lib/sobre-config";

export const Route = createFileRoute("/loja/$slug/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a marca — Nossa história" },
      { name: "description", content: "Conheça a história da loja, nossos valores, diferenciais e a equipe que atende você." },
      { property: "og:title", content: "Sobre a marca — Nossa história" },
      { property: "og:description", content: "Conheça a história da loja, nossos valores e a equipe que atende você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SobrePage,
});

type Member = { id: string; name: string; whatsapp: string; photo_url: string | null };

function SobrePage() {
  const { store } = useStorefront();

  const { data: config } = useQuery({
    queryKey: ["sobre-config", store.id],
    queryFn: async (): Promise<SobreConfig> => {
      const { data } = await supabase
        .from("store_policies")
        .select("sobre_config")
        .eq("store_id", store.id)
        .maybeSingle();
      return mergeSobre((data as any)?.sobre_config);
    },
  });

  const { data: team = [] } = useQuery({
    queryKey: ["sobre-team", store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_sales_team")
        .select("id, name, whatsapp, photo_url")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("position", { ascending: true });
      return (data ?? []) as Member[];
    },
  });

  if (!config) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {config.foto_banner && (
        <div className="mb-8 aspect-video overflow-hidden rounded-2xl">
          <img src={config.foto_banner} alt={config.titulo} className="h-full w-full object-cover" />
        </div>
      )}

      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{config.titulo}</h1>
        {config.subtitulo && <p className="text-muted-foreground">{config.subtitulo}</p>}
        {(config.fundacao_ano || config.cidade) && (
          <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
            {config.fundacao_ano ? <span>📅 Desde {config.fundacao_ano}</span> : null}
            {config.cidade ? <span>📍 {config.cidade}</span> : null}
          </div>
        )}
      </header>

      {config.historia && (
        <p className="mb-8 whitespace-pre-line leading-relaxed text-foreground/80">{config.historia}</p>
      )}

      {config.fotos_galeria.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3">
          {config.fotos_galeria.map((foto, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-xl">
              <img src={foto} alt={`Foto ${i + 1} da loja`} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {config.diferenciais.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Por que nos escolher?</h2>
          <div className="grid grid-cols-2 gap-3">
            {config.diferenciais.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <span className="mb-2 block text-2xl">{item.icone}</span>
                <p className="mb-1 text-sm font-semibold text-foreground">{item.titulo}</p>
                <p className="text-xs text-muted-foreground">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.mostrar_equipe && team.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-foreground">Nossa equipe</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {team.map((m) => (
              <div key={m.id} className="text-center">
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    loading="lazy"
                    className="mx-auto mb-2 h-20 w-20 rounded-full border-2 border-[#25d366] object-cover"
                  />
                ) : (
                  <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <a
                  href={buildWhatsAppUrl(m.whatsapp, "Olá! Vi vocês no site e gostaria de mais informações.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-[#25d366]"
                >
                  💬 Falar comigo
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl bg-muted p-6 text-center">
        <p className="mb-1 font-semibold text-foreground">Pronto para comprar?</p>
        <p className="mb-4 text-sm text-muted-foreground">Confira nossos produtos e fale com a gente!</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/loja/$slug"
            params={{ slug: store.slug }}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Ver produtos
          </Link>
          {store.whatsapp && (
            <a
              href={buildWhatsAppUrl(store.whatsapp, "Olá! Conheci a loja e gostaria de saber mais.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#25d366] px-6 py-2.5 text-sm font-semibold text-white"
            >
              💬 Falar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
