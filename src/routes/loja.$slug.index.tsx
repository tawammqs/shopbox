import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveBanners, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { BannerCarousel } from "@/components/storefront/BannerCarousel";
import { ProductRow } from "@/components/storefront/ProductRow";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { HomeVideoSection } from "@/components/storefront/HomeVideoSection";
import { useStorefront, useIsMioTheme } from "@/components/storefront/StoreContext";
import { useStorefrontHomepageSections, useStorefrontCustomizations } from "@/components/storefront/StorefrontCustomizer";
import { getSectionsOrder, isSectionVisible, type HomepageSectionKey } from "@/lib/homepage-sections";
import { SectionSwitch, TheShoesStyles } from "@/components/storefront/the-shoes/TheShoesHomepage";
import { Fragment } from "react";
import { TheShoesVipBanner } from "@/components/storefront/TheShoesExtras";
import { TheShoesHomepage } from "@/components/storefront/the-shoes/TheShoesHomepage";

export const Route = createFileRoute("/loja/$slug/")({
  component: HomePage,
});

// section id (do editor) -> tag de produtos
const TAG_BY_SECTION: Record<string, { tag: string; label: string }> = {
  "produtos-oferta": { tag: "ofertas", label: "Ofertas" },
  "produtos-destaque": { tag: "destaques", label: "Destaques" },
  "produtos-novos": { tag: "lancamentos", label: "Lançamentos" },
  "produto-principal": { tag: "principal", label: "Principal" },
};

const DEFAULT_ORDER = [
  "banners-rotativos",
  "produtos-oferta",
  "produtos-destaque",
  "produtos-novos",
  "video",
  "categorias-principais",
];

function HomePage() {
  const { store } = useStorefront();
  const isMio = useIsMioTheme();
  if (isMio) return <TheShoesHomepage />;
  return <DefaultHomePage storeId={store.id} storeSlug={store.slug} />;
}

function DefaultHomePage({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const { data: cust } = useStorefrontCustomizations(storeId);
  const hp = (cust?.homepage ?? {}) as any;
  const usesNewSchema =
    !!hp.sections_order || !!hp.sections_visibility || !!hp.sections_config;
  if (usesNewSchema) return <NewSchemaHomePage cust={cust} storeSlug={storeSlug} />;
  return <LegacyDefaultHomePage storeId={storeId} />;
}

function NewSchemaHomePage({ cust, storeSlug }: { cust: any; storeSlug: string }) {
  const order = getSectionsOrder(cust);
  const hp = (cust?.homepage ?? {}) as any;
  const visibleMap = (hp.sections_visibility ?? {}) as Record<string, boolean>;
  const configMap = (hp.sections_config ?? {}) as Record<string, any>;
  const isLojaAranha = storeSlug === "loja-aranha";
  const canRender = (key: HomepageSectionKey) => {
    if (!isLojaAranha) return isSectionVisible(cust, key);
    if (key in visibleMap) return !!visibleMap[key];
    return key in configMap;
  };
  return (
    <div className="ts-root">
      {order.map((key) => {
        if (key.startsWith("addon:")) return null;
        const sk = key as HomepageSectionKey;
        if (!canRender(sk)) return null;
        return <SectionSwitch key={key} sectionKey={sk} cust={cust} />;
      })}
      <TheShoesStyles />
    </div>
  );
}

function LegacyDefaultHomePage({ storeId }: { storeId: string }) {
  const banners = useQuery({
    queryKey: ["banners", storeId],
    queryFn: () => fetchActiveBanners(storeId),
    staleTime: 60_000,
  });
  const { data: sections } = useStorefrontHomepageSections(storeId);

  const order = sections?.order?.length ? sections.order : DEFAULT_ORDER;
  const visible = (id: string) => (sections?.map ? sections.map[id] !== false : DEFAULT_ORDER.includes(id));

  return (
    <>
      {order.map((id, i) => {
        if (!visible(id)) return null;
        if (id === "banners-rotativos") {
          return banners.data ? <BannerCarousel key={id} banners={banners.data} /> : null;
        }
        if (TAG_BY_SECTION[id]) {
          const t = TAG_BY_SECTION[id];
          return (
            <Fragment key={id}>
              <TagRow storeId={storeId} tag={t.tag} label={t.label} />
              {i === 0 && <TheShoesVipBanner />}
            </Fragment>
          );
        }
        if (id === "video") return <HomeVideoSection key={id} />;
        if (id === "categorias-principais" || id === "banners-categorias") return <CategoryGrid key={id} />;
        return null;
      })}
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
