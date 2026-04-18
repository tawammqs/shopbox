import { createFileRoute, useParams } from "@tanstack/react-router";
import { CategoryListing } from "@/components/storefront/CategoryListing";

export const Route = createFileRoute("/_storefront/categoria/$slug/$sub")({
  component: SubCatPage,
});

function SubCatPage() {
  const { slug, sub } = useParams({ from: "/_storefront/categoria/$slug/$sub" });
  return <CategoryListing categorySlug={slug} subSlug={sub} />;
}
