import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  id: string;
  name: string;
  logo_url: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  custom_domain: string | null;
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as StoreSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
