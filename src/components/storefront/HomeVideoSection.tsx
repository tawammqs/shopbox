import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStorefront } from "@/components/storefront/StoreContext";
import { ShoppableVideo, type ShoppableTag } from "@/components/storefront/ShoppableVideo";
import { effectivePrice, formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { VideoType } from "@/lib/video";

type SectionRow = {
  id: string;
  title: string;
  video_url: string | null;
  video_type: VideoType | null;
  is_active: boolean;
};

export function HomeVideoSection() {
  const { store } = useStorefront();
  const [activeTag, setActiveTag] = useState<{
    tag: ShoppableTag;
    product: any;
  } | null>(null);

  const sectionQ = useQuery({
    queryKey: ["home-video-section", store.id],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_sections")
        .select("id, title, video_url, video_type, is_active")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .maybeSingle();
      return (data ?? null) as SectionRow | null;
    },
  });

  const tagsQ = useQuery({
    queryKey: ["home-video-tags", sectionQ.data?.id],
    enabled: !!sectionQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_tags")
        .select("id, product_id, position_x, position_y, timestamp_start, timestamp_end")
        .eq("home_video_section_id", sectionQ.data!.id);
      return (data ?? []) as ShoppableTag[];
    },
  });

  const productIds = (tagsQ.data ?? []).map((t) => t.product_id);
  const productsQ = useQuery({
    queryKey: ["home-video-products", productIds.sort().join(",")],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, title, price, promo_price, product_images(url, position)")
        .in("id", productIds);
      return data ?? [];
    },
  });

  const section = sectionQ.data;
  if (!section || !section.video_url || !section.video_type) return null;

  const productMap = new Map((productsQ.data ?? []).map((p: any) => [p.id, p]));

  function handleTagClick(tag: ShoppableTag) {
    const product = productMap.get(tag.product_id);
    if (product) setActiveTag({ tag, product });
  }

  return (
    <section className="my-10">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-5 text-center font-display text-2xl font-bold md:text-3xl">
          {section.title}
        </h2>
        <div className="relative mx-auto max-w-5xl">
          <ShoppableVideo
            videoUrl={section.video_url}
            videoType={section.video_type}
            tags={tagsQ.data ?? []}
            mode="view"
            onTagClick={handleTagClick}
          />

          {activeTag && <TagPopover data={activeTag} onClose={() => setActiveTag(null)} storeSlug={store.slug} />}
        </div>
      </div>
    </section>
  );
}

function TagPopover({
  data,
  onClose,
  storeSlug,
}: {
  data: { tag: ShoppableTag; product: any };
  onClose: () => void;
  storeSlug: string;
}) {
  const { tag, product } = data;
  const img =
    (product.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position)[0]?.url ?? null;
  const price = effectivePrice(Number(product.price), product.promo_price ? Number(product.promo_price) : null);

  // Position popover near the tag, but constrained inside container
  const left = Math.min(Math.max(tag.position_x, 18), 82);
  const top = Math.min(Math.max(tag.position_y, 18), 82);

  return (
    <div
      className="absolute z-10 w-60 -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-xl"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <button
        onClick={onClose}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow"
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex gap-3">
        {img && <img src={img} alt={product.title} className="h-16 w-16 shrink-0 rounded-md object-cover" />}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold">{product.title}</p>
          <p className="mt-1 text-sm font-bold text-accent">{formatBRL(price)}</p>
        </div>
      </div>
      <Button asChild size="sm" className="mt-3 w-full">
        <Link to="/loja/$slug/produto/$productSlug" params={{ slug: storeSlug, productSlug: product.slug }}>
          Ver produto
        </Link>
      </Button>
    </div>
  );
}
