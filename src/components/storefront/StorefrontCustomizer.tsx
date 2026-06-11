import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

type Cust = {
  colors?: { background?: string; text?: string; accent?: string; primaryButtonBg?: string; primaryButtonText?: string };
  typography?: { headingFont?: string; bodyFont?: string };
  header?: {
    announcementEnabled?: boolean;
    announcementText?: string;
    announcementBg?: string;
    announcementText_color?: string;
  };
};


export function StorefrontCustomizer({ storeId }: { storeId: string }) {
  const { data } = useQuery({
    queryKey: ["storefront-customizations", storeId],
    queryFn: async (): Promise<Cust> => {
      const { data } = await supabase
        .from("store_theme_settings")
        .select("customizations")
        .eq("store_id", storeId)
        .maybeSingle();
      return ((data?.customizations as any) ?? {}) as Cust;
    },
    staleTime: 30_000,
  });

  const headingFont = data?.typography?.headingFont;
  const bodyFont = data?.typography?.bodyFont;

  useEffect(() => {
    const fonts = [headingFont, bodyFont].filter(Boolean) as string[];
    if (!fonts.length) return;
    const unique = Array.from(new Set(fonts));
    const id = "storefront-fonts-" + unique.join("-").replace(/\s+/g, "+");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?" +
      unique.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`).join("&") +
      "&display=swap";
    document.head.appendChild(link);
  }, [headingFont, bodyFont]);

  const css = useMemo(() => {
    const lines: string[] = [];
    const bg = data?.colors?.background;
    const fg = data?.colors?.text;
    const accent = data?.colors?.accent;
    if (bg) lines.push(`--background: ${bg};`);
    if (fg) lines.push(`--foreground: ${fg}; --card-foreground: ${fg};`);
    if (accent) {
      lines.push(`--accent: ${accent}; --primary: ${accent}; --ring: ${accent}; --store-accent: ${accent};`);
    }
    if (headingFont) lines.push(`--font-display: '${headingFont}', sans-serif;`);
    if (bodyFont) lines.push(`--font-body: '${bodyFont}', sans-serif;`);
    if (!lines.length) return "";
    return `.storefront-root{${lines.join("")}}${
      bodyFont ? ` .storefront-root{font-family: var(--font-body);}` : ""
    }${
      headingFont
        ? ` .storefront-root .font-display, .storefront-root h1, .storefront-root h2, .storefront-root h3{font-family: var(--font-display);}`
        : ""
    }${bg ? ` .storefront-root{background-color: ${bg};}` : ""}${
      fg ? ` .storefront-root{color: ${fg};}` : ""
    }`;
  }, [data, headingFont, bodyFont]);


  const ab = data?.header;
  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {ab?.announcementEnabled && ab.announcementText ? (
        <div
          className="w-full text-center text-xs font-medium py-2 px-3"
          style={{
            background: ab.announcementBg || "#111827",
            color: ab.announcementText_color || "#ffffff",
          }}
        >
          {ab.announcementText}
        </div>
      ) : null}
    </>
  );
}

export function useStorefrontHomepageSections(storeId: string) {
  return useQuery({
    queryKey: ["storefront-home-sections", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_theme_settings")
        .select("customizations")
        .eq("store_id", storeId)
        .maybeSingle();
      const c = (data?.customizations as any) ?? {};
      const sections: { id: string; visible: boolean }[] = c?.homepage?.sections ?? [];
      const map: Record<string, boolean> = {};
      for (const s of sections) map[s.id] = s.visible !== false;
      return { map, order: sections.map((s) => s.id) };
    },
    staleTime: 30_000,
  });
}
