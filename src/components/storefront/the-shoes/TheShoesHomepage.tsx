import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStorefront } from "../StoreContext";
import { fetchActiveBanners, fetchProductsByTag, fetchStoreVideoTestimonials, type ProductCardData } from "@/lib/storefront";
import { fetchTheShoesSettings, type TheShoesSettings } from "@/lib/the-shoes-theme";
import { discountPct, effectivePrice, formatBRL } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { trackAddToCart } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const VIP_GROUP_URL = "https://chat.whatsapp.com/CZ5lQvBM0kt9j1QRq7bU3r";

function formatWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const ACCENT = "#111111";

function WhatsAppLogo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.874L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.034-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106c5.421 0 9.894 4.474 9.894 9.894 0 5.421-4.473 9.894-9.894 9.894z"/>
    </svg>
  );
}

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
      <AchadinhosInline storeId={store.id} tag={s.section1_tag} />

      <MarqueeBar cfg={s.marquee1} />
      <PromoBannerSection promo={s.promo_banner} />
      <ProductCarouselSection
        storeId={store.id} title={s.section2_title} link={s.section2_subtitle} tag={s.section2_tag}
        description={s.section2_description}
      />
      <IconsBar items={s.icons_bar} />
      <MarqueeBar cfg={s.marquee2} />
      <TestimonialsSection title={s.testimonials_title} items={s.testimonials} />
      <VideoTestimonialsSection storeId={store.id} storeSlug={store.slug} />
      <FaqSection title={s.faq_title} items={s.faq_items} whatsapp={s.faq_whatsapp} />
      <InstagramSection handle={s.instagram_handle} images={s.instagram_images} />
      {s.whatsapp_button && <FloatingWhatsApp number={s.whatsapp_button} />}
      <TheShoesStyles />
    </div>
  );
}

