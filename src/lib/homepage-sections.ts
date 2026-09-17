/**
 * Homepage sections — multi-tenant config contract.
 *
 * Source of truth: store_theme_settings.customizations.homepage = {
 *   sections_order: string[];
 *   sections_visibility: Record<key, boolean>;
 *   sections_config: Record<key, object>;
 * }
 */

export type HomepageSectionKey =
  | "banners_rotativos"
  | "sobre_loja"
  | "produtos_oferta"
  | "produtos_destaque"
  | "produtos_novos"
  | "boas_vindas_marquee"
  | "anuncios_marquee"
  | "frete_pagamento"
  | "banners_categorias"
  | "instagram"
  | "faq"
  | "produto_principal"
  | "marcas"
  | "newsletter"
  | "categorias_principais"
  | "video"
  | "depoimentos"
  | "imagem_texto"
  | "institucional"
  | "banners_promocionais"
  | "banners_novidades";

export type HomepageConfig = {
  sections_order?: HomepageSectionKey[];
  sections_visibility?: Partial<Record<HomepageSectionKey, boolean>>;
  sections_config?: Partial<Record<HomepageSectionKey, any>>;
  // legacy
  sections?: { id: string; visible: boolean }[];
  popup?: any;
};

export const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  banners_rotativos: "Banners rotativos",
  sobre_loja: "Sobre a loja",
  produtos_oferta: "Produtos em oferta",
  produtos_destaque: "Produtos em destaque",
  produtos_novos: "Produtos novos",
  boas_vindas_marquee: "Mensagem de boas vindas",
  anuncios_marquee: "Mensagem de anúncios",
  frete_pagamento: "Informações de frete, pagamento e compra",
  banners_categorias: "Banners de categorias",
  instagram: "Postagens do Instagram",
  faq: "FAQ",
  produto_principal: "Produto principal",
  marcas: "Marcas",
  newsletter: "Newsletter",
  categorias_principais: "Categorias principais",
  video: "Vídeo",
  depoimentos: "Depoimentos",
  imagem_texto: "Módulos de imagem e texto",
  institucional: "Mensagem institucional",
  banners_promocionais: "Banners promocionais",
  banners_novidades: "Banners de novidades",
};

export const DEFAULT_SECTION_ORDER: HomepageSectionKey[] = [
  "banners_rotativos",
  "sobre_loja",
  "produtos_oferta",
  "boas_vindas_marquee",
  "produtos_destaque",
  "produtos_novos",
  "frete_pagamento",
  "anuncios_marquee",
  "banners_categorias",
  "instagram",
  "faq",
  "produto_principal",
  "marcas",
  "newsletter",
  "categorias_principais",
  "video",
  "depoimentos",
  "imagem_texto",
  "institucional",
  "banners_promocionais",
  "banners_novidades",
];

export const DEFAULT_VISIBILITY: Record<HomepageSectionKey, boolean> = {
  banners_rotativos: true,
  sobre_loja: false,
  produtos_oferta: true,
  produtos_destaque: true,
  produtos_novos: true,
  boas_vindas_marquee: false,
  anuncios_marquee: false,
  frete_pagamento: true,
  banners_categorias: false,
  instagram: false,
  faq: false,
  produto_principal: false,
  marcas: false,
  newsletter: false,
  categorias_principais: true,
  video: false,
  depoimentos: false,
  imagem_texto: false,
  institucional: false,
  banners_promocionais: false,
  banners_novidades: false,
};

export type BannerRotativoItem = { desktop_url: string; mobile_url: string; link: string };
export type BannerRotativoCfg = { items: BannerRotativoItem[]; interval_seconds: number; autoplay: boolean };

export type ProductsTagCfg = { title: string; limit: number; show_more_button?: boolean; tag?: string; display_mode?: "grid" | "carousel" };
export type ProductsCategoryCfg = { title: string; category_id: string | null; limit: number; display_mode?: "grid" | "carousel" };

