CREATE TABLE IF NOT EXISTS public.the_shoes_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.the_shoes_theme_settings TO authenticated;
GRANT SELECT ON public.the_shoes_theme_settings TO anon;
GRANT ALL ON public.the_shoes_theme_settings TO service_role;

ALTER TABLE public.the_shoes_theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read theme settings"
  ON public.the_shoes_theme_settings FOR SELECT
  USING (true);

CREATE POLICY "store owners manage their theme settings"
  ON public.the_shoes_theme_settings FOR ALL
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER update_the_shoes_theme_settings_updated_at
  BEFORE UPDATE ON public.the_shoes_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.the_shoes_theme_settings (store_id, settings)
SELECT s.id, '{
  "announcement_bar": {
    "enabled": true,
    "bg_color": "#c0392b",
    "text_color": "#ffffff",
    "items": ["Frete grátis acima de R$199", "Até 3x sem juros", "Tênis a partir de R$149"]
  },
  "section1_title": "Os mais amados 😍",
  "section1_tag": "destaques",
  "section1_subtitle": "ver mais",
  "marquee1": {
    "bg_color": "#f8f8f8",
    "text_color": "#333333",
    "text": "Lançamentos • Tênis Infantil • Moda Kids • The Shoes • Lançamentos • Tênis Infantil •"
  },
  "promo_banner": {
    "image_url": "",
    "link": "/categoria/lancamentos"
  },
  "section2_title": "Tênis do meu jeito 💖",
  "section2_subtitle": "Ver mais",
  "section2_tag": "lancamentos",
  "section2_description": "Seu jeito é:",
  "icons_bar": [
    {"icon": "🚚", "title": "Frete grátis", "subtitle": "Nas compras acima de R$199"},
    {"icon": "🔄", "title": "Troca fácil", "subtitle": "Até 7 dias após recebimento"},
    {"icon": "🔒", "title": "Compra segura", "subtitle": "Dados protegidos"},
    {"icon": "💬", "title": "Suporte", "subtitle": "Via WhatsApp"}
  ],
  "marquee2": {
    "bg_color": "#25D366",
    "text_color": "#ffffff",
    "text": "Achadinhos • Ofertas Secretas • Só para VIPs • Achadinhos • Ofertas Secretas •"
  },
  "testimonials_title": "+12.000 clientes apaixonados pelos seus tênis!",
  "testimonials": [
    {"name": "Ana S.", "text": "Chegou super rápido e meu filho amou!", "rating": 5, "image_url": ""},
    {"name": "Maria L.", "text": "Qualidade incrível, valeu muito a pena!", "rating": 5, "image_url": ""},
    {"name": "Carol M.", "text": "Minha filha não quer tirar do pé!", "rating": 5, "image_url": ""}
  ],
  "faq_title": "Dúvidas frequentes",
  "faq_whatsapp": "5511999999999",
  "faq_items": [
    {"question": "Como funciona a entrega?", "answer": "Entregamos para todo o Brasil em até 7 dias úteis."},
    {"question": "Posso trocar o tamanho?", "answer": "Sim! Aceitamos trocas em até 7 dias após o recebimento."}
  ],
  "instagram_handle": "@theshoes",
  "footer_about": "A The Shoes nasceu da paixão por calçados infantis de qualidade.",
  "footer_links": [
    {"label": "Quem somos", "url": "/sobre"},
    {"label": "Políticas de troca", "url": "/politicas"},
    {"label": "Contato", "url": "/contato"}
  ],
  "cart_upsell_message": "Frete grátis nas compras acima de R$199!",
  "cart_upsell_threshold": 199,
  "whatsapp_button": "5511999999999"
}'::jsonb
FROM public.stores s
WHERE s.slug = 'the-shoes'
ON CONFLICT (store_id) DO NOTHING;