import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StorefrontCustomizations = {
  colors?: {
    background?: string;
    text?: string;
    accent?: string;
    primaryButtonBg?: string;
    primaryButtonText?: string;
    badge?: string;
  };
  typography?: {
    headingFont?: string;
    headingSize?: number;
    headingBold?: boolean;
    largeHeadingSize?: number;
    bodyFont?: string;
    bodySize?: number;
  };
  header?: {
    bg?: string;
    text?: string;
    scrolledBg?: string;
    logoPosition?: "left" | "center";
    logoSize?: number;
    transparent?: boolean;
    announcementEnabled?: boolean;
    announcementText?: string; // legacy single message
    announcementMessages?: string[];
    announcementBg?: string;
    announcementText_color?: string;
    announcementFontSize?: number;
    announcementSpeed?: number;
  };
  homepage?: {
    sections?: { id: string; visible: boolean }[];
    popup?: {
      enabled?: boolean;
      title?: string;
      text?: string;
      image?: string;
      ctaText?: string;
      ctaLink?: string;
      delay?: number;
    };
  };
  productList?: {
    mobilePerRow?: string;
    desktopPerRow?: string;
    paginationMode?: string;
    quickBuy?: boolean;
    showColorVariations?: boolean;
    filtersRight?: boolean;
  };
  productDetail?: Record<string, any>;
  cart?: {
    showSeeMore?: boolean;
    minPurchase?: string;
    quickCart?: boolean;
    addAction?: string;
    suggestRelated?: boolean;
    shippingCalc?: boolean;
  };
  footer?: {
    useCustomColors?: boolean;
    bg?: string;
    text?: string;
    showLangCurrency?: boolean;
    primaryMenuEnabled?: boolean;
    primaryMenuId?: string;
    secondaryMenuEnabled?: boolean;
    secondaryMenuId?: string;
    showContact?: boolean;
    phone?: string;
    email?: string;
    store_name?: string;
    about_text?: string;
  };
  customCss?: string;
};

const CUST_QUERY_KEY = (storeId: string) => ["storefront-customizations", storeId];

export function useStorefrontCustomizations(storeId: string) {
  return useQuery({
    queryKey: CUST_QUERY_KEY(storeId),
    queryFn: async (): Promise<StorefrontCustomizations> => {
      const { data } = await supabase
        .from("store_theme_settings")
        .select("customizations")
        .eq("store_id", storeId)
        .maybeSingle();
      return ((data?.customizations as any) ?? {}) as StorefrontCustomizations;
    },
    staleTime: 30_000,
  });
}

