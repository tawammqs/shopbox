import { supabase } from "@/integrations/supabase/client";

export type SalesTeamMember = {
  id: string;
  store_id: string;
  name: string;
  whatsapp: string;
  photo_url: string | null;
  is_active: boolean;
  position: number;
};

/** Active sales team for a store, ordered for display. Empty array = keep legacy single-number behavior. */
export async function fetchSalesTeam(storeId: string): Promise<SalesTeamMember[]> {
  const { data, error } = await supabase
    .from("store_sales_team")
    .select("id, store_id, name, whatsapp, photo_url, is_active, position")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as SalesTeamMember[];
}

export const salesTeamQueryKey = (storeId: string) => ["sales-team", storeId] as const;