export type MarqueeCfg = { text: string; background: string; text_color: string; speed: number; font_size?: number; uppercase?: boolean };

export type FretePagamentoItem = { icon: string; title: string; description: string };
export type FretePagamentoCfg = { background: string; icon_color: string; items: FretePagamentoItem[] };

export type BannerCategoriaItem = { category_id: string; desktop_url: string; mobile_url: string };
export type BannerCategoriasCfg = { items: BannerCategoriaItem[] };

export type InstagramCfg = { title: string; handle: string; photos: string[] };

export type FaqItem = { question: string; answer: string };
export type FaqCfg = { title: string; subtitle: string; items: FaqItem[]; background?: string; text_color?: string };

export type DepoimentoItem = { name: string; text: string; rating?: number; image_url?: string };
export type DepoimentosCfg = { title: string; background: string; text_color?: string; items: DepoimentoItem[] };

export type VideoSectionCfg = { title: string };

export type CategoriaPrincipalItem = {
  id: string;
  title: string;
  image_url: string;
  link_type: "category" | "url";
  category_id: string | null;
  url: string;
};

export type CategoriasPrincipaisCfg = {
  title: string;
  display_mode: "grid" | "carousel";
  /** Manually curated items (image, title, link, order). */
  items: CategoriaPrincipalItem[];
  // legacy fields kept for backwards compatibility with older saved configs
  limit?: number;
  only_with_image?: boolean;
  category_ids?: string[];
};

export type SobreLojaCfg = {
  title: string;
  text: string;
  image_url: string;
  button_label?: string;
  button_link?: string;
  image_position?: "left" | "right";
  video_url?: string;
  video_upload_url?: string;
};


export type ProdutoPrincipalCfg = {
  title: string;
  product_id: string | null;
  promotion_ends_at: string | null; // ISO datetime
  show_countdown: boolean;
};

export const SECTION_DEFAULTS: Partial<Record<HomepageSectionKey, any>> = {
  banners_rotativos: { items: [], interval_seconds: 5, autoplay: true } as BannerRotativoCfg,
  sobre_loja: { title: "Sobre a loja", text: "", image_url: "", button_label: "", button_link: "", image_position: "left", video_url: "", video_upload_url: "" } as SobreLojaCfg,
  produtos_oferta: { title: "Ofertas", limit: 8, show_more_button: true, tag: "ofertas", display_mode: "carousel" } as ProductsTagCfg,
  produtos_destaque: { title: "Destaques", limit: 8, show_more_button: true, display_mode: "carousel" } as ProductsTagCfg,
  produtos_novos: { title: "Lançamentos", category_id: null, limit: 8, display_mode: "carousel" } as ProductsCategoryCfg,
  boas_vindas_marquee: { text: "Bem-vindo à nossa loja", background: "#dfdac8", text_color: "#111111", speed: 15, font_size: 16, uppercase: false } as MarqueeCfg,
  anuncios_marquee: { text: "Frete grátis acima de R$199", background: "#111827", text_color: "#ffffff", speed: 15, font_size: 16, uppercase: false } as MarqueeCfg,
  frete_pagamento: {
    background: "#dfdac8",
    icon_color: "#ffffff",
    items: [
      { icon: "Tag", title: "5% OFF no Pix", description: "Pagamento via Pix com desconto" },
      { icon: "CreditCard", title: "Até 3x sem juros", description: "No cartão de crédito" },
      { icon: "Truck", title: "Envio rápido", description: "Pelos Correios" },
    ],
  } as FretePagamentoCfg,
  banners_categorias: { items: [] } as BannerCategoriasCfg,
  instagram: { title: "Siga no Instagram", handle: "", photos: [] } as InstagramCfg,
  faq: { title: "Perguntas Frequentes", subtitle: "", items: [], background: "#dfdac8", text_color: "#0f0f0f" } as FaqCfg,
  depoimentos: { title: "O que dizem nossos clientes", background: "#ffffff", text_color: "#111111", items: [] } as DepoimentosCfg,
  video: { title: "Veja mais detalhes em vídeo" } as VideoSectionCfg,
  produto_principal: { title: "Oferta imperdível", product_id: null, promotion_ends_at: null, show_countdown: true } as ProdutoPrincipalCfg,
  categorias_principais: { title: "Navegue por categoria", display_mode: "carousel", items: [] } as CategoriasPrincipaisCfg,
};

// ---------------------------------------------------------------------------
// The Shoes legacy layout: fixed hardcoded blocks, now orderable + extendable.
// Stored at customizations.homepage.legacy_order / legacy_hidden. When absent,
// LEGACY_DEFAULT_ORDER reproduces the original visual exactly.
// ---------------------------------------------------------------------------
export type LegacyBlockKey =
  | HomepageSectionKey
  | "legacy:promo_banner"
  | "legacy:achadinhos";

export const LEGACY_DEFAULT_ORDER: LegacyBlockKey[] = [
  "banners_rotativos",
  "produtos_destaque",
  "boas_vindas_marquee",
  "legacy:promo_banner",
  "produtos_novos",
  "frete_pagamento",
  "anuncios_marquee",
  "legacy:achadinhos",
  "depoimentos",
  "video",
  "faq",
  "instagram",
];

export const LEGACY_EXTRA_LABELS: Record<string, string> = {
  "legacy:promo_banner": "Banner promocional",
  "legacy:achadinhos": "Achadinhos",
};

/** Sections from the new schema that can be added to The Shoes homepage. */
export const LEGACY_ADDABLE_SECTIONS: HomepageSectionKey[] = [
  "categorias_principais",
  "produto_principal",
  "banners_categorias",
];

export function legacyLabel(key: string): string {
  return LEGACY_EXTRA_LABELS[key] ?? SECTION_LABELS[key as HomepageSectionKey] ?? key;
}

export function getLegacyOrder(cust: any): LegacyBlockKey[] {
  const hp = getHomepage(cust) as any;
  const stored = Array.isArray(hp.legacy_order) ? (hp.legacy_order as string[]) : null;
  if (!stored || stored.length === 0) return [...LEGACY_DEFAULT_ORDER];
  const known = stored.filter(
    (k) => (LEGACY_DEFAULT_ORDER as string[]).includes(k) || (LEGACY_ADDABLE_SECTIONS as string[]).includes(k),
  ) as LegacyBlockKey[];
  for (const k of LEGACY_DEFAULT_ORDER) if (!known.includes(k)) known.push(k);
  return known;
}

export function isLegacyBlockHidden(cust: any, key: string): boolean {
  const hp = getHomepage(cust) as any;
  return Array.isArray(hp.legacy_hidden) && hp.legacy_hidden.includes(key);
}

export function setLegacyOrderPatch(cust: any, order: string[]) {
  const hp = getHomepage(cust);
  return { homepage: { ...hp, legacy_order: order } };
}

export function setLegacyHiddenPatch(cust: any, key: string, hidden: boolean) {
  const hp = getHomepage(cust) as any;
  const cur: string[] = Array.isArray(hp.legacy_hidden) ? hp.legacy_hidden : [];
  const next = hidden ? Array.from(new Set([...cur, key])) : cur.filter((k) => k !== key);
  return { homepage: { ...hp, legacy_hidden: next } };
}


export function getHomepage(cust: any): HomepageConfig {
  return (cust?.homepage ?? {}) as HomepageConfig;
}

export function getSectionsOrder(cust: any): string[] {
  const hp = getHomepage(cust);
  if (Array.isArray(hp.sections_order) && hp.sections_order.length) {
    const known = (hp.sections_order as string[]).filter(
      (k) => k in SECTION_LABELS || ADDON_ROW_KEYS.includes(k),
    );
    for (const k of DEFAULT_SECTION_ORDER) if (!known.includes(k)) known.push(k);
    if (!known.includes("addon:grupo_vip")) {
      const idx = known.indexOf("frete_pagamento");
      if (idx >= 0) known.splice(idx, 0, "addon:grupo_vip");
      else known.push("addon:grupo_vip");
    }
    return known;
  }
  const order: string[] = [...DEFAULT_SECTION_ORDER];
  const idx = order.indexOf("frete_pagamento");
  if (idx >= 0) order.splice(idx, 0, "addon:grupo_vip");
  else order.push("addon:grupo_vip");
  return order;
}

export function isSectionVisible(cust: any, key: HomepageSectionKey): boolean {
  const hp = getHomepage(cust);
  if (hp.sections_visibility && key in hp.sections_visibility) {
    return !!hp.sections_visibility[key];
  }
  return DEFAULT_VISIBILITY[key];
}

export function getSectionConfig<T = any>(cust: any, key: HomepageSectionKey): T {
  const hp = getHomepage(cust);
  const stored = hp.sections_config?.[key];
  const def = SECTION_DEFAULTS[key] ?? {};
  return { ...(def as any), ...(stored ?? {}) } as T;
}

export function setSectionVisibilityPatch(cust: any, key: HomepageSectionKey, visible: boolean) {
  const hp = getHomepage(cust);
  return {
    homepage: {
      ...hp,
      sections_visibility: { ...(hp.sections_visibility ?? {}), [key]: visible },
    },
  };
}

export function setSectionConfigPatch(cust: any, key: HomepageSectionKey, config: any) {
  const hp = getHomepage(cust);
  return {
    homepage: {
      ...hp,
      sections_config: { ...(hp.sections_config ?? {}), [key]: config },
    },
  };
}

export function setSectionsOrderPatch(cust: any, order: HomepageSectionKey[]) {
  const hp = getHomepage(cust);
  return { homepage: { ...hp, sections_order: order } };
}

/**
 * Marketing addons that surface as items in the "Página inicial" list.
 * The eye toggle for each row writes to store_addon_configs.config.active
 * (single source of truth — no parallel customizations.homepage flag).
 * Clicking the row navigates to its Marketing screen instead of opening
 * an inline section editor.
 */
export type AddonHomepageItem = {
  addonKey: "video_commerce" | "grupo_vip" | "captura_leads" | "compre_junto" | "perguntas_avaliacoes";
  rowKey: string; // pseudo key for sections_order positioning
  icon: string;
  label: string;
  urlSlug: string; // /admin/marketing/<urlSlug>
};

export const ADDON_HOMEPAGE_ITEMS: AddonHomepageItem[] = [
  { addonKey: "video_commerce", rowKey: "addon:video_commerce", icon: "🎬", label: "Vídeos (Video Commerce)", urlSlug: "video-commerce" },
  { addonKey: "grupo_vip", rowKey: "addon:grupo_vip", icon: "👑", label: "Grupo VIP / Ofertas Secretas", urlSlug: "grupo-vip" },
  { addonKey: "captura_leads", rowKey: "addon:captura_leads", icon: "🎁", label: "Captura de Leads (popup cupom)", urlSlug: "captura-leads" },
  { addonKey: "compre_junto", rowKey: "addon:compre_junto", icon: "🛍️", label: "Compre Junto", urlSlug: "compre-junto" },
  { addonKey: "perguntas_avaliacoes", rowKey: "addon:perguntas_avaliacoes", icon: "⭐", label: "Perguntas e Avaliações", urlSlug: "perguntas-avaliacoes" },
];

export const ADDON_ROW_KEYS = ADDON_HOMEPAGE_ITEMS.map((a) => a.rowKey);
export const ADDON_ROW_KEY_TO_ITEM: Record<string, AddonHomepageItem> = Object.fromEntries(
  ADDON_HOMEPAGE_ITEMS.map((a) => [a.rowKey, a]),
);

