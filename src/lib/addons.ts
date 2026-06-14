import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AddonKey =
  | "video_commerce"
  | "grupo_vip"
  | "captura_leads"
  | "compre_junto"
  | "perguntas_avaliacoes";

export type AddonPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
};

export const ADDON_INFO: Record<AddonKey, {
  icon: string;
  title: string;
  description: string;
  urlSlug: string;
  plans: AddonPlan[];
}> = {
  video_commerce: {
    icon: "🎬",
    title: "Video Commerce",
    description:
      "Transforme sua loja em uma vitrine de vídeos. Carrossel de vídeos com produtos marcados e vídeos estilo stories na página do produto.",
    urlSlug: "video-commerce",
    plans: [
      { id: "iniciante", name: "Iniciante", price: 29.9, features: ["Até 5 vídeos", "Vídeo na página do produto", "Métricas de vídeos", "Atendimento via WhatsApp"] },
      { id: "essencial", name: "Essencial", price: 79.9, features: ["Até 50 vídeos", "Tudo do Iniciante", "Campanha de vídeos", "Google Analytics", "Painel de estatísticas", "Comentários e feedbacks"] },
      { id: "profissional", name: "Profissional", price: 119.9, features: ["Até 80 vídeos", "Tudo do Essencial", "Feed de vídeos", "iShorts Shop"] },
      { id: "escala", name: "Escala", price: 199.9, features: ["Até 150 vídeos", "Tudo do Profissional", "Live Commerce"] },
    ],
  },
  grupo_vip: {
    icon: "👑",
    title: "Grupo VIP",
    description:
      "Capture o WhatsApp dos seus clientes e direcione-os automaticamente para o grupo VIP da sua loja.",
    urlSlug: "grupo-vip",
    plans: [{ id: "default", name: "Grupo VIP", price: 24.9, features: ["Captura de WhatsApp", "Redirecionamento automático", "Leads exportáveis"] }],
  },
  captura_leads: {
    icon: "🎁",
    title: "Captura de Leads",
    description:
      "Ofereça um cupom de primeira compra em troca dos dados de contato e aniversário do cliente.",
    urlSlug: "captura-leads",
    plans: [{ id: "default", name: "Captura de Leads", price: 19.9, features: ["Popup de cupom", "Captura WhatsApp + aniversário", "Leads exportáveis"] }],
  },
  compre_junto: {
    icon: "🛍️",
    title: "Compre Junto",
    description:
      "Sugira produtos complementares no carrinho ou ofereça desconto progressivo para aumentar o ticket médio.",
    urlSlug: "compre-junto",
    plans: [{ id: "default", name: "Compre Junto", price: 49.9, features: ["Sugestão de produtos no carrinho", "Desconto progressivo por valor", "Configuração ilimitada de combos"] }],
  },
  perguntas_avaliacoes: {
    icon: "⭐",
    title: "Perguntas e Avaliações",
    description:
      "Permita que clientes façam perguntas sobre o produto e deixem avaliações com fotos reais.",
    urlSlug: "perguntas-avaliacoes",
    plans: [{ id: "default", name: "Perguntas e Avaliações", price: 34.9, features: ["Perguntas na página do produto", "Avaliações com foto", "Moderação no painel"] }],
  },
};

export type StoreAddon = {
  id: string;
  store_id: string;
  addon_key: string;
  plan_tier: string | null;
  status: string;
  current_period_end: string | null;
};

export function useAddonStatus(storeId: string | undefined, key: AddonKey) {
  return useQuery({
    queryKey: ["store_addon", storeId, key],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("store_addons")
        .select("*")
        .eq("store_id", storeId)
        .eq("addon_key", key)
        .maybeSingle();
      const addon = (data || null) as StoreAddon | null;
      return {
        isActive: addon?.status === "active",
        planTier: addon?.plan_tier ?? null,
        addon,
      };
    },
  });
}

export function useAllAddonStatus(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store_addons_all", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("store_addons")
        .select("addon_key,status")
        .eq("store_id", storeId);
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((r: any) => {
        map[r.addon_key] = r.status === "active";
      });
      return map;
    },
  });
}

export function useAddonConfig<T = any>(storeId: string | undefined, key: AddonKey) {
  return useQuery({
    queryKey: ["store_addon_config", storeId, key],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("store_addon_configs")
        .select("config")
        .eq("store_id", storeId)
        .eq("addon_key", key)
        .maybeSingle();
      return (data?.config ?? {}) as T;
    },
  });
}

export async function saveAddonConfig(storeId: string, key: AddonKey, config: any) {
  const { error } = await (supabase as any)
    .from("store_addon_configs")
    .upsert(
      { store_id: storeId, addon_key: key, config, updated_at: new Date().toISOString() },
      { onConflict: "store_id,addon_key" },
    );
  if (error) throw error;
}
