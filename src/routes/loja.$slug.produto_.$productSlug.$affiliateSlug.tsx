import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStorefront } from "@/components/storefront/StoreContext";
import { savePendingAffiliateRef } from "@/lib/affiliates";
import { ProductPageContent } from "./loja.$slug.produto.$productSlug";

/**
 * Affiliate product link: /loja/[slug]/produto/[product-slug]/[affiliate-slug]
 * Renders the normal product page and remembers the affiliate for checkout.
 */
export const Route = createFileRoute("/loja/$slug/produto_/$productSlug/$affiliateSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `Produto — indicação de ${params.affiliateSlug}` },
      { name: "description", content: "Veja este produto e compre pelo WhatsApp." },
      { property: "og:title", content: "Produto recomendado" },
      { property: "og:description", content: "Veja este produto e compre pelo WhatsApp." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductWithAffiliatePage,
});

function ProductWithAffiliatePage() {
  const { slug, productSlug, affiliateSlug } = Route.useParams();
  const { store } = useStorefront();

  useEffect(() => {
    if (affiliateSlug && store.affiliates_enabled) savePendingAffiliateRef(slug, affiliateSlug);
  }, [slug, affiliateSlug, store.affiliates_enabled]);

  return <ProductPageContent productSlug={productSlug} />;
}
