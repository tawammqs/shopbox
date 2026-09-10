import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  CreditCard,
  ShieldCheck,
  Tag,
  Package,
  Percent,
  Gift,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProductsByHomepageSection, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { useStorefront } from "../StoreContext";
import { cn } from "@/lib/utils";
import { AffiliateShareButton } from "@/components/storefront/AffiliateShare";

import type {
  BannerRotativoCfg,
  ProductsTagCfg,
  ProductsCategoryCfg,
  MarqueeCfg,
  FretePagamentoCfg,
  BannerCategoriasCfg,
  InstagramCfg,
  FaqCfg,
  DepoimentosCfg,
  VideoSectionCfg,
  ProdutoPrincipalCfg,
  CategoriasPrincipaisCfg,
} from "@/lib/homepage-sections";
import type { ProductSectionKey } from "@/lib/product-sections";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Truck, CreditCard, ShieldCheck, Tag, Package, Percent, Gift, Clock,
};

// ============== Reused: product card from existing TheShoesHomepage ==============
// Mirror of TsProductCard but extracted; keep visual identical.
import { Heart } from "lucide-react";
import { effectivePrice, comparePrice, formatBRL } from "@/lib/format";
import { useProductPromo } from "@/lib/promotions";
import { PromoTimer } from "@/components/storefront/PromoTimer";
import { getInstallment } from "@/lib/installments";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/tracking";
import { useCardVariant, ColorSwatches, CardRating } from "@/components/storefront/ProductCardVariants";
import { useColorGroups, dedupeByGroup } from "@/lib/color-groups";

