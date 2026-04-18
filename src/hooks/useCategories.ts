import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  display_order: number;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function buildCategoryTree(cats: Category[]) {
  const top = cats.filter((c) => !c.parent_id);
  return top.map((t) => ({
    ...t,
    children: cats.filter((c) => c.parent_id === t.id),
  }));
}
