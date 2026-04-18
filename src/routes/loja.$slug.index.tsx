import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveBanners, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { BannerCarousel } from "@/components/storefront/BannerCarousel";
import { ProductRow } from "@/components/storefront/ProductRow";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";

export const Route = createFileRoute("/loja/$slug/")({
  component: HomePage,
});

function HomePage() {
  const { store } = Route.useRouteContext() as any; // not provided
  // Use parent loader data via Route api
  const parent = Route.useMatch();
  const storeData = (parent as any).loaderData ?? null;
  // Fallback: use match path
  return <HomeInner />;
}

function HomeInner() {
  const parentMatch = Route.useRouteContext();
  // Get store from parent loader through context lookup not exposed. Use direct via window? No — use match data.
  const router = (Route as any).useMatches?.();
  // Simplest: rely on parent through useStorefront
  return <HomeContent />;
}

function HomeContent() {
  const ctx = useStoreCtx();
  const storeId = ctx.store.id;

  const banners = useQuery({
    queryKey: ["banners", storeId],
    queryFn: () => fetchActiveBanners(storeId),
    staleTime: 60_000,
  });

  const tags = ["destaques", "lancamentos", "ofertas", "principal"] as const;
  const labels: Record<string, string> = {
    destaques: "Destaques",
    lancamentos: "Lançamentos",
    ofertas: "Ofertas",
    principal: "Principal",
  };

  const queries = tags.map((tag) =>
    useQuery({
      queryKey: ["products-by-tag", storeId, tag],
      queryFn: () => fetchProductsByTag(storeId, tag, 12),
      staleTime: 60_000,
    }),
  );

  return (
    <>
      {banners.data && <BannerCarousel banners={banners.data} />}
      {queries.map((q, i) => (
        <ProductRow key={tags[i]} title={labels[tags[i]]} products={(q.data ?? []) as ProductCardData[]} />
      ))}
      <CategoryGrid />
    </>
  );
}

// Helper to avoid prop-drilling: re-export the hook
import { useStorefront as useStoreCtx } from "@/components/storefront/StoreContext";
