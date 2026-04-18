import { useEffect } from "react";
import { type ThemeTokens, googleFontsHref, tokensToCss } from "@/lib/themes";

/**
 * Injects CSS variables + Google Fonts for the active theme tokens.
 * Renders nothing.
 */
export function ThemeStyleInjector({ tokens, scope = ":root" }: { tokens: ThemeTokens; scope?: string }) {
  useEffect(() => {
    const css = tokensToCss(tokens, scope);
    const styleId = "tm-theme-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = css;

    const fontsHref = googleFontsHref(tokens);
    const linkId = "tm-theme-fonts";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== fontsHref) link.href = fontsHref;
  }, [tokens, scope]);

  return null;
}
