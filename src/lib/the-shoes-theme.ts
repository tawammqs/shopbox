import { supabase } from "@/integrations/supabase/client";

export type AnnouncementBar = {
  enabled: boolean;
  bg_color: string;
  text_color: string;
  items: string[];
};

export type MarqueeCfg = { bg_color: string; text_color: string; text: string };
export type PromoBanner = { image_url: string; link: string };
export type IconItem = { icon: string; title: string; subtitle: string };
export type Testimonial = { name: string; text: string; rating: number; image_url: string };
export type FaqItem = { question: string; answer: string };
export type FooterLink = { label: string; url: string };
export type InstaImage = { image_url: string; link: string };

export type TheShoesSettings = {
  announcement_bar: AnnouncementBar;
  section1_title: string;
  section1_tag: string;
  section1_subtitle: string;
  marquee1: MarqueeCfg;
  promo_banner: PromoBanner;
  section2_title: string;
  section2_subtitle: string;
  section2_tag: string;
  section2_description: string;
  icons_bar: IconItem[];
  marquee2: MarqueeCfg;
  testimonials_title: string;
  testimonials: Testimonial[];
  faq_title: string;
  faq_whatsapp: string;
  faq_items: FaqItem[];
  instagram_handle: string;
  instagram_images: InstaImage[];
  footer_about: string;
  footer_links: FooterLink[];
  footer_marquee_text: string;
  cart_upsell_message: string;
  cart_upsell_threshold: number;
  whatsapp_button: string;
};

export const DEFAULT_THE_SHOES_SETTINGS: TheShoesSettings = {
  announcement_bar: {
    enabled: true,
    bg_color: "#c0392b",
    text_color: "#ffffff",
    items: ["Frete grátis acima de R$199", "Até 3x sem juros", "Tênis a partir de R$149"],
  },
  section1_title: "Os mais amados 😍",
  section1_tag: "destaques",
  section1_subtitle: "ver mais",
  marquee1: {
    bg_color: "#f8f8f8",
    text_color: "#333333",
    text: "Lançamentos • Tênis Infantil • Moda Kids • The Shoes •",
  },
  promo_banner: { image_url: "", link: "/categoria/lancamentos" },
  section2_title: "Tênis do meu jeito 💖",
  section2_subtitle: "Ver mais",
  section2_tag: "lancamentos",
  section2_description: "Seu jeito é:",
  icons_bar: [
    { icon: "🚚", title: "Frete grátis", subtitle: "Nas compras acima de R$199" },
    { icon: "🔄", title: "Troca fácil", subtitle: "Até 7 dias após recebimento" },
    { icon: "🔒", title: "Compra segura", subtitle: "Dados protegidos" },
    { icon: "💬", title: "Suporte", subtitle: "Via WhatsApp" },
  ],
  marquee2: {
    bg_color: "#25D366",
    text_color: "#ffffff",
    text: "Achadinhos • Ofertas Secretas • Só para VIPs •",
  },
  testimonials_title: "+12.000 clientes apaixonados pelos seus tênis!",
  testimonials: [],
  faq_title: "Dúvidas frequentes",
  faq_whatsapp: "5511999999999",
  faq_items: [],
  instagram_handle: "@theshoes",
  footer_about: "",
  footer_links: [],
  cart_upsell_message: "Frete grátis nas compras acima de R$199!",
  cart_upsell_threshold: 199,
  whatsapp_button: "5511999999999",
};

export function mergeSettings(raw: unknown): TheShoesSettings {
  const r = (raw ?? {}) as Partial<TheShoesSettings>;
  return { ...DEFAULT_THE_SHOES_SETTINGS, ...r };
}

export async function fetchTheShoesSettings(storeId: string): Promise<TheShoesSettings> {
  const { data } = await (supabase as any)
    .from("the_shoes_theme_settings")
    .select("settings")
    .eq("store_id", storeId)
    .maybeSingle();
  return mergeSettings(data?.settings);
}

export async function upsertTheShoesSettings(storeId: string, settings: TheShoesSettings) {
  const { error } = await (supabase as any)
    .from("the_shoes_theme_settings")
    .upsert({ store_id: storeId, settings }, { onConflict: "store_id" });
  if (error) throw error;
}
