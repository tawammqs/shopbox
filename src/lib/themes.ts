// Theme tokens shared types + helpers
export type ThemeTokens = {
  colors: { primary: string; secondary: string; accent: string; bg: string; fg: string };
  fonts: { display: string; body: string };
  radius: string;
  shadow: "none" | "sm" | "md" | "lg";
};

export type ThemeCustomizations = Partial<{
  colors: Partial<ThemeTokens["colors"]>;
  fonts: Partial<ThemeTokens["fonts"]>;
  radius: string;
  shadow: ThemeTokens["shadow"];
  sections: { id: string; enabled: boolean; order: number }[];
  buttonStyle: "rounded" | "square" | "pill";
  cardStyle: "minimal" | "shadow" | "border";
  logoUrl: string | null;
}>;

export const DEFAULT_TOKENS: ThemeTokens = {
  colors: { primary: "#1A6B4A", secondary: "#0F4732", accent: "#F4A300", bg: "#FFFFFF", fg: "#1A1A1A" },
  fonts: { display: "Poppins", body: "Inter" },
  radius: "12px",
  shadow: "sm",
};

const SHADOW_MAP: Record<ThemeTokens["shadow"], string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 12px rgba(0,0,0,0.08)",
  lg: "0 12px 32px rgba(0,0,0,0.12)",
};

export function mergeTokens(base: ThemeTokens, override?: ThemeCustomizations): ThemeTokens {
  if (!override) return base;
  return {
    colors: { ...base.colors, ...(override.colors ?? {}) },
    fonts: { ...base.fonts, ...(override.fonts ?? {}) },
    radius: override.radius ?? base.radius,
    shadow: override.shadow ?? base.shadow,
  };
}

export function tokensToCss(tokens: ThemeTokens, scope = ":root"): string {
  const c = tokens.colors;
  return `${scope}{
  --tm-primary:${c.primary};
  --tm-secondary:${c.secondary};
  --tm-accent:${c.accent};
  --tm-bg:${c.bg};
  --tm-fg:${c.fg};
  --tm-radius:${tokens.radius};
  --tm-shadow:${SHADOW_MAP[tokens.shadow] ?? SHADOW_MAP.sm};
  --tm-font-display:'${tokens.fonts.display}',sans-serif;
  --tm-font-body:'${tokens.fonts.body}',sans-serif;
}`;
}

export function googleFontsHref(tokens: ThemeTokens): string {
  const families = [tokens.fonts.display, tokens.fonts.body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export const FONT_PAIRS: { display: string; body: string; label: string }[] = [
  { display: "Poppins", body: "Inter", label: "Poppins + Inter (versátil)" },
  { display: "Playfair Display", body: "Inter", label: "Playfair + Inter (editorial)" },
  { display: "Cormorant Garamond", body: "Inter", label: "Cormorant + Inter (luxo)" },
  { display: "DM Serif Display", body: "DM Sans", label: "DM Serif + DM Sans (boutique)" },
  { display: "Bebas Neue", body: "Inter", label: "Bebas + Inter (esportivo)" },
  { display: "Montserrat", body: "Open Sans", label: "Montserrat + Open Sans (moderno)" },
];

export const SEGMENT_OPTIONS = ["Moda", "Kids", "Calçados", "Casa", "Decoração", "Acessórios", "Joias", "Cosméticos", "Esporte", "Suplementos", "Artesanato"];
export const STYLE_OPTIONS = ["Minimalista", "Clean", "Clássico", "Versátil", "Luxo", "Elegante", "Premium", "Colorido", "Divertido", "Jovem", "Boutique", "Aconchegante", "Artesanal", "Esportivo", "Energético", "Bold"];

export const ALL_SECTIONS: { id: string; label: string }[] = [
  { id: "banner", label: "Banners" },
  { id: "categories", label: "Categorias" },
  { id: "featured", label: "Destaques" },
  { id: "new", label: "Lançamentos" },
  { id: "offers", label: "Ofertas" },
  { id: "principal", label: "Principal" },
  { id: "testimonials", label: "Depoimentos" },
];

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
