import { Link } from "@tanstack/react-router";
import { useColorGroups, getColorHex, isLightSwatch } from "@/lib/color-groups";
import { cn } from "@/lib/utils";

/** Shows the other color variations of the same model on the product page. */
export function ColorVariantsRow({
  storeId,
  storeSlug,
  productId,
}: {
  storeId: string;
  storeSlug: string;
  productId: string;
}) {
  const { map } = useColorGroups(storeId);
  const group = map[productId];
  if (!group || group.colors.length < 2) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs text-muted-foreground">Cores disponíveis:</p>
      <div className="flex flex-wrap gap-2">
        {group.colors.map((color, i) => {
          const hex = getColorHex(color);
          const isCurrent = group.product_ids[i] === productId;
          return (
            <Link
              key={group.product_ids[i]}
              to="/loja/$slug/produto/$productSlug"
              params={{ slug: storeSlug, productSlug: group.product_slugs[i] }}
              title={color}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                isCurrent ? "border-foreground font-semibold" : "border-border hover:border-muted-foreground",
              )}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full"
                style={{
                  backgroundColor: hex,
                  boxShadow: isLightSwatch(hex) ? "inset 0 0 0 1px #e5e7eb" : "none",
                }}
              />
              {color}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
