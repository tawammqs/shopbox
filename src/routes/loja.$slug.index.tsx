import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveBanners, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { BannerCarousel } from "@/components/storefront/BannerCarousel";
import { ProductRow } from "@/components/storefront/ProductRow";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { HomeVideoSection } from "@/components/storefront/HomeVideoSection";
import { useStorefront } from "@/components/storefront/StoreContext";
import { Fragment } from "react";
import { TheShoesVipBanner } from "@/components/storefront/TheShoesExtras";
import { TheShoesHomepage } from "@/components/storefront/the-shoes/TheShoesHomepage";

export const Route = createFileRoute("/loja/$slug/")({
  component: HomePage,
});

const TAGS = [
  { tag: "destaques", label: "Destaques" },
  { tag: "lancamentos", label: "Lançamentos" },
  { tag: "ofertas", label: "Ofertas" },
  { tag: "principal", label: "Principal" },
] as const;

function HomePage() {
  const { store } = useStorefront();
  if (store.slug === "the-shoes") return <TheShoesHomepage />;
  return <DefaultHomePage storeId={store.id} />;
}

function DefaultHomePage({ storeId }: { storeId: string }) {
  const banners = useQuery({
    queryKey: ["banners", storeId],
    queryFn: () => fetchActiveBanners(storeId),
    staleTime: 60_000,
  });

  return (
    <>
      {banners.data && <BannerCarousel banners={banners.data} />}
      {TAGS.map((t, i) => (
        <Fragment key={t.tag}>
          <TagRow storeId={store.id} tag={t.tag} label={t.label} />
          {i === 0 && <TheShoesVipBanner />}
        </Fragment>
      ))}
      <HomeVideoSection />
      <CategoryGrid />
    </>
  );
}

function TagRow({ storeId, tag, label }: { storeId: string; tag: string; label: string }) {
  const q = useQuery({
    queryKey: ["products-by-tag", storeId, tag],
    queryFn: () => fetchProductsByTag(storeId, tag, 12),
    staleTime: 60_000,
  });
  return <ProductRow title={label} products={(q.data ?? []) as ProductCardData[]} />;
}
