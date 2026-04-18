import { createFileRoute, useParams } from "@tanstack/react-router";
import { CategoryListing } from "@/components/storefront/CategoryListing";

export const Route = createFileRoute("/_storefront/categoria/$slug")({
  component: CatPage,
});

function CatPage() {
  const { slug } = useParams({ from: "/_storefront/categoria/$slug" });
  return <CategoryListing categorySlug={slug} />;
}
