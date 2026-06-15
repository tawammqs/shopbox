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

export type ProductsTagCfg = { title: string; limit: number; show_more_button?: boolean; tag?: string };
export type ProductsCategoryCfg = { title: string; category_id: string | null; limit: number };

export type MarqueeCfg = { text: string; background: string; text_color: string; speed: number };

export type FretePagamentoItem = { icon: string; title: string; description: string };
export type FretePagamentoCfg = { background: string; icon_color: string; items: FretePagamentoItem[] };

export type BannerCategoriaItem = { category_id: string; desktop_url: string; mobile_url: string };
export type BannerCategoriasCfg = { items: BannerCategoriaItem[] };

export type InstagramCfg = { title: string; handle: string; photos: string[] };

export type FaqItem = { question: string; answer: string };
export type FaqCfg = { title: string; subtitle: string; items: FaqItem[] };

export const SECTION_DEFAULTS: Partial<Record<HomepageSectionKey, any>> = {
  banners_rotativos: { items: [], interval_seconds: 5, autoplay: true } as BannerRotativoCfg,
  produtos_oferta: { title: "Ofertas", limit: 8, show_more_button: true, tag: "ofertas" } as ProductsTagCfg,
  produtos_destaque: { title: "Destaques", limit: 8, show_more_button: true } as ProductsTagCfg,
  produtos_novos: { title: "Lançamentos", category_id: null, limit: 8 } as ProductsCategoryCfg,
  boas_vindas_marquee: { text: "BEM-VINDO À NOSSA LOJA", background: "#dfdac8", text_color: "#111111", speed: 30 } as MarqueeCfg,
  anuncios_marquee: { text: "FRETE GRÁTIS ACIMA DE R$199", background: "#111827", text_color: "#ffffff", speed: 30 } as MarqueeCfg,
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
  faq: { title: "Perguntas Frequentes", subtitle: "", items: [] } as FaqCfg,
};

export function getHomepage(cust: any): HomepageConfig {
  return (cust?.homepage ?? {}) as HomepageConfig;
}

export function getSectionsOrder(cust: any): HomepageSectionKey[] {
  const hp = getHomepage(cust);
  if (Array.isArray(hp.sections_order) && hp.sections_order.length) {
    const known = hp.sections_order.filter((k) => k in SECTION_LABELS) as HomepageSectionKey[];
    // append any new keys not in stored order
    for (const k of DEFAULT_SECTION_ORDER) if (!known.includes(k)) known.push(k);
    return known;
  }
  return DEFAULT_SECTION_ORDER;
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
