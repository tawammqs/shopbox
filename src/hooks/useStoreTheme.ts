import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TOKENS, type ThemeCustomizations, type ThemeTokens, mergeTokens } from "@/lib/themes";

export type StoreThemeData = {
  themeId: string | null;
  themeName: string | null;
  tokens: ThemeTokens;
  customizations: ThemeCustomizations;
  sections: { id: string; enabled: boolean; order: number }[];
  buttonStyle: "rounded" | "square" | "pill";
  cardStyle: "minimal" | "shadow" | "border";
};

export function useStoreTheme(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ["store-theme", storeId],
    enabled: !!storeId,
    staleTime: 30_000,
    queryFn: async (): Promise<StoreThemeData> => {
      const { data: settings } = await supabase
        .from("store_theme_settings")
        .select("active_theme_id, customizations")
        .eq("store_id", storeId!)
        .maybeSingle();

      let tokens = DEFAULT_TOKENS;
      let themeName: string | null = null;
      let defaultSections: { id: string; enabled: boolean; order: number }[] = [];

      if (settings?.active_theme_id) {
        const { data: theme } = await supabase
          .from("themes")
          .select("name, tokens, default_sections")
          .eq("id", settings.active_theme_id)
          .maybeSingle();
        if (theme) {
          tokens = (theme.tokens as any) ?? DEFAULT_TOKENS;
          themeName = theme.name;
          const ds = Array.isArray(theme.default_sections) ? (theme.default_sections as any[]) : [];
          defaultSections = ds.map((s, i) => ({ id: s.id, enabled: s.enabled !== false, order: s.order ?? i }));
        }
      }

      const cust = (settings?.customizations ?? {}) as ThemeCustomizations;
      const finalTokens = mergeTokens(tokens, cust);
      const sections = cust.sections ?? defaultSections;

      return {
        themeId: settings?.active_theme_id ?? null,
        themeName,
        tokens: finalTokens,
        customizations: cust,
        sections,
        buttonStyle: cust.buttonStyle ?? "rounded",
        cardStyle: cust.cardStyle ?? "shadow",
      };
    },
  });
}
