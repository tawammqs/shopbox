import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Minus, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStorefront } from "../StoreContext";
import { fetchActiveBanners, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { fetchTheShoesSettings, type TheShoesSettings } from "@/lib/the-shoes-theme";
import { discountPct, effectivePrice, formatBRL } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { trackAddToCart } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const ACCENT = "#111111";

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

  return (
    <div className="ts-root">
      <HeroCarousel banners={bannersQ.data ?? []} />
      <ProductCarouselSection
        storeId={store.id} title={s.section1_title} link={s.section1_subtitle} tag={s.section1_tag}
      />
      <MarqueeBar cfg={s.marquee1} />
      <PromoBannerSection promo={s.promo_banner} />
      <ProductCarouselSection
        storeId={store.id} title={s.section2_title} link={s.section2_subtitle} tag={s.section2_tag}
        description={s.section2_description}
      />
      <IconsBar items={s.icons_bar} />
      <MarqueeBar cfg={s.marquee2} />
      <TestimonialsSection title={s.testimonials_title} items={s.testimonials} />
      <FaqSection title={s.faq_title} items={s.faq_items} whatsapp={s.faq_whatsapp} />
      <InstagramSection handle={s.instagram_handle} />
      {s.whatsapp_button && <FloatingWhatsApp number={s.whatsapp_button} />}
      <TheShoesStyles />
    </div>
  );
}