export function StorefrontCustomizer({ storeId }: { storeId: string }) {
  const { data } = useStorefrontCustomizations(storeId);

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
    const vars: string[] = [];
    const c = data?.colors ?? {};
    const t = data?.typography ?? {};
    const h = data?.header ?? {};
    const f = data?.footer ?? {};

    if (c.background) vars.push(`--background: ${c.background};`);
    if (c.text) vars.push(`--foreground: ${c.text}; --card-foreground: ${c.text};`);
    if (c.accent)
      vars.push(`--accent: ${c.accent}; --primary: ${c.accent}; --ring: ${c.accent}; --store-accent: ${c.accent};`);
    if (c.primaryButtonBg) vars.push(`--store-btn-bg: ${c.primaryButtonBg};`);
    if (c.primaryButtonText) vars.push(`--store-btn-text: ${c.primaryButtonText};`);
    if (c.badge) vars.push(`--store-badge: ${c.badge};`);

    if (headingFont) vars.push(`--font-display: '${headingFont}', sans-serif;`);
    if (bodyFont) vars.push(`--font-body: '${bodyFont}', sans-serif;`);
    if (t.headingSize) vars.push(`--store-heading-size: ${t.headingSize}px;`);
    if (t.largeHeadingSize) vars.push(`--store-large-heading-size: ${t.largeHeadingSize}px;`);
    if (t.bodySize) vars.push(`--store-body-size: ${t.bodySize}px;`);
    vars.push(`--store-heading-weight: ${t.headingBold === false ? 500 : 700};`);

    if (h.bg) vars.push(`--store-header-bg: ${h.bg};`);
    if (h.text) vars.push(`--store-header-text: ${h.text};`);
    if (h.logoSize) vars.push(`--store-logo-size: ${h.logoSize}px;`);

    if (f.useCustomColors) {
      if (f.bg) vars.push(`--store-footer-bg: ${f.bg};`);
      if (f.text) vars.push(`--store-footer-text: ${f.text};`);
    }

    const lines: string[] = [];
    if (vars.length) lines.push(`.storefront-root{${vars.join("")}}`);
    if (c.background) lines.push(`.storefront-root{background-color: ${c.background};}`);
    if (c.text) lines.push(`.storefront-root{color: ${c.text};}`);
    if (bodyFont) lines.push(`.storefront-root{font-family: var(--font-body);}`);
    if (t.bodySize) lines.push(`.storefront-root{font-size: var(--store-body-size);}`);
    if (headingFont)
      lines.push(
        `.storefront-root .font-display,.storefront-root h1,.storefront-root h2,.storefront-root h3,.storefront-root h4{font-family: var(--font-display);}`,
      );
    if (t.headingSize)
      lines.push(`.storefront-root h2,.storefront-root h3{font-size: var(--store-heading-size);}`);
    if (t.largeHeadingSize) lines.push(`.storefront-root h1{font-size: var(--store-large-heading-size);}`);
    lines.push(`.storefront-root h1,.storefront-root h2,.storefront-root h3{font-weight: var(--store-heading-weight);}`);

    // Header look
    if (h.bg || h.text) {
      lines.push(
        `.storefront-root header[data-sf-header]{${h.bg ? `background-color: ${h.bg};` : ""}${h.text ? `color: ${h.text};` : ""}}`,
      );
      if (h.text)
        lines.push(`.storefront-root header[data-sf-header] a,.storefront-root header[data-sf-header] button{color: ${h.text};}`);
    }

    // Footer look (only when opted-in)
    if (f.useCustomColors) {
      const fbg = f.bg ?? "#111111";
      const ftxt = f.text ?? "#ffffff";
      lines.push(
        `.storefront-root footer[data-sf-footer]{background-color: ${fbg} !important; color: ${ftxt};}`,
      );
      lines.push(
        `.storefront-root footer[data-sf-footer] h4,.storefront-root footer[data-sf-footer] a,.storefront-root footer[data-sf-footer] li,.storefront-root footer[data-sf-footer] span{color: ${ftxt};}`,
      );
      lines.push(
        `.storefront-root footer[data-sf-footer] .text-muted-foreground{color: ${ftxt}; opacity: 0.75;}`,
      );
    }

    // Custom CSS (last → highest specificity priority via source order)
    if (data?.customCss) lines.push(data.customCss);

    return lines.join("\n");
  }, [data, headingFont, bodyFont]);

  const ab = data?.header;
  const abMessages = (() => {
    const list = (ab?.announcementMessages ?? []).map((s) => (s ?? "").trim()).filter(Boolean);
    if (list.length) return list;
    const legacy = (ab?.announcementText ?? "").trim();
    return legacy ? [legacy] : [];
  })();
  const abSpeed = ab?.announcementSpeed ?? 15;
  const abFontSize = ab?.announcementFontSize ?? 14;
  const abText = abMessages.join("   ·   ");
  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {ab?.announcementEnabled && abMessages.length ? (
        <div
          className="w-full overflow-hidden"
          style={{
            background: ab.announcementBg || "#111827",
            color: ab.announcementText_color || "#ffffff",
          }}
        >
          <div
            className="flex whitespace-nowrap py-2 font-medium"
            style={{
              animation: `sfAnnouncementMarquee ${abSpeed}s linear infinite`,
              fontSize: `${abFontSize}px`,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="px-6">{abText} ·</span>
            ))}
          </div>
          <style>{`@keyframes sfAnnouncementMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
      ) : null}
    </>
  );
}

export function useStorefrontHomepageSections(storeId: string) {
  const { data } = useStorefrontCustomizations(storeId);
  return {
    data: useMemo(() => {
      const sections = data?.homepage?.sections ?? [];
      const map: Record<string, boolean> = {};
      for (const s of sections) map[s.id] = s.visible !== false;
      return { map, order: sections.map((s) => s.id) };
    }, [data]),
  };
}
