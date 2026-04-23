import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront } from "@/components/storefront/StoreContext";
import { ShoppableVideo, type ShoppableTag } from "@/components/storefront/ShoppableVideo";
import { effectivePrice, formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VideoType } from "@/lib/video";

type SectionRow = {
  id: string;
  title: string;
  video_url: string | null;
  video_type: VideoType | null;
  is_active: boolean;
  position: number;
  aspect: string;
};

export function HomeVideoSection() {
  const { store } = useStorefront();

  const sectionsQ = useQuery({
    queryKey: ["home-video-sections", store.id],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_sections")
        .select("id, title, video_url, video_type, is_active, position, aspect")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("position", { ascending: true });
      return ((data ?? []) as SectionRow[]).filter((s) => s.video_url && s.video_type);
    },
  });

  const sectionIds = (sectionsQ.data ?? []).map((s) => s.id);
  const tagsQ = useQuery({
    queryKey: ["home-video-tags-multi", sectionIds.sort().join(",")],
    enabled: sectionIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_tags")
        .select("id, home_video_section_id, product_id, position_x, position_y, timestamp_start, timestamp_end")
        .in("home_video_section_id", sectionIds);
      return (data ?? []) as (ShoppableTag & { home_video_section_id: string })[];
    },
  });

  const productIds = Array.from(new Set((tagsQ.data ?? []).map((t) => t.product_id)));
  const productsQ = useQuery({
    queryKey: ["home-video-products-multi", productIds.sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, price, promo_price, product_images(url, position)")
        .in("id", productIds);
      return data ?? [];
    },
  });

  const sections = sectionsQ.data ?? [];
  const productMap = new Map((productsQ.data ?? []).map((p: any) => [p.id, p]));
  const tagsBySection = new Map<string, ShoppableTag[]>();
  for (const t of tagsQ.data ?? []) {
    const list = tagsBySection.get(t.home_video_section_id) ?? [];
    list.push({
      id: t.id,
      product_id: t.product_id,
      position_x: Number(t.position_x),
      position_y: Number(t.position_y),
      timestamp_start: t.timestamp_start,
      timestamp_end: t.timestamp_end,
    });
    tagsBySection.set(t.home_video_section_id, list);
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", update);
    };
  }, [emblaApi]);

  if (sections.length === 0) return null;

  const sectionTitle = sections[0]?.title ?? "Descubra em vídeo";

  return (
    <section className="my-10">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-5 text-center font-display text-2xl font-bold md:text-3xl">{sectionTitle}</h2>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 -ml-4 pl-4">
              {sections.map((section) => {
                const tags = tagsBySection.get(section.id) ?? [];
                const featuredTag = tags[0];
                const featuredProduct = featuredTag ? productMap.get(featuredTag.product_id) : null;
                return (
                  <VideoSlide
                    key={section.id}
                    section={section}
                    tags={tags}
                    featuredProduct={featuredProduct}
                    storeSlug={store.slug}
                  />
                );
              })}
            </div>
          </div>

          {sections.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                className={cn(
                  "absolute left-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex",
                  "h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur",
                  "border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
                aria-label="Vídeo anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                className={cn(
                  "absolute right-2 top-1/2 z-10 -translate-y-1/2 hidden md:flex",
                  "h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur",
                  "border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
                aria-label="Próximo vídeo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function VideoSlide({
  section,
  tags,
  featuredProduct,
  storeSlug,
}: {
  section: SectionRow;
  tags: ShoppableTag[];
  featuredProduct: any;
  storeSlug: string;
}) {
  const slideRef = useRef<HTMLDivElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const isVertical = (section.aspect ?? "vertical") === "vertical";

  // Autoplay-on-view via IntersectionObserver (only for upload/mp4)
  useEffect(() => {
    if (section.video_type === "youtube") return;
    const slide = slideRef.current;
    if (!slide) return;
    const video = slide.querySelector("video") as HTMLVideoElement | null;
    if (!video) return;
    videoElRef.current = video;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(slide);
    return () => io.disconnect();
  }, [section.video_type, section.video_url]);

  const price = featuredProduct
    ? effectivePrice(
        Number(featuredProduct.price),
        featuredProduct.promo_price ? Number(featuredProduct.promo_price) : null,
      )
    : 0;
  const hasPromo = featuredProduct?.promo_price && Number(featuredProduct.promo_price) < Number(featuredProduct.price);
  const productImg = featuredProduct
    ? (featuredProduct.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position)[0]?.url
    : null;

  return (
    <div
      ref={slideRef}
      className={cn(
        "min-w-0 shrink-0 grow-0 pl-4",
        isVertical
          ? "basis-[70%] sm:basis-[45%] md:basis-[32%] lg:basis-[24%] xl:basis-[20%]"
          : "basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[32%]",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-black shadow-lg",
          isVertical ? "aspect-[9/16]" : "aspect-video",
        )}
      >
        <ShoppableVideo
          videoUrl={section.video_url!}
          videoType={section.video_type!}
          tags={tags}
          mode="view"
          className="h-full w-full !aspect-auto !rounded-none"
        />

        {featuredProduct && (
          <Link
            to="/loja/$slug/produto/$productSlug"
            params={{ slug: storeSlug, productSlug: featuredProduct.slug }}
            className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2 rounded-xl bg-card/95 p-2 shadow-xl backdrop-blur transition hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {productImg && (
              <img
                src={productImg}
                alt={featuredProduct.title}
                className="h-10 w-10 shrink-0 rounded-md object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                {featuredProduct.title}
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-accent">{formatBRL(price)}</span>
                {hasPromo && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatBRL(Number(featuredProduct.price))}
                  </span>
                )}
              </div>
            </div>
            <Button size="sm" variant="default" className="h-7 shrink-0 px-2 text-[11px]">
              Ver
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
