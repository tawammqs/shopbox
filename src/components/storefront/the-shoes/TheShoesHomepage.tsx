import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Instagram } from "lucide-react";
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
      <IconsBar items={s.icons_bar} />
      <MarqueeBar cfg={s.marquee2} />
      <TestimonialsSection title={s.testimonials_title} items={s.testimonials} />
      <FaqSection title={s.faq_title} items={s.faq_items} whatsapp={s.faq_whatsapp} />
      <InstagramSection handle={s.instagram_handle} />
      <FooterSection about={s.footer_about} links={s.footer_links} />
      {s.whatsapp_button && <FloatingWhatsApp number={s.whatsapp_button} />}
      <TheShoesStyles />
    </div>
  );
}

/* -------------- Section 0: Announcement Bar -------------- */
function AnnouncementBar({ bar }: { bar: TheShoesSettings["announcement_bar"] }) {
  const items = bar.items?.length ? bar.items : ["Bem-vindo!"];
  const text = items.join(" · ");
  return (
    <div className="ts-announcement" style={{ background: bar.bg_color, color: bar.text_color }}>
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
          <button aria-label="Anterior" onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 hover:bg-white text-black">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Próximo" onClick={() => emblaApi?.scrollNext()}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 hover:bg-white text-black">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((_, i) => (
              <button key={i} aria-label={`Banner ${i + 1}`} onClick={() => emblaApi?.scrollTo(i)}
                className="rounded-full bg-white transition-all"
                style={{ width: selected === i ? 10 : 8, height: selected === i ? 10 : 8, opacity: selected === i ? 1 : 0.5 }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------- Sections 2 & 5: Product Carousel -------------- */
function ProductCarouselSection({
  storeId, title, link, tag, description,
}: { storeId: string; title: string; link: string; tag: string; description?: string }) {
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
          <Link to="/loja/$slug" params={{ slug: store.slug }} className="mt-1 inline-block text-sm text-[#c0392b] hover:underline">
            {link} ›
          </Link>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] text-[#333] hover:bg-[#f8f8f8]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] text-[#333] hover:bg-[#f8f8f8]">
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
    <div className="ts-marquee-bar" style={{ background: cfg.bg_color, color: cfg.text_color }}>
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
      <img src={promo.image_url} alt="" className="block w-full max-h-[400px] object-cover" />
    </a>
  );
}

/* -------------- Section 6: Icons Bar -------------- */
function IconsBar({ items }: { items: TheShoesSettings["icons_bar"] }) {
  if (!items?.length) return null;
  return (
    <section className="border-y border-[#eee] bg-[#fafafa]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-3xl">{it.icon}</div>
            <div>
              <div className="text-sm font-semibold text-[#111]">{it.title}</div>
              <div className="text-xs text-[#666]">{it.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------- Section 8: Testimonials -------------- */
function TestimonialsSection({ title, items }: { title: string; items: TheShoesSettings["testimonials"] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  if (!items?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-[#111]">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] hover:bg-[#f8f8f8]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd] hover:bg-[#f8f8f8]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {items.map((t, i) => (
            <div key={i} className="min-w-0 flex-[0_0_85%] md:flex-[0_0_32%]">
              <div className="h-full rounded-2xl border border-[#eee] bg-white p-5 shadow-sm">
                {t.image_url && (
                  <img src={t.image_url} alt={t.name} className="mb-3 h-40 w-full rounded-lg object-cover" />
                )}
                <div className="text-amber-500" aria-label={`${t.rating} estrelas`}>
                  {"★".repeat(Math.max(0, Math.min(5, t.rating)))}
                  {"☆".repeat(5 - Math.max(0, Math.min(5, t.rating)))}
                </div>
                <p className="mt-2 text-sm text-[#333]">{t.text}</p>
                <p className="mt-3 text-xs font-semibold text-[#111]">— {t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------- Section 9: FAQ -------------- */
function FaqSection({ title, items, whatsapp }: { title: string; items: TheShoesSettings["faq_items"]; whatsapp: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;
  return (
    <section className="bg-[#fafafa] py-12">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-[#111]">{title}</h2>
        <div className="space-y-2">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-[#eee] bg-white">
                <button onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
                  <span className="text-sm font-semibold text-[#111]">{it.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && <div className="border-t border-[#eee] px-4 py-3 text-sm text-[#444]">{it.answer}</div>}
              </div>
            );
          })}
        </div>
        {whatsapp && (
          <div className="mt-6 text-center">
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              💬 Falar no WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------- Section 10: Instagram -------------- */
function InstagramSection({ handle }: { handle: string }) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "");
  return (
    <section className="py-10 text-center">
      <a href={`https://instagram.com/${clean}`} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-2 text-[#c0392b] hover:underline">
        <Instagram className="h-5 w-5" />
        <span className="font-semibold">@{clean}</span>
      </a>
      <p className="mt-1 text-sm text-[#666]">Siga-nos no Instagram</p>
    </section>
  );
}

/* -------------- Section 11: Footer -------------- */
function FooterSection({ about, links }: { about: string; links: TheShoesSettings["footer_links"] }) {
  if (!about && !links?.length) return null;
  return (
    <footer className="border-t border-[#eee] bg-[#111] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
        {about && (
          <div>
            <h3 className="mb-2 font-display text-lg font-semibold">Sobre</h3>
            <p className="text-sm text-white/70">{about}</p>
          </div>
        )}
        {links?.length > 0 && (
          <div>
            <h3 className="mb-2 font-display text-lg font-semibold">Links</h3>
            <ul className="space-y-1 text-sm">
              {links.map((l, i) => (
                <li key={i}>
                  <a href={l.url} className="text-white/70 hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}

/* -------------- Section 12: Floating WhatsApp -------------- */
function FloatingWhatsApp({ number }: { number: string }) {
  return (
    <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg hover:scale-105 transition-transform">
      💬
    </a>
  );
}

/* -------------- Scoped CSS -------------- */
function TheShoesStyles() {
  return (
    <style>{`
      .ts-announcement {
        width: 100%; height: 36px;
        overflow: hidden; display: flex; align-items: center;
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
      .ts-marquee-bar-track { animation-duration: 25s; }
      .ts-marquee-track:hover { animation-play-state: paused; }
      .ts-marquee-text { padding: 0 8px; }
      @keyframes tsAnnouncementScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  );
}