/* -------------- Hero Carousel -------------- */
function HeroCarousel({ banners }: { banners: any[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSel); onSel();
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
                <img src={b.desktop_url ?? b.mobile_url ?? ""} alt={b.title ?? ""}
                  className="block h-[55vh] max-h-[600px] min-h-[280px] w-full object-cover md:h-[520px]" />
              </picture>
            </div>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <>
          <button aria-label="Anterior" onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#333] text-lg hover:bg-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Próximo" onClick={() => emblaApi?.scrollNext()}
            className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#333] text-lg hover:bg-white">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-[6px]">
            {banners.map((_, i) => (
              <button key={i} aria-label={`Banner ${i + 1}`} onClick={() => emblaApi?.scrollTo(i)}
                className="rounded-full bg-white transition-all"
                style={{
                  width: selected === i ? 10 : 8,
                  height: selected === i ? 10 : 8,
                  opacity: selected === i ? 1 : 0.5,
                  transform: selected === i ? "scale(1.2)" : "scale(1)",
                }} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------- Product card (Mio-style) -------------- */
function TsProductCard({ p }: { p: ProductCardData }) {
  const { store } = useStorefront();
  const addItem = useCart((s) => s.addItem);
  const wished = useWishlist((s) => s.has(p.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const price = effectivePrice(p.price, p.promo_price);
  const pct = discountPct(p.price, p.promo_price);
  const img1 = p.images[0]?.url ?? "";
  const img2 = p.images[1]?.url ?? img1;
  const [hover, setHover] = useState(false);

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (p.colors.length > 0) { window.location.href = `/loja/${store.slug}/produto/${p.slug}`; return; }
    addItem({
      productId: p.id, slug: p.slug, title: p.title, image: img1,
      colorId: null, colorName: null, sizeId: null, sizeLabel: null,
      unitPrice: price, quantity: 1, storeId: store.id,
    });
    void trackAddToCart(store, { id: p.id, title: p.title, value: price, quantity: 1 });
    toast.success("Adicionado ao carrinho");
  };

  return (
    <Link to="/loja/$slug/produto/$productSlug" params={{ slug: store.slug, productSlug: p.slug }}
      className="group block" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f7f7f7]">
        {img1 && (
          <img src={img1} alt={p.title} loading="lazy"
            className={cn("h-full w-full object-cover transition-opacity duration-500", hover && img2 !== img1 && "opacity-0")} />
        )}
        {img2 && img2 !== img1 && (
          <img src={img2} alt="" loading="lazy"
            className={cn("absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500", hover && "opacity-100")} />
        )}
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded text-white"
            style={{ background: ACCENT, fontSize: 11, fontWeight: 700, padding: "4px 8px", letterSpacing: 0.2 }}>
            ATÉ {pct}% OFF
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); toggleWish(p.id); }}
          aria-label="Favoritar"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#333] shadow-sm hover:bg-white">
          <Heart className={cn("h-[14px] w-[14px]", wished && "fill-[#111] text-[#111]")} />
        </button>
        <button onClick={quickAdd}
          className="absolute inset-x-2 bottom-2 hidden items-center justify-center rounded-full py-2 text-[11px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 md:flex"
          style={{ background: ACCENT }}>
          {p.colors.length > 0 ? "ESCOLHER OPÇÕES" : "ADICIONAR"}
        </button>
      </div>
      <div className="px-1 pt-3 pb-1">
        {p.brand && (
          <p className="mb-[2px] text-[11px] font-medium uppercase text-[#aaa]" style={{ letterSpacing: "0.05em" }}>
            {p.brand}
          </p>
        )}
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#111]" style={{ marginBottom: 6 }}>
          {p.title}
        </h3>
        <div className="flex items-baseline">
          {pct > 0 ? (
            <>
              <span className="text-[16px] font-bold" style={{ color: ACCENT }}>{formatBRL(price)}</span>
              <span className="ml-2 text-[13px] font-normal text-[#aaa] line-through">{formatBRL(p.price)}</span>
            </>
          ) : (
            <span className="text-[16px] font-semibold text-[#111]">{formatBRL(price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* -------------- Product Carousel Section -------------- */
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
    <section className="ts-section">
      <div className="ts-section-head">
        <div className="min-w-0">
          {description && <p className="mb-1 text-[13px] text-[#888]">{description}</p>}
          <h2 className="ts-section-title">{title}</h2>
          <Link to="/loja/$slug" params={{ slug: store.slug }}
            className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#aaa] hover:text-[#111]">
            {link}
            <span className="grid h-5 w-5 place-items-center rounded-full border border-[#ddd] text-[10px]">›</span>
          </Link>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior" className="ts-circle-btn">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo" className="ts-circle-btn">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="ts-carousel">
          {products.map((p) => (
            <div key={p.id} className="ts-carousel-item">
              <TsProductCard p={p as ProductCardData} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------- Marquee Bar -------------- */
function MarqueeBar({ cfg }: { cfg: TheShoesSettings["marquee1"] }) {
  if (!cfg?.text) return null;
  return (
    <div className="ts-marquee" style={{ background: cfg.bg_color, color: cfg.text_color }}>
      <div className="ts-marquee-track">
        <span>{cfg.text}&nbsp;&nbsp;·&nbsp;&nbsp;</span>
        <span aria-hidden>{cfg.text}&nbsp;&nbsp;·&nbsp;&nbsp;</span>
      </div>
    </div>
  );
}

/* -------------- Promo Banner -------------- */
function PromoBannerSection({ promo }: { promo: TheShoesSettings["promo_banner"] }) {
  if (!promo?.image_url) return null;
  return (
    <a href={promo.link || "#"} className="block w-full transition-opacity hover:opacity-95">
      <img src={promo.image_url} alt="" className="block max-h-[420px] w-full object-cover" />
    </a>
  );
}

/* -------------- Icons / Benefits Bar -------------- */
function IconsBar({ items }: { items: TheShoesSettings["icons_bar"] }) {
  if (!items?.length) return null;
  return (
    <section className="ts-icons-section bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full text-white text-[28px]"
              style={{ background: ACCENT }}>
              <span>{it.icon}</span>
            </div>
            <div className="mt-4 text-[14px] font-bold text-[#111]">{it.title}</div>
            <div className="mt-1 text-[13px] text-[#666]">{it.subtitle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------- Testimonials (pill rows) -------------- */
function TestimonialsSection({ title, items }: { title: string; items: TheShoesSettings["testimonials"] }) {
  if (!items?.length) return null;
  // Highlight last word with accent color
  const parts = title.trim().split(" ");
  const last = parts.pop() ?? "";
  const head = parts.join(" ");

  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half).length ? items.slice(half) : items;

  return (
    <section className="ts-section">
      <h2 className="mb-10 text-center text-[28px] font-extrabold leading-tight text-[#111]" style={{ letterSpacing: "-0.5px" }}>
        {head} <span style={{ color: ACCENT }}>{last}</span>
      </h2>
      <div className="space-y-4 overflow-hidden">
        <PillRow items={row1} direction="left" />
        <PillRow items={row2} direction="right" />
      </div>
    </section>
  );
}

function PillRow({ items, direction }: { items: TheShoesSettings["testimonials"]; direction: "left" | "right" }) {
  const dup = [...items, ...items];
  return (
    <div className="ts-pill-row">
      <div className={cn("ts-pill-track", direction === "right" && "ts-pill-track-rev")}>
        {dup.map((t, i) => (
          <div key={i} className="ts-pill">
            <div className="relative shrink-0">
              {t.image_url ? (
                <img src={t.image_url} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f0f0f0] text-[12px] font-bold text-[#666]">
                  {t.name?.[0] ?? "?"}
                </div>
              )}
              <span className="absolute -bottom-[2px] -right-[2px] grid h-[18px] w-[18px] place-items-center rounded-full text-[8px] font-bold text-white"
                style={{ background: ACCENT }}>
                5★
              </span>
            </div>
            <p className="text-[13px] leading-tight text-[#333]" style={{ maxWidth: 180 }}>
              <span className="font-semibold text-[#111]">{t.name}: </span>{t.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------- FAQ -------------- */
function FaqSection({ title, items, whatsapp }: { title: string; items: TheShoesSettings["faq_items"]; whatsapp: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;
  return (
    <section className="ts-faq">
      <h2 className="mb-10 text-[32px] font-extrabold text-[#111]" style={{ letterSpacing: "-0.5px" }}>{title}</h2>
      <div>
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-[#f0f0f0]">
              <button onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left">
                <span className="text-[15px] font-semibold text-[#111]">{it.question}</span>
                {isOpen
                  ? <Minus className="h-[22px] w-[22px] shrink-0" style={{ color: ACCENT }} />
                  : <Plus className="h-[22px] w-[22px] shrink-0" style={{ color: ACCENT }} />}
              </button>
              {isOpen && (
                <div className="pb-5 text-[14px] text-[#666]" style={{ lineHeight: 1.8 }}>{it.answer}</div>
              )}
            </div>
          );
        })}
      </div>
      {whatsapp && (
        <div className="mt-10 flex justify-center">
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-[10px] rounded-full bg-[#25D366] px-9 py-[14px] text-[15px] font-semibold text-white hover:opacity-90">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5Zm-8.4 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.8.9.9-2.7-.2-.3a9 9 0 1 1 7 3.6Zm5-6.8c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.2s-.7.9-.9 1c-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3c0 1.3 1 2.6 1.1 2.8.2.3 2 3 4.7 4.2 1.6.7 2.3.8 3.1.7.5-.1 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.2-.2-.5-.3Z"/></svg>
            Falar no WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}

/* -------------- Instagram -------------- */
function InstagramSection({ handle }: { handle: string }) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "");
  return (
    <section className="ts-icons-section bg-white text-center">
      <h2 className="mb-8 text-[22px] font-bold text-[#111]">Siga-nos no Instagram</h2>
      <a href={`https://instagram.com/${clean}`} target="_blank" rel="noreferrer"
        className="mt-5 inline-block text-[14px] font-semibold underline" style={{ color: ACCENT }}>
        @{clean}
      </a>
    </section>
  );
}

/* -------------- Floating WhatsApp -------------- */
function FloatingWhatsApp({ number }: { number: string }) {
  return (
    <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
      className="ts-fab fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105">
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
        <path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5Zm-3.4 11.7c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.2s-.7.9-.9 1c-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5l-.9-2c-.2-.5-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-1 2.3c0 1.3 1 2.6 1.1 2.8.2.3 2 3 4.7 4.2 1.6.7 2.3.8 3.1.7.5-.1 1.6-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.2-.2-.5-.3Z"/>
      </svg>
    </a>
  );
}

/* -------------- Scoped CSS -------------- */
function TheShoesStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      .ts-root, .ts-root * { font-family: 'Inter', system-ui, sans-serif; }

      .ts-section { padding: 48px 20px; max-width: 1280px; margin: 0 auto; }
      .ts-section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; }
      .ts-section-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; line-height: 1.15; }
      @media (min-width: 768px) {
        .ts-section { padding: 64px 40px; }
        .ts-section-title { font-size: 26px; }
        .ts-section-head { margin-bottom: 28px; }
      }

      .ts-circle-btn {
        display: grid; place-items: center;
        height: 36px; width: 36px; border-radius: 9999px;
        border: 1px solid #ddd; background: #fff; color: #333;
        transition: all 0.15s;
      }
      .ts-circle-btn:hover { border-color: #111; color: #111; }

      .ts-carousel { display: flex; gap: 12px; }
      .ts-carousel-item { flex: 0 0 calc(50% - 6px); min-width: 0; scroll-snap-align: start; }
      @media (min-width: 768px) {
        .ts-carousel { gap: 16px; }
        .ts-carousel-item { flex: 0 0 calc(25% - 12px); }
      }

      .ts-marquee { height: 48px; display: flex; align-items: center; overflow: hidden;
        font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
      .ts-marquee-track { display: inline-flex; white-space: nowrap; animation: tsScroll 20s linear infinite; }
      .ts-marquee-track > span { padding: 0 16px; }
      @keyframes tsScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

      .ts-icons-section { padding: 48px 20px; }
      @media (min-width: 768px) { .ts-icons-section { padding: 48px 40px; } }

      .ts-faq { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
      @media (min-width: 768px) { .ts-faq { padding: 64px 40px; } }

      .ts-pill-row { overflow: hidden; }
      .ts-pill-track { display: inline-flex; gap: 12px; animation: tsPillL 35s linear infinite; }
      .ts-pill-track-rev { animation: tsPillR 35s linear infinite; }
      @keyframes tsPillL { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes tsPillR { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      .ts-pill {
        display: inline-flex; align-items: center; gap: 10px;
        background: #fff; border: 1px solid #ebebeb; border-radius: 9999px;
        padding: 12px 20px 12px 12px; white-space: nowrap; flex-shrink: 0;
      }

      .ts-fab { box-shadow: 0 4px 20px rgba(37,211,102,0.4); animation: tsPulse 2s infinite; }
      @keyframes tsPulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.4); }
        50% { box-shadow: 0 4px 30px rgba(37,211,102,0.7); }
      }
    `}</style>
  );
}