/* -------------- Hero Carousel with numbered progress indicators -------------- */
function HeroCarousel({ banners }: { banners: any[] }) {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selected, setSelected] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => { setSelected(emblaApi.selectedScrollSnap()); setAnimKey((k) => k + 1); };
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
            className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#333] hover:bg-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Próximo" onClick={() => emblaApi?.scrollNext()}
            className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#333] hover:bg-white">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="ts-banner-indicators">
            {banners.map((_, i) => {
              const state = i === selected ? "active" : i < selected ? "past" : "future";
              return (
                <button key={i} aria-label={`Banner ${i + 1}`}
                  onClick={() => { emblaApi?.scrollTo(i); setAnimKey((k) => k + 1); }}
                  className="ts-banner-ind">
                  <span className={cn("ts-banner-ind-num", state === "active" && "active")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ts-banner-ind-bar">
                    <span key={state === "active" ? animKey : `s-${state}`}
                      className={cn("ts-banner-ind-fill", state)} />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------- Product card -------------- */
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
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-[#f7f7f7]">
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

/* -------------- Marquee Bar (large) -------------- */
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

/* -------------- Icons / Benefits -------------- */
const ICON_SVGS: Record<string, ReactNode> = {
  truck: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v4h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  exchange: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
    </svg>
  ),
  lock: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  chat: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
};
function pickIcon(raw: string): ReactNode {
  const v = (raw || "").toLowerCase();
  if (v.includes("🚚") || v.includes("truck") || v.includes("frete")) return ICON_SVGS.truck;
  if (v.includes("🔄") || v.includes("troca") || v.includes("exchange")) return ICON_SVGS.exchange;
  if (v.includes("🔒") || v.includes("segur") || v.includes("lock")) return ICON_SVGS.lock;
  if (v.includes("💬") || v.includes("suporte") || v.includes("chat") || v.includes("whats")) return ICON_SVGS.chat;
  return ICON_SVGS.truck;
}

function IconsBar({ items }: { items: TheShoesSettings["icons_bar"] }) {
  if (!items?.length) return null;
  return (
    <section className="ts-icons-section bg-white">
      <div className="ts-icons-grid">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col items-center px-3 text-center">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full"
              style={{ background: "#dfdac8" }}>
              {pickIcon(it.icon)}
            </div>
            <div className="mt-4 mb-1 text-[14px] font-bold text-[#111]">{it.title}</div>
            <div className="text-[13px] font-normal text-[#666]">{it.subtitle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------- Video Testimonials -------------- */
function VideoTestimonialsSection({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const q = useQuery({
    queryKey: ["ts-video-testimonials", storeId],
    queryFn: () => fetchStoreVideoTestimonials(storeId, 8),
    staleTime: 60_000,
  });
  const videos = q.data ?? [];
  if (videos.length === 0) return null;
  return (
    <section className="ts-section">
      <h2 className="mb-8 text-center text-[26px] font-extrabold text-[#111]" style={{ letterSpacing: "-0.5px" }}>
        Veja mais detalhes em vídeo
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 md:gap-4" style={{ scrollbarWidth: "thin" }}>
        {videos.map((v: any) => {
          const product = v.products;
          const thumb = product?.product_images?.[0]?.url ?? "";
          const price = product ? Number(product.promo_price ?? product.price ?? 0) : 0;
          const original = product?.promo_price != null ? Number(product.price) : null;
          return (
            <Link key={v.id}
              to="/loja/$slug/produto/$productSlug"
              params={{ slug: storeSlug, productSlug: product?.slug ?? "" }}
              className="relative block aspect-[9/16] w-[160px] shrink-0 overflow-hidden rounded-[16px] bg-[#f5f5f5] md:w-[200px]">
              {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />}
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white">
                  <span className="ml-[2px] text-[14px]">▶</span>
                </div>
              </div>
              {product && (
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2">
                  {thumb && <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#111]">
                      {product.title}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[13px] font-bold text-[#111]">{formatBRL(price)}</span>
                      {original != null && (
                        <span className="text-[11px] text-[#aaa] line-through">{formatBRL(original)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* -------------- Testimonials -------------- */
function TestimonialsSection({ title, items }: { title: string; items: TheShoesSettings["testimonials"] }) {
  if (!items?.length) return null;
  const parts = title.trim().split(" ");
  const last = parts.pop() ?? "";
  const head = parts.join(" ");

  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half).length ? items.slice(half) : items;

  return (
    <section className="ts-section ts-testimonials">
      <h2 className="mb-10 text-center text-[28px] font-extrabold leading-tight text-[#111]" style={{ letterSpacing: "-0.5px" }}>
        {head} <span style={{ color: ACCENT }}>{last}</span>
      </h2>
      <PillRow items={row1} direction="left" />
      <PillRow items={row2} direction="right" />
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

/* -------------- FAQ (cream box, Mio Capelli style) -------------- */
function FaqSection({ title, items, whatsapp }: { title: string; items: TheShoesSettings["faq_items"]; whatsapp: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items?.length) return null;
  return (
    <section className="ts-faq-section">
      <div className="ts-faq-wrap">
        <p className="ts-faq-eyebrow">Ainda na dúvida?</p>
        <h2 className="ts-faq-title">{title || "The Shoes responde"}</h2>
        <div className="ts-faq-box">
          <div>
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="ts-faq-item">
                  <button onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 text-left">
                    <span className="ts-faq-q">{it.question}</span>
                    <span className="ts-faq-icon">{isOpen ? "∧" : "∨"}</span>
                  </button>
                  {isOpen && (
                    <div className="ts-faq-a">{it.answer}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="ts-faq-divider" />
          <p className="ts-faq-help">
            Não encontrou a resposta para a sua pergunta?<br />
            Fale com o nosso time de atendimento.
          </p>
          {whatsapp && (
            <div className="flex justify-center">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="ts-faq-cta">
                <WhatsAppLogo size={20} />
                Chamar no WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------- Achadinhos inline (always-visible card, blurred grid bg) -------------- */
function AchadinhosInline({ storeId, tag }: { storeId: string; tag: string }) {
  const { store } = useStorefront();
  const q = useQuery({
    queryKey: ["ts-achadinhos-bg", storeId, tag],
    queryFn: () => fetchProductsByTag(storeId, tag, 8),
    staleTime: 60_000,
  });
  const products = q.data ?? [];
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setInvalid(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("vip_group_leads" as any).insert({
        store_id: store.id, whatsapp: digits, source: "achadinhos_inline",
      });
      window.open(VIP_GROUP_URL, "_blank", "noopener,noreferrer");
      setSuccess(true);
      setValue("");
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="ts-achadinhos">
      <div className="ts-achadinhos-bg">
        {products.slice(0, 8).map((p) => {
          const img = p.images?.[0]?.url ?? "";
          return (
            <div key={p.id} style={{
              backgroundImage: img ? `url(${img})` : undefined,
              backgroundColor: "#f0f0f0",
              backgroundSize: "cover",
              backgroundPosition: "center",
              aspectRatio: "4/5",
            }} />
          );
        })}
      </div>
      <div className="ts-achadinhos-overlay" />
      <div className="ts-achadinhos-content">
        <div className="ts-achadinhos-card">
          <span style={{ fontSize: 44, display: "block", marginBottom: 14 }}>🔒</span>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: "#111", marginBottom: 10 }}>
            Achadinhos da The Shoes
          </h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 22 }}>
            Digite seu WhatsApp e tenha acesso às ofertas mais incríveis da The Shoes. Exclusivo para clientes VIPs 😉
          </p>
          <input
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => { setValue(formatWhatsapp(e.target.value)); if (invalid) setInvalid(false); }}
            placeholder={invalid ? "Digite um WhatsApp válido" : "(DDD + XXXXX-XXXX)"}
            disabled={success}
            style={{
              width: "100%", height: 52,
              border: `1.5px solid ${invalid ? "#e53935" : "#e0e0e0"}`,
              borderRadius: 10, padding: "0 16px", fontSize: 16,
              fontFamily: "DM Sans, sans-serif", textAlign: "center",
              color: "#111", marginBottom: 12, outline: "none",
              boxSizing: "border-box",
            }}
          />
          {success ? (
            <p style={{ color: "#25D366", fontSize: 15, fontWeight: 600, padding: "16px 0" }}>
              ✓ Redirecionando para o grupo VIP! 🎉
            </p>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              style={{
                width: "100%", height: 52, background: "#25D366", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                cursor: "pointer", opacity: submitting ? 0.7 : 1,
                animation: shake ? "tsShake 0.4s ease" : undefined,
              }}>
              {submitting ? "Enviando..." : "Desbloquear e ver ofertas"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}


/* -------------- Instagram (manual uploads) -------------- */
function InstagramSection({ handle, images }: { handle: string; images: TheShoesSettings["instagram_images"] }) {
  if (!handle && (!images || images.length === 0)) return null;
  const clean = handle.replace(/^@/, "");
  return (
    <section className="ts-icons-section bg-white text-center">
      <h2 className="mb-8 text-[22px] font-bold text-[#111]">Siga a The Shoes no Instagram! 💖</h2>
      {images && images.length > 0 && (
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {images.slice(0, 12).map((img, i) => (
            <a key={i} href={img.link || `https://instagram.com/${clean}`} target="_blank" rel="noreferrer"
              className="block aspect-square overflow-hidden rounded-[10px] bg-[#f5f5f5] transition-transform hover:scale-[1.03]">
              {img.image_url && <img src={img.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </a>
          ))}
        </div>
      )}
      {handle && (
        <a href={`https://instagram.com/${clean}`} target="_blank" rel="noreferrer"
          className="mt-5 inline-block text-[14px] font-semibold underline text-[#111]">
          @{clean}
        </a>
      )}
    </section>
  );
}

/* -------------- Floating WhatsApp -------------- */
function FloatingWhatsApp({ number }: { number: string }) {
  return (
    <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
      className="ts-fab" style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
        backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(37,211,102,0.4)", zIndex: 9999, color: "#fff",
      }}>
      <WhatsAppLogo size={32} />
    </a>
  );
}

/* -------------- Scoped CSS -------------- */
function TheShoesStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');
      .ts-root, .ts-root * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }

      .ts-section { padding: 48px 20px; max-width: 1280px; margin: 0 auto; }
      .ts-section-narrow { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
      .ts-section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 16px; }
      .ts-section-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; line-height: 1.15; }
      @media (min-width: 1024px) {
        .ts-section { padding: 64px 80px; }
        .ts-section-narrow { padding: 0 80px; }
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
      .ts-carousel-item { flex: 0 0 calc(50% - 6px); min-width: 0; }
      @media (min-width: 1024px) {
        .ts-carousel { gap: 16px; }
        .ts-carousel-item { flex: 0 0 calc(25% - 12px); }
      }

      /* Large marquees — NO uppercase, render text as typed */
      .ts-marquee {
        height: 72px; display: flex; align-items: center; overflow: hidden;
        font-size: 28px; font-weight: 700;
        text-transform: none;
        letter-spacing: 0.02em; line-height: 1;
      }
      .ts-marquee-track { display: inline-flex; white-space: nowrap; animation: tsScroll 25s linear infinite; }
      .ts-marquee-track > span { padding: 0 16px; }
      @keyframes tsScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

      .ts-icons-section { padding: 48px 20px; max-width: 1280px; margin: 0 auto; }
      @media (min-width: 1024px) { .ts-icons-section { padding: 64px 80px; } }
      .ts-icons-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
      @media (min-width: 768px) { .ts-icons-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }

      /* Testimonials — strict overflow */
      .ts-testimonials { overflow: hidden !important; padding-bottom: 48px !important; }
      .ts-pill-row { overflow: hidden !important; width: 100% !important; margin-bottom: 16px !important; }
      .ts-pill-track { display: inline-flex; gap: 12px; animation: tsPillL 35s linear infinite; }
      .ts-pill-track-rev { animation: tsPillR 35s linear infinite; }
      @keyframes tsPillL { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes tsPillR { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      .ts-pill {
        display: inline-flex !important; align-items: center !important; gap: 10px;
        background: #fff !important; border: 1px solid #ebebeb !important; border-radius: 9999px !important;
        padding: 10px 20px 10px 10px !important;
        white-space: nowrap !important; overflow: hidden !important; max-width: 380px !important;
        flex-shrink: 0;
      }
      .ts-pill p {
        white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
        max-width: 240px !important; font-size: 13px !important; color: #333 !important;
      }

      /* FAQ */
      .ts-faq-section { background: #ffffff; padding: 48px 20px; }
      @media (min-width: 768px) { .ts-faq-section { padding: 64px 40px; } }
      .ts-faq-wrap { max-width: 860px; margin: 0 auto; }
      .ts-faq-eyebrow { font-size: 14px; font-weight: 600; color: #111; margin-bottom: 8px; }
      .ts-faq-title { font-size: 28px; font-weight: 900; color: #111; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.1; }
      @media (min-width: 768px) { .ts-faq-title { font-size: 40px; } }
      .ts-faq-box { background: #dfdac8; border-radius: 16px; padding: 28px 20px; width: 100%; }
      @media (min-width: 768px) { .ts-faq-box { padding: 40px 40px 32px; } }
      .ts-faq-item { border-bottom: 1px solid rgba(0,0,0,0.12); padding: 20px 0; }
      .ts-faq-item:last-child { border-bottom: 0; }
      .ts-faq-q { font-size: 15px; font-weight: 600; color: #111; flex: 1; padding-right: 16px; }
      .ts-faq-icon {
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(0,0,0,0.08);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; color: #111; flex-shrink: 0;
      }
      .ts-faq-a { font-size: 14px; color: #555; line-height: 1.8; padding-top: 12px; animation: tsFade 0.2s ease; }
      .ts-faq-divider { border-top: 1px solid rgba(0,0,0,0.1); margin: 24px 0; }
      .ts-faq-help { font-size: 13px; color: #555; line-height: 1.6; text-align: center; margin-bottom: 16px; }
      .ts-faq-cta {
        background: #25D366; color: #fff; border: none; border-radius: 9999px;
        padding: 14px 40px; font-size: 15px; font-weight: 600; cursor: pointer;
        display: inline-flex; align-items: center; gap: 10px;
      }
      @media (max-width: 767px) { .ts-faq-cta { width: 100%; justify-content: center; } }
      @keyframes tsFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes tsShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }

      /* Achadinhos inline */
      .ts-achadinhos { position: relative; overflow: hidden; min-height: 320px; }
      @media (min-width: 768px) { .ts-achadinhos { min-height: 400px; } }
      .ts-achadinhos-bg {
        position: absolute; inset: 0;
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;
        filter: blur(3px); transform: scale(1.05); opacity: 0.6;
      }
      @media (min-width: 768px) {
        .ts-achadinhos-bg { grid-template-columns: repeat(4, 1fr); }
      }
      .ts-achadinhos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
      .ts-achadinhos-content {
        position: relative; z-index: 10;
        display: flex; align-items: center; justify-content: center;
        min-height: 320px; padding: 48px 20px;
      }
      @media (min-width: 768px) { .ts-achadinhos-content { min-height: 400px; } }
      .ts-achadinhos-card {
        background: #fff; border-radius: 16px; padding: 28px 20px;
        max-width: 420px; width: 100%; text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      }
      @media (min-width: 768px) { .ts-achadinhos-card { padding: 40px 32px; } }


      /* Banner numbered indicators */
      .ts-banner-indicators {
        position: absolute; bottom: 12px; right: 12px;
        display: flex; gap: 8px; align-items: center;
      }
      @media (min-width: 768px) {
        .ts-banner-indicators { bottom: 20px; right: 20px; gap: 10px; }
      }
      .ts-banner-ind {
        background: transparent; border: 0; padding: 0;
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        width: 36px; cursor: pointer;
      }
      @media (min-width: 768px) { .ts-banner-ind { width: 48px; } }
      .ts-banner-ind-num {
        font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5);
        font-family: 'DM Sans', sans-serif;
      }
      @media (min-width: 768px) { .ts-banner-ind-num { font-size: 12px; } }
      .ts-banner-ind-num.active { color: #fff; }
      .ts-banner-ind-bar {
        display: block; width: 100%; height: 2px;
        background: rgba(255,255,255,0.3); border-radius: 9999px; overflow: hidden;
      }
      @media (min-width: 768px) { .ts-banner-ind-bar { height: 3px; } }
      .ts-banner-ind-fill {
        display: block; height: 100%; background: #fff; border-radius: 9999px; width: 0;
      }
      .ts-banner-ind-fill.active { animation: tsBannerProgress 5s linear forwards; }
      .ts-banner-ind-fill.past { width: 100%; opacity: 0.5; }
      .ts-banner-ind-fill.future { width: 0; }
      @keyframes tsBannerProgress { from { width: 0%; } to { width: 100%; } }

      /* Floating WhatsApp pulse */
      .ts-fab { animation: tsWhatsappPulse 2s infinite; }
      @keyframes tsWhatsappPulse {
        0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.6); }
        70% { box-shadow: 0 0 0 18px rgba(37,211,102,0); }
        100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
      }
    `}</style>
  );
}
