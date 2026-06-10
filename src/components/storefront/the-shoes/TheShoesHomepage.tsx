import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStorefront } from "../StoreContext";
import { fetchActiveBanners, fetchProductsByTag } from "@/lib/storefront";
import { fetchTheShoesSettings, type TheShoesSettings } from "@/lib/the-shoes-theme";
import { ProductCard } from "../ProductCard";
import { Link } from "@tanstack/react-router";

export function TheShoesHomepage() {
  const { store } = useStorefront();

  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
  });

  const bannersQ = useQuery({
    queryKey: ["banners", store.id],
    queryFn: () => fetchActiveBanners(store.id),
    staleTime: 60_000,
  });

  const s = settingsQ.data;
  if (!s) return null;

  const ab = s.announcement_bar;

  return (
    <div className="ts-root">
      {ab?.enabled && <AnnouncementBar bar={ab} />}
      <div style={{ paddingTop: ab?.enabled ? 36 : 0 }}>
        <HeroCarousel banners={bannersQ.data ?? []} />
        <ProductCarouselSection
          storeId={store.id}
          title={s.section1_title}
          link={s.section1_subtitle}
          tag={s.section1_tag}
        />
        <MarqueeBar cfg={s.marquee1} />
        <PromoBannerSection promo={s.promo_banner} />
        <ProductCarouselSection
          storeId={store.id}
          title={s.section2_title}
          link={s.section2_subtitle}
          tag={s.section2_tag}
          description={s.section2_description}
        />
      </div>
      <TheShoesStyles />
    </div>
  );
}

/* -------------- Section 0: Announcement Bar -------------- */
function AnnouncementBar({ bar }: { bar: TheShoesSettings["announcement_bar"] }) {
  const items = bar.items?.length ? bar.items : ["Bem-vindo!"];
  const text = items.join(" · ");
  return (
    <div
      className="ts-announcement"
      style={{ background: bar.bg_color, color: bar.text_color }}
    >
      <div className="ts-marquee-track">
        <span className="ts-marquee-text">{text}&nbsp;·&nbsp;</span>
        <span className="ts-marquee-text" aria-hidden>{text}&nbsp;·&nbsp;</span>
      </div>
    </div>
  );
}

/* -------------- Section 1: Hero Carousel -------------- */
function HeroCarousel({ banners }: { banners: any[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSel);
    onSel();
    return () => { emblaApi.off("select", onSel); };
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <section className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((b) => (
            <div key={b.id} className="relative min-w-0 flex-[0_0_100%]">
              <picture>
                {b.mobile_url && <source media="(max-width: 768px)" srcSet={b.mobile_url} />}
                <img
                  src={b.desktop_url ?? b.mobile_url ?? ""}
                  alt={b.title ?? ""}
                  className="block h-[55vh] max-h-[560px] min-h-[260px] w-full object-cover md:h-[480px]"
                />
              </picture>
            </div>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <>
          <button
            aria-label="Anterior"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 hover:bg-white text-black"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Próximo"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 hover:bg-white text-black"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`Banner ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className="rounded-full bg-white transition-all"
                style={{
                  width: selected === i ? 10 : 8,
                  height: selected === i ? 10 : 8,
                  opacity: selected === i ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------- Sections 2 & 5: Product Carousel -------------- */
function ProductCarouselSection({
  storeId,
  title,
  link,
  tag,
  description,
}: {
  storeId: string;
  title: string;
  link: string;
  tag: string;
  description?: string;
}) {
  const { store } = useStorefront();
  const q = useQuery({
    queryKey: ["products-by-tag", storeId, tag],
    queryFn: () => fetchProductsByTag(storeId, tag, 12),
    staleTime: 60_000,
  });
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });

  const products = q.data ?? [];
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {description && <p className="text-[13px] text-[#aaa]">{description}</p>}
          <h2 className="font-display text-2xl font-bold text-[#111]">{title}</h2>
          <Link
            to="/loja/$slug"
            params={{ slug: store.slug }}
            className="mt-1 inline-block text-sm text-[#c0392b] hover:underline"
          >
            {link} ›
          </Link>
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] text-[#333] hover:bg-[#f8f8f8]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] text-[#333] hover:bg-[#f8f8f8]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {products.map((p) => (
            <div key={p.id} className="min-w-0 flex-[0_0_47%] md:flex-[0_0_24%]">
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------- Sections 3 & 7: Marquee Bar -------------- */
function MarqueeBar({ cfg }: { cfg: TheShoesSettings["marquee1"] }) {
  if (!cfg?.text) return null;
  return (
    <div
      className="ts-marquee-bar"
      style={{ background: cfg.bg_color, color: cfg.text_color }}
    >
      <div className="ts-marquee-track ts-marquee-bar-track">
        <span className="ts-marquee-text">{cfg.text}&nbsp;·&nbsp;</span>
        <span className="ts-marquee-text" aria-hidden>{cfg.text}&nbsp;·&nbsp;</span>
      </div>
    </div>
  );
}

/* -------------- Section 4: Promo Banner -------------- */
function PromoBannerSection({ promo }: { promo: TheShoesSettings["promo_banner"] }) {
  if (!promo?.image_url) return null;
  return (
    <a href={promo.link || "#"} className="block w-full transition-opacity hover:opacity-95">
      <img
        src={promo.image_url}
        alt=""
        className="block w-full max-h-[400px] object-cover"
      />
    </a>
  );
}

/* -------------- Scoped CSS -------------- */
function TheShoesStyles() {
  return (
    <style>{`
      .ts-announcement {
        position: fixed; top: 0; left: 0; right: 0; height: 36px;
        z-index: 200; overflow: hidden; display: flex; align-items: center;
        font-size: 12px; font-weight: 500;
      }
      .ts-marquee-bar {
        width: 100%; height: 48px; overflow: hidden;
        display: flex; align-items: center;
        font-size: 14px; font-weight: 600;
      }
      .ts-marquee-track {
        display: inline-flex; white-space: nowrap;
        animation: tsAnnouncementScroll 20s linear infinite;
      }
      .ts-marquee-bar-track {
        animation-duration: 25s;
      }
      .ts-marquee-track:hover { animation-play-state: paused; }
      .ts-marquee-text { padding: 0 8px; }
      @keyframes tsAnnouncementScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      /* Push fixed header/nav down when announcement bar is present */
      [data-store-slug="the-shoes"] .ts-root { }
    `}</style>
  );
}