function ProductCardMio({ p }: { p: ProductCardData }) {
  const { store } = useStorefront();
  const addItem = useCart((s) => s.addItem);
  const wished = useWishlist((s) => s.has(p.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const promo = useProductPromo(store.id, p);
  const price = promo.price;
  const { struck, pct } = comparePrice(p, price);
  const { group, idx, setVariantIdx, targetSlug, img1, img2, title } = useCardVariant(store.id, p);
  const [hover, setHover] = useState(false);
  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (p.colors.length > 0 || group) { window.location.href = `/loja/${store.slug}/produto/${targetSlug}`; return; }
    addItem({
      productId: p.id, slug: p.slug, title: p.title, image: img1,
      colorId: null, colorName: null, sizeId: null, sizeLabel: null,
      unitPrice: price, quantity: 1, storeId: store.id,
    });
    void trackAddToCart(store, { id: p.id, title: p.title, value: price, quantity: 1 });
    toast.success("Adicionado ao carrinho");
  };
  return (
    <Link to="/loja/$slug/produto/$productSlug" params={{ slug: store.slug, productSlug: targetSlug }}
      className="group block" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-[#f7f7f7]">
        {img1 && <img src={img1} alt={p.title} loading="lazy" className={cn("h-full w-full object-cover transition-opacity duration-500", hover && img2 !== img1 && "opacity-0")} />}
        {img2 && img2 !== img1 && <img src={img2} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500", hover && "opacity-100")} />}
        {pct > 0 && (
          <span className="absolute left-2 top-2 rounded bg-[var(--store-accent,#111)] text-white" style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px" }}>
            ATÉ {pct}% OFF
          </span>
        )}
        <button onClick={(e) => { e.preventDefault(); toggleWish(p.id); }} aria-label="Favoritar"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#333] shadow-sm hover:bg-white">
          <Heart className={cn("h-[14px] w-[14px]", wished && "fill-[#111] text-[#111]")} />
        </button>
        <AffiliateShareButton productSlug={targetSlug} />
        <button onClick={quickAdd}
          className="absolute inset-x-2 bottom-2 hidden items-center justify-center rounded-full bg-[var(--store-accent,#111)] py-2 text-[11px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 md:flex">
          {p.colors.length > 0 || group ? "ESCOLHER OPÇÕES" : "ADICIONAR"}
        </button>
      </div>
      <div className="px-1 pt-3 pb-1">
        {p.brand && <p className="mb-[2px] text-[11px] font-medium uppercase text-[#aaa]" style={{ letterSpacing: "0.05em" }}>{p.brand}</p>}
        <div className="flex items-start justify-between gap-2" style={{ marginBottom: 6 }}>
          <h3 className="line-clamp-2 flex-1 text-[14px] font-semibold leading-snug text-[#111]">{title}</h3>
          <AffiliateShareButton productSlug={targetSlug} variant="text" />
        </div>
        <CardRating storeId={store.id} productId={p.id} productIds={group?.product_ids} className="mb-1.5" />
        <ColorSwatches group={group} idx={idx} onSelect={setVariantIdx} className="mb-1.5" />
        <div className="flex items-baseline">
          {struck ? (
            <>
              <span className="text-[16px] font-bold text-[var(--store-accent,#111)]">{formatBRL(price)}</span>
              <span className="ml-2 text-[13px] font-normal text-[#aaa] line-through">{formatBRL(struck)}</span>
            </>
          ) : (
            <span className="text-[16px] font-semibold text-[#111]">{formatBRL(price)}</span>
          )}
        </div>
        {promo.hasTimedPromo && promo.promotion?.ends_at && (
          <PromoTimer endsAt={promo.promotion.ends_at} label={promo.promotion.timer_label} onExpire={promo.onExpire} />
        )}
        {(() => {
          const inst = getInstallment(p.price, price);
          if (!inst.show) return null;
          return <span style={{ display: "block", fontSize: 11, color: "#aaa", marginTop: 2 }}>3x de {inst.formatted} sem juros</span>;
        })()}
      </div>
    </Link>
  );
}

// ============== 1. Banners rotativos (numbered indicators) ==============
export function BannersRotativosRender({ cfg }: { cfg: BannerRotativoCfg }) {
  const items = (cfg.items ?? []).filter((b) => b.desktop_url || b.mobile_url);
  const interval = cfg.interval_seconds ?? 5;
  const autoplay = useRef(cfg.autoplay !== false ? Autoplay({ delay: interval * 1000, stopOnInteraction: false }) : null);
  const plugins = autoplay.current ? [autoplay.current] : [];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, plugins);
  const [selected, setSelected] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => {
    if (!emblaApi) return;
    const onSel = () => { setSelected(emblaApi.selectedScrollSnap()); setAnimKey((k) => k + 1); };
    emblaApi.on("select", onSel); onSel();
    return () => { emblaApi.off("select", onSel); };
  }, [emblaApi]);

  if (items.length === 0) return null;

  return (
    <section className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((b, i) => {
            const desk = b.desktop_url || b.mobile_url;
            const mob = b.mobile_url || b.desktop_url;
            const inner = (
              <div className="relative min-w-0 flex-[0_0_100%]">
                <picture>
                  {mob && <source media="(max-width: 768px)" srcSet={mob} />}
                  <img src={desk} alt="" className="block h-[55vh] max-h-[600px] min-h-[280px] w-full object-cover md:h-[520px]" />
                </picture>
              </div>
            );
            return b.link ? (
              <a key={i} href={b.link} className="contents">{inner}</a>
            ) : (
              <div key={i} className="contents">{inner}</div>
            );
          })}
        </div>
      </div>
      {items.length > 1 && (
        <>
          <button aria-label="Anterior" onClick={() => emblaApi?.scrollPrev()} className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
          <button aria-label="Próximo" onClick={() => emblaApi?.scrollNext()} className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
          <div className="ts-banner-indicators">
            {items.map((_, i) => {
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

// ============== 2/3. Produtos por tag ==============
function useDedupedProducts(products: ProductCardData[]) {
  const { store } = useStorefront();
  const { map } = useColorGroups(store.id);
  return dedupeByGroup(products, map);
}

export function ProductsGrid({ products: raw }: { products: ProductCardData[] }) {
  const products = useDedupedProducts(raw);
  return (
    <div className="ts-mobile-scroll -mx-4 flex gap-3 overflow-x-auto pl-4 pr-8 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {products.map((p) => (
        <div key={p.id} className="w-[72%] shrink-0 md:w-auto">
          <ProductCardMio p={p} />
        </div>
      ))}
    </div>
  );
}

function ProductsCarousel({ products: raw }: { products: ProductCardData[] }) {
  const products = useDedupedProducts(raw);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  return (
    <>
      <div className="mb-3 hidden justify-end gap-2 md:flex">
        <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior" className="ts-circle-btn">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo" className="ts-circle-btn">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="ts-carousel">
          {products.map((p) => (
            <div key={p.id} className="ts-carousel-item">
              <ProductCardMio p={p} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ProductsByTagRender({ cfg, defaultTag }: { cfg: ProductsTagCfg; defaultTag: string }) {
  const { store } = useStorefront();
  const tag = cfg.tag || defaultTag;
  const limit = cfg.limit ?? 8;
  // STRICT mapping: tag → canonical section key. Only products that explicitly
  // carry the tag in featured_sections / tags will show. No fallback.
  const sectionKey = mapTagToSection(tag);
  const q = useQuery({
    queryKey: sectionKey
      ? ["mio-products-section", store.id, sectionKey, limit]
      : ["mio-products-tag-raw", store.id, tag, limit],
    queryFn: () =>
      sectionKey
        ? fetchProductsByHomepageSection(store.id, sectionKey, limit)
        : fetchProductsByTag(store.id, tag, limit),
    staleTime: 60_000,
  });
  const products = (q.data ?? []) as ProductCardData[];
  if (products.length === 0) return null;
  const mode = cfg.display_mode ?? "carousel";
  return (
    <section className="ts-section">
      <div className="ts-section-head">
        <h2 className="ts-section-title">{cfg.title || "Produtos"}</h2>
        {cfg.show_more_button !== false && (
          <Link to="/loja/$slug/produtos" params={{ slug: store.slug }} search={{ tag: sectionKey ?? tag }} className="text-sm font-medium text-[#666] hover:text-[#111]">Ver mais →</Link>
        )}
      </div>
      {mode === "carousel" ? <ProductsCarousel products={products} /> : <ProductsGrid products={products} />}
    </section>
  );
}

function mapTagToSection(tag: string): ProductSectionKey | null {
  const t = tag.toLowerCase();
  if (["destaque", "destaques", "featured"].includes(t)) return "destaque";
  if (["lancamento", "lançamento", "lancamentos", "lançamentos", "novos"].includes(t)) return "lancamento";
  if (["promocao", "promoção", "oferta", "ofertas", "sale"].includes(t)) return "promocao";
  if (["mais_vendido", "mais_vendidos", "mais vendidos", "best_seller"].includes(t)) return "mais_vendido";
  return null;
}

// ============== 4. Produtos novos — STRICT by tag "lancamento" ==============
export function ProductsByCategoryRender({ cfg }: { cfg: ProductsCategoryCfg }) {
  const { store } = useStorefront();
  const limit = cfg.limit ?? 8;
  const q = useQuery({
    queryKey: ["mio-products-section", store.id, "lancamento", limit],
    queryFn: () => fetchProductsByHomepageSection(store.id, "lancamento", limit),
    staleTime: 60_000,
  });
  const products = q.data ?? [];
  if (products.length === 0) return null;
  const mode = cfg.display_mode ?? "carousel";
  return (
    <section className="ts-section">
      <div className="ts-section-head">
        <h2 className="ts-section-title">{cfg.title || "Lançamentos"}</h2>
      </div>
      {mode === "carousel" ? <ProductsCarousel products={products} /> : <ProductsGrid products={products} />}
    </section>
  );
}

// ============== Produto Principal — single product + countdown ==============
export function ProdutoPrincipalRender({ cfg }: { cfg: ProdutoPrincipalCfg }) {
  const { store } = useStorefront();
  const productQ = useQuery({
    queryKey: ["produto-principal", store.id, cfg.product_id],
    enabled: !!cfg.product_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(`id, slug, title, brand, brand_name, price, promo_price, original_price,
                 product_images(url, position)`)
        .eq("id", cfg.product_id!)
        .eq("store_id", store.id)
        .eq("active", true)
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!cfg.show_countdown || !cfg.promotion_ends_at) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [cfg.show_countdown, cfg.promotion_ends_at]);

  if (!cfg.product_id) return null;
  if (cfg.promotion_ends_at && new Date(cfg.promotion_ends_at).getTime() <= now) return null;
  const product: any = productQ.data;
  if (!product) return null;

  const img = (product.product_images ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0]?.url ?? "";
  const price = effectivePrice(Number(product.price), product.promo_price != null ? Number(product.promo_price) : null);
  const { struck } = comparePrice(product, price);

  let timeLeft: { d: number; h: number; m: number; s: number } | null = null;
  if (cfg.show_countdown && cfg.promotion_ends_at) {
    const diff = new Date(cfg.promotion_ends_at).getTime() - now;
    if (diff > 0) {
      timeLeft = {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    }
  }

  return (
    <section className="ts-section">
      {cfg.title && <h2 className="ts-section-title mb-3">{cfg.title}</h2>}
      <ProdutoPrincipalCard
        product={product}
        img={img}
        price={price}
        struck={struck}
        endsAt={cfg.show_countdown && timeLeft ? cfg.promotion_ends_at! : null}
      />
    </section>
  );
}

function ProdutoPrincipalCard({
  product, img, price, struck, endsAt,
}: { product: any; img: string; price: number; struck: number | null; endsAt: string | null }) {
  const { store } = useStorefront();
  const { map } = useColorGroups(store.id);
  const group = map[product.id];
  const [variantIdx, setVariantIdx] = useState(() => Math.max(0, group?.product_ids?.indexOf(product.id) ?? 0));
  const idx = group ? Math.min(variantIdx, (group.product_ids?.length ?? 1) - 1) : 0;
  const isBase = !group || group.product_ids[idx] === product.id;
  const targetSlug = group ? (group.product_slugs?.[idx] ?? product.slug) : product.slug;
  const image = (isBase ? img : group?.first_images?.[idx]) || img;
  const brand = product.brand_name ?? product.brand;

  return (
    <Link
      to="/loja/$slug/produto/$productSlug"
      params={{ slug: store.slug, productSlug: targetSlug }}
      className="block overflow-hidden rounded-2xl bg-[#f7f7f7] p-3 transition hover:bg-[#f1f1f1] md:p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
        {image && (
          <img
            src={image}
            alt={group ? group.model_name : product.title}
            className="w-full shrink-0 rounded-xl bg-white object-cover md:w-56"
            style={{ aspectRatio: "1 / 1" }}
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          {brand && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#888]">{brand}</p>
          )}
          <h3 className="line-clamp-2 text-sm font-medium text-[#111] md:text-lg md:font-semibold">
            {group ? group.model_name : product.title}
          </h3>
          <ColorSwatches group={group} idx={idx} onSelect={setVariantIdx} className="pt-0.5" />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[var(--store-accent,#111)] md:text-xl">{formatBRL(price)}</span>
            {struck && <span className="text-xs text-[#aaa] line-through md:text-sm">{formatBRL(struck)}</span>}
          </div>
          {endsAt && <PromoTimer endsAt={endsAt} />}
          <CardRating storeId={store.id} productId={product.id} productIds={group?.product_ids} />
        </div>
      </div>
    </Link>
  );
}


function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid min-w-[44px] place-items-center rounded-lg bg-[#111] px-2 py-1 text-white">
      <div className="text-sm font-bold leading-none">{String(value).padStart(2, "0")}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[#bbb]">{label}</div>
    </div>
  );
}

// ============== 5/6. Marquee ==============
export function MarqueeRender({ cfg }: { cfg: MarqueeCfg }) {
  if (!cfg.text) return null;
  const speed = cfg.speed ?? 15;
  const fontSize = cfg.font_size ?? 16;
  const uppercase = !!cfg.uppercase;
  return (
    <div className="overflow-hidden" style={{ background: cfg.background, color: cfg.text_color }}>
      <div
        className="flex whitespace-nowrap py-3 font-semibold"
        style={{
          animation: `mioMarquee ${speed}s linear infinite`,
          fontSize: `${fontSize}px`,
          textTransform: uppercase ? "uppercase" : "none",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="px-6">{cfg.text} ·</span>
        ))}
      </div>
      <style>{`@keyframes mioMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ============== 7. Frete / pagamento (carousel mobile + desktop) ==============
export function FretePagamentoRender({ cfg }: { cfg: FretePagamentoCfg }) {
  const items = (cfg.items ?? []).filter((it) => it.title);
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef] = useEmblaCarousel(
    { align: "start", loop: items.length > 2, dragFree: false, containScroll: "trimSnaps" },
    items.length > 2 ? [autoplay.current] : [],
  );
  if (items.length === 0) return null;
  return (
    <section className="py-10 px-4" style={{ background: cfg.background }}>
      <div className="mx-auto max-w-6xl overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((it, i) => {
            const Icon = ICON_MAP[it.icon] || Truck;
            return (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-1/2 px-3 md:basis-1/4">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-full" style={{ background: cfg.icon_color, color: cfg.background }}>
                    <Icon size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#111]">{it.title}</p>
                  {it.description && <p className="mt-1 text-xs text-[#444]">{it.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============== 8. Banners de categorias ==============
export function BannersCategoriasRender({ cfg }: { cfg: BannerCategoriasCfg }) {
  const { store, categories } = useStorefront();
  const items = (cfg.items ?? []).filter((it) => it.category_id && (it.desktop_url || it.mobile_url));
  if (items.length === 0) return null;
  return (
    <section className="ts-section">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((it, i) => {
          const cat = categories.find((c) => c.id === it.category_id);
          if (!cat) return null;
          return (
            <Link key={i} to="/loja/$slug/categoria/$categorySlug" params={{ slug: store.slug, categorySlug: cat.slug }} className="block overflow-hidden rounded-xl">
              <picture>
                {it.mobile_url && <source media="(max-width: 768px)" srcSet={it.mobile_url} />}
                <img src={it.desktop_url || it.mobile_url} alt={cat.name} className="h-44 w-full object-cover transition hover:scale-105 md:h-52" />
              </picture>
              <p className="mt-2 text-center text-sm font-semibold text-[#111]">{cat.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ============== 9. Instagram ==============
export function InstagramRender({ cfg }: { cfg: InstagramCfg }) {
  const photos = cfg.photos ?? [];
  if (photos.length === 0) return null;
  const clean = (cfg.handle || "").replace(/^@/, "");
  const profile = clean ? `https://instagram.com/${clean}` : undefined;
  return (
    <section className="px-5 py-12 text-center">
      <h2 className="mb-2 text-[22px] font-bold text-[#111]">{cfg.title || "Siga no Instagram"}</h2>
      {clean && (
        <a href={profile} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#111] underline">@{clean}</a>
      )}
      <div className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4">
        {photos.slice(0, 12).map((url, i) => {
          const inner = <img src={url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover transition hover:scale-[1.03]" />;
          return profile ? <a key={i} href={profile} target="_blank" rel="noreferrer">{inner}</a> : <div key={i}>{inner}</div>;
        })}
      </div>
    </section>
  );
}

// ============== 10. FAQ ==============
export function FaqRender({ cfg }: { cfg: FaqCfg }) {
  const items = (cfg.items ?? []).filter((it) => it.question);
  const [open, setOpen] = useState<number | null>(null);
  if (items.length === 0) return null;
  const bg = cfg.background || "#dfdac8";
  const txt = cfg.text_color || "#0f0f0f";
  return (
    <section className="px-5 py-12">
      <div className="mx-auto max-w-3xl text-center">
        {cfg.subtitle && <p className="mb-2 text-sm font-semibold" style={{ color: txt }}>{cfg.subtitle}</p>}
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight" style={{ color: txt }}>{cfg.title || "Perguntas Frequentes"}</h2>
        <div className="rounded-2xl p-6 text-left" style={{ background: bg, color: txt }}>
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b py-4 last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 text-left">
                  <span className="text-base font-semibold" style={{ color: txt }}>{it.question}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10" style={{ color: txt }}>{isOpen ? "∧" : "∨"}</span>
                </button>
                {isOpen && <div className="pt-3 text-sm leading-relaxed" style={{ color: txt, opacity: 0.75 }}>{it.answer}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============== 11. Depoimentos (pills rolando) ==============
export function DepoimentosRender({ cfg }: { cfg: DepoimentosCfg }) {
  const items = (cfg.items ?? []).filter((it) => it.name || it.text);
  if (items.length === 0) return null;
  const bg = cfg.background || "#ffffff";
  const txt = cfg.text_color || "#111111";
  const half = Math.ceil(items.length / 2);
  const row1 = items.slice(0, half);
  const row2 = items.slice(half).length ? items.slice(half) : items;
  const dup1 = [...row1, ...row1];
  const dup2 = [...row2, ...row2];

  return (
    <section className="py-12" style={{ background: bg, color: txt }}>
      {cfg.title && (
        <h2 className="mb-10 text-center text-[26px] font-extrabold" style={{ color: txt, letterSpacing: "-0.5px" }}>
          {cfg.title}
        </h2>
      )}
      <div className="overflow-hidden">
        <div className="flex gap-3 whitespace-nowrap" style={{ animation: "depPillLeft 35s linear infinite" }}>
          {dup1.map((t, i) => <DepPill key={`a-${i}`} t={t} txt={txt} />)}
        </div>
      </div>
      <div className="mt-3 overflow-hidden">
        <div className="flex gap-3 whitespace-nowrap" style={{ animation: "depPillRight 35s linear infinite" }}>
          {dup2.map((t, i) => <DepPill key={`b-${i}`} t={t} txt={txt} />)}
        </div>
      </div>
      <style>{`
        @keyframes depPillLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes depPillRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </section>
  );
}

function DepPill({ t, txt }: { t: { name: string; text: string; rating?: number; image_url?: string }; txt: string }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-3 rounded-full border bg-white/80 px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      {t.image_url ? (
        <img src={t.image_url} alt={t.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0f0f0] text-[12px] font-bold text-[#666]">
          {t.name?.[0] ?? "?"}
        </div>
      )}
      <div className="max-w-[260px] whitespace-normal">
        <p className="text-[12px] font-semibold" style={{ color: txt }}>
          {t.name}{t.rating ? <span className="ml-1 text-[#f5a623]">{"★".repeat(t.rating)}</span> : null}
        </p>
        <p className="text-[12px] leading-tight" style={{ color: txt, opacity: 0.75 }}>{t.text}</p>
      </div>
    </div>
  );
}

// ============== 12. Vídeo (carrossel da home, gerenciado em Video Commerce) ==============
export function VideoSectionRender({ cfg }: { cfg: VideoSectionCfg }) {
  const { store } = useStorefront();
  // Gate on video_commerce addon: hidden when addon inactive or its
  // config.active was toggled off in the layout editor.
  const addonGateQ = useQuery({
    queryKey: ["mio-home-videos-gate", store.id],
    queryFn: async () => {
      const [statusRes, cfgRes] = await Promise.all([
        supabase.from("store_addons").select("status").eq("store_id", store.id).eq("addon_key", "video_commerce").maybeSingle(),
        supabase.from("store_addon_configs").select("config").eq("store_id", store.id).eq("addon_key", "video_commerce").maybeSingle(),
      ]);
      const status = (statusRes.data as any)?.status as string | undefined;
      const config = ((cfgRes.data as any)?.config ?? {}) as { active?: boolean };
      return { addonActive: status === "active", visible: config.active !== false };
    },
    staleTime: 30_000,
  });
  const gate = addonGateQ.data;
  const videosQ = useQuery({
    queryKey: ["mio-home-videos", store.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_videos")
        .select("id, video_url, thumbnail_url, product_id, title, position")
        .eq("store_id", store.id)
        .eq("placement", "home_carousel")
        .order("position", { ascending: true });
      return data ?? [];
    },
    staleTime: 60_000,
    enabled: gate?.addonActive === true && gate?.visible === true,
  });
  const videos = videosQ.data ?? [];
  const productIds = videos.map((v) => v.product_id).filter(Boolean) as string[];
  const productsQ = useQuery({
    queryKey: ["mio-home-videos-products", productIds.sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, price, promo_price, product_images(url, position)")
        .in("id", productIds);
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  if (videos.length === 0) return null;
  const productsById = new Map<string, any>((productsQ.data ?? []).map((p: any) => [p.id, p]));
  const active = activeIdx != null ? videos[activeIdx] : null;
  const activeProduct = active?.product_id ? productsById.get(active.product_id) : null;
  const activeImages = (activeProduct?.product_images ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
  const activeThumb = activeImages[0]?.url ?? active?.thumbnail_url ?? "";
  return (
    <section className="ts-section">
      <h2 className="mb-8 text-center text-[26px] font-extrabold text-[#111]" style={{ letterSpacing: "-0.5px" }}>
        {cfg.title || "Veja mais detalhes em vídeo"}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 md:gap-4" style={{ scrollbarWidth: "thin" }}>
        {videos.map((v, idx) => {
          const product = v.product_id ? productsById.get(v.product_id) : null;
          const images = (product?.product_images ?? []).slice().sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
          const thumb = images[0]?.url ?? v.thumbnail_url ?? "";
          const price = product ? Number(product.promo_price ?? product.price ?? 0) : 0;
          const original = product?.promo_price != null ? Number(product.price) : null;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className="relative block aspect-[9/16] w-[160px] shrink-0 overflow-hidden rounded-[16px] bg-[#f5f5f5] text-left md:w-[200px]"
            >
              {v.video_url ? (
                <video src={v.video_url} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : thumb ? (
                <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : null}
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white">
                  <span className="ml-[2px] text-[14px]">▶</span>
                </div>
              </div>
              {product && (
                <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-[10px] bg-white px-3 py-2">
                  {thumb && <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#111]">{product.title}</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-[13px] font-bold text-[#111]">{formatBRL(price)}</span>
                      {original != null && <span className="text-[11px] text-[#aaa] line-through">{formatBRL(original)}</span>}
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <VideoSectionPlayerModal
          videoUrl={active.video_url}
          product={activeProduct}
          thumb={activeThumb}
          storeSlug={store.slug}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </section>
  );
}

function VideoSectionPlayerModal({
  videoUrl, product, thumb, storeSlug, onClose,
}: {
  videoUrl: string | null;
  product: any;
  thumb: string;
  storeSlug: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const goToProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.slug) return;
    onClose();
    navigate({ to: "/loja/$slug/produto/$productSlug", params: { slug: storeSlug, productSlug: product.slug } });
  };
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="relative aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {videoUrl ? (
          <video src={videoUrl} autoPlay controls playsInline className="h-full w-full object-contain" />
        ) : null}

        <button
          type="button"
          aria-label="Fechar"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white"
        >
          ✕
        </button>

        {product?.slug && (
          <button
            type="button"
            onClick={goToProduct}
            className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2 text-left shadow-lg backdrop-blur transition hover:bg-white"
          >
            {thumb && <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[13px] font-semibold text-[#111]">{product.title}</p>
              <p className="text-[12px] font-medium text-[#111]/70">Ver produto →</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ============== Categorias principais (grid / carrossel) ==============
export function CategoriasPrincipaisRender({ cfg }: { cfg: CategoriasPrincipaisCfg }) {
  const { store, categories } = useStorefront();
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const items = (cfg.items ?? []).filter((it) => (it.title || "").trim() || it.image_url);
  if (items.length === 0) return null;

  const hrefFor = (it: (typeof items)[number]) => {
    if (it.link_type === "category" && it.category_id) {
      const c = categories.find((x) => x.id === it.category_id);
      if (c) return `/loja/${store.slug}/categoria/${c.slug}`;
      return `/loja/${store.slug}`;
    }
    const url = (it.url || "").trim();
    if (!url) return `/loja/${store.slug}`;
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return path.startsWith("/loja/") ? path : `/loja/${store.slug}${path}`;
  };

  const card = (it: (typeof items)[number]) => (
    <a key={it.id} href={hrefFor(it)} className="ts-cat-item flex w-[80px] flex-col items-center text-center md:w-[100px]">
      <div
        className="h-[80px] w-[80px] overflow-hidden transition duration-300 hover:scale-105 md:h-[100px] md:w-[100px]"
        style={{
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {it.image_url ? (
          <img src={it.image_url} alt={it.title} loading="lazy" style={{ width: "75%", height: "75%", objectFit: "contain" }} />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl font-bold uppercase text-[#111]">{(it.title || "?").slice(0, 1)}</div>
        )}
      </div>
      <p className="mt-2 w-full text-center text-[13px] font-semibold leading-tight text-[#111]">{it.title}</p>
    </a>
  );

  return (
    <section className="ts-section">
      <div className="ts-section-head">
        <div className="min-w-0">
          <h2 className="ts-section-title">{cfg.title || "Categorias"}</h2>
        </div>
        {cfg.display_mode !== "grid" && items.length > 6 && (
          <div className="hidden gap-2 md:flex">
            <button onClick={() => emblaApi?.scrollPrev()} aria-label="Anterior" className="ts-circle-btn">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => emblaApi?.scrollNext()} aria-label="Próximo" className="ts-circle-btn">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {cfg.display_mode === "grid" ? (
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4 md:gap-6">
          {items.map((it) => card(it))}
        </div>
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className={cn("flex gap-4 md:gap-6", items.length <= 6 && "md:justify-center")}>
            {items.map((it) => (
              <div key={it.id} className="shrink-0">
                {card(it)}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
