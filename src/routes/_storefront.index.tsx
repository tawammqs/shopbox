import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProductsByTag } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "@/components/storefront/ProductCard";

export const Route = createFileRoute("/_storefront/")({
  component: HomePage,
});

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  button_label: string | null;
  button_link: string | null;
  desktop_url: string | null;
  mobile_url: string | null;
};

function HomePage() {
  const { data: banners = [] } = useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,subtitle,button_label,button_link,desktop_url,mobile_url")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const destaques = useProductsByTag("destaques");
  const lancamentos = useProductsByTag("lancamentos");
  const ofertas = useProductsByTag("ofertas");
  const principal = useProductsByTag("principal");
  const { data: categories = [] } = useCategories();
  const topCats = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <BannerCarousel banners={banners} />

      {principal.data && principal.data.length > 0 && (
        <Section title="Em Destaque" subtitle="Nossas peças favoritas da temporada">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principal.data.slice(0, 3).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </Section>
      )}

      {destaques.data && destaques.data.length > 0 && (
        <SectionScroll title="Destaques" products={destaques.data} />
      )}

      {lancamentos.data && lancamentos.data.length > 0 && (
        <SectionScroll title="Lançamentos" products={lancamentos.data} />
      )}

      {ofertas.data && ofertas.data.length > 0 && (
        <SectionScroll title="Ofertas" products={ofertas.data} />
      )}

      {topCats.length > 0 && (
        <Section title="Compre por Categoria">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topCats.map((c) => (
              <Link
                key={c.id}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="group product-card-hover relative aspect-square overflow-hidden rounded-2xl bg-secondary"
              >
                {c.image_url && (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-xl font-semibold text-white">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="mb-6 md:mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SectionScroll({
  title,
  products,
}: {
  title: string;
  products: Parameters<typeof ProductCard>[0]["product"][];
}) {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight md:mb-8 md:text-3xl">{title}</h2>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
        {products.slice(0, 8).map((p, i) => (
          <div key={p.id} className="w-[60%] shrink-0 md:w-auto">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [paused, banners.length]);

  if (banners.length === 0) return null;
  const b = banners[idx];

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={b.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative aspect-[4/5] w-full md:aspect-[16/6]"
        >
          {b.mobile_url && (
            <img
              src={b.mobile_url}
              alt={b.title ?? ""}
              className="absolute inset-0 h-full w-full object-cover md:hidden"
            />
          )}
          {b.desktop_url && (
            <img
              src={b.desktop_url}
              alt={b.title ?? ""}
              className="absolute inset-0 hidden h-full w-full object-cover md:block"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/40 md:to-transparent" />
          <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-12 md:justify-center md:pb-0">
            {b.title && (
              <h1 className="max-w-2xl font-display text-3xl font-bold text-white drop-shadow md:text-5xl lg:text-6xl">
                {b.title}
              </h1>
            )}
            {b.subtitle && (
              <p className="mt-3 max-w-xl text-sm text-white/90 md:text-base">{b.subtitle}</p>
            )}
            {b.button_label && b.button_link && (
              <a
                href={b.button_link}
                className="mt-5 inline-flex w-fit items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition hover:scale-105 hover:bg-accent/90"
              >
                {b.button_label}
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
