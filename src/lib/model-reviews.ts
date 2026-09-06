import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractModelAndColor, useColorGroups } from "@/lib/color-groups";

export type ModelReview = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  text: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
};

/**
 * Approved reviews for every color variation of the same model
 * ("NK V2K - Branco" and "NK V2K - Marrom" share their reviews).
 */
export function useModelReviews(storeId: string, product: { id: string; title: string }) {
  const { map } = useColorGroups(storeId);
  const groupIds = map[product.id]?.product_ids;
  const model = extractModelAndColor(product.title).model;

  return useQuery({
    queryKey: ["model-reviews", storeId, product.id, groupIds?.join(",") ?? model],
    queryFn: async (): Promise<ModelReview[]> => {
      let ids = groupIds && groupIds.length > 0 ? groupIds : null;
      if (!ids) {
        // Fallback: match siblings by the model prefix in the product title.
        const { data: variants } = await supabase
          .from("products")
          .select("id")
          .eq("store_id", storeId)
          .or(`title.ilike.${model} -%,title.ilike.${model} |%,title.eq.${model}`);
        ids = variants?.map((v) => v.id as string) ?? [];
      }
      if (!ids.includes(product.id)) ids = [...ids, product.id];

      const { data } = await supabase
        .from("product_reviews")
        .select("id, product_id, customer_name, rating, text, photo_url, status, created_at")
        .in("product_id", ids)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return (data ?? []) as ModelReview[];
    },
    staleTime: 60_000,
  });
}
