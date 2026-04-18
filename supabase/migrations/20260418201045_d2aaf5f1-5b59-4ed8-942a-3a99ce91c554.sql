
-- Theme marketplace tables
CREATE TYPE public.theme_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

CREATE TABLE public.theme_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  display_name text NOT NULL,
  email text,
  commission_percent numeric NOT NULL DEFAULT 70 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  preview_desktop_url text,
  preview_mobile_url text,
  carousel_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  demo_url text,
  segment_tags text[] NOT NULL DEFAULT '{}',
  style_tags text[] NOT NULL DEFAULT '{}',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,        -- { colors:{primary,secondary,accent,bg,fg}, fonts:{display,body}, radius, shadow }
  default_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_plan text NOT NULL DEFAULT 'inicial',    -- inicial / profissional / premium
  status theme_status NOT NULL DEFAULT 'approved',
  partner_id uuid REFERENCES public.theme_partners(id) ON DELETE SET NULL,
  install_count integer NOT NULL DEFAULT 0,
  rating_avg numeric NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.theme_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  price_cents integer NOT NULL DEFAULT 0,
  stripe_session_id text,
  stripe_payment_intent text,
  partner_id uuid REFERENCES public.theme_partners(id) ON DELETE SET NULL,
  partner_commission_percent numeric NOT NULL DEFAULT 0,
  partner_earnings_cents integer NOT NULL DEFAULT 0,
  platform_earnings_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',         -- pending / completed / refunded
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, theme_id)
);

CREATE TABLE public.store_theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  active_theme_id uuid REFERENCES public.themes(id) ON DELETE SET NULL,
  customizations jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { colors, fonts, sections:[{id,enabled,order}], buttonStyle, cardStyle, logoUrl }
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE TRIGGER trg_themes_updated BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.theme_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_store_theme_settings_updated BEFORE UPDATE ON public.store_theme_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_themes_status ON public.themes(status);
CREATE INDEX idx_themes_partner ON public.themes(partner_id);
CREATE INDEX idx_purchases_store ON public.theme_purchases(store_id);
CREATE INDEX idx_purchases_theme ON public.theme_purchases(theme_id);

-- RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_theme_settings ENABLE ROW LEVEL SECURITY;

-- Themes policies
CREATE POLICY "Public view approved themes" ON public.themes
  FOR SELECT USING (status = 'approved' OR has_role(auth.uid(), 'platform_admin') OR (partner_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.theme_partners p WHERE p.id = themes.partner_id AND p.user_id = auth.uid())));

CREATE POLICY "Admins manage themes" ON public.themes
  FOR ALL USING (has_role(auth.uid(), 'platform_admin')) WITH CHECK (has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Partners manage own themes" ON public.themes
  FOR ALL USING (partner_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.theme_partners p WHERE p.id = themes.partner_id AND p.user_id = auth.uid()))
  WITH CHECK (partner_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.theme_partners p WHERE p.id = themes.partner_id AND p.user_id = auth.uid()));

-- Partners policies
CREATE POLICY "Admins manage partners" ON public.theme_partners
  FOR ALL USING (has_role(auth.uid(), 'platform_admin')) WITH CHECK (has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Partners view own profile" ON public.theme_partners
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'));

-- Purchases policies
CREATE POLICY "Owner views own purchases" ON public.theme_purchases
  FOR SELECT USING (is_store_owner(store_id) OR has_role(auth.uid(), 'platform_admin') OR (partner_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.theme_partners p WHERE p.id = theme_purchases.partner_id AND p.user_id = auth.uid())));
CREATE POLICY "Service role manages purchases" ON public.theme_purchases
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Owner inserts free purchases" ON public.theme_purchases
  FOR INSERT WITH CHECK (is_store_owner(store_id) AND price_cents = 0);

-- Store theme settings
CREATE POLICY "Public reads active theme" ON public.store_theme_settings
  FOR SELECT USING (true);
CREATE POLICY "Owner manages own theme settings" ON public.store_theme_settings
  FOR ALL USING (is_store_owner(store_id) OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (is_store_owner(store_id) OR has_role(auth.uid(), 'platform_admin'));

-- Helper: check if a store has unlocked a theme (for free or after purchase)
CREATE OR REPLACE FUNCTION public.store_has_theme(_store_id uuid, _theme_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.themes t
    WHERE t.id = _theme_id AND (
      t.is_free
      OR EXISTS (SELECT 1 FROM public.theme_purchases p WHERE p.store_id = _store_id AND p.theme_id = _theme_id AND p.status = 'completed')
    )
  );
$$;

-- Increment install counter
CREATE OR REPLACE FUNCTION public.increment_theme_installs(_theme_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.themes SET install_count = install_count + 1 WHERE id = _theme_id;
$$;

-- Seed 6 themes
INSERT INTO public.themes (slug, name, tagline, description, price_cents, is_free, segment_tags, style_tags, features, tokens, default_sections, required_plan, status, display_order)
VALUES
('minimal', 'Minimal', 'Tipografia limpa e foco no produto', 'Layout minimalista com muito respiro, ideal para marcas premium e curadoria.', 0, true,
  ARRAY['Moda','Decoração','Acessórios'], ARRAY['Minimalista','Clean'],
  '["Tipografia editorial","Hero clean","Cards sem borda"]'::jsonb,
  '{"colors":{"primary":"#111111","secondary":"#666666","accent":"#111111","bg":"#FFFFFF","fg":"#111111"},"fonts":{"display":"Playfair Display","body":"Inter"},"radius":"4px","shadow":"none"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"categories","enabled":true},{"id":"featured","enabled":true},{"id":"new","enabled":true},{"id":"offers","enabled":true}]'::jsonb,
  'inicial', 'approved', 1),

('classic', 'Classic', 'O equilíbrio perfeito para qualquer loja', 'Layout versátil com cores quentes, perfeito para começar.', 0, true,
  ARRAY['Moda','Kids','Calçados','Casa'], ARRAY['Clássico','Versátil'],
  '["Hero com banner","Carrossel de categorias","Linha de destaque colorida"]'::jsonb,
  '{"colors":{"primary":"#1A6B4A","secondary":"#0F4732","accent":"#F4A300","bg":"#FFFFFF","fg":"#1A1A1A"},"fonts":{"display":"Poppins","body":"Inter"},"radius":"12px","shadow":"sm"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"categories","enabled":true},{"id":"featured","enabled":true},{"id":"new","enabled":true},{"id":"offers","enabled":true}]'::jsonb,
  'inicial', 'approved', 2),

('luxe', 'Luxe', 'Sofisticação para marcas premium', 'Tons profundos, dourados e tipografia serifada para um visual luxuoso.', 19700, false,
  ARRAY['Joias','Moda','Cosméticos'], ARRAY['Luxo','Elegante','Premium'],
  '["Paleta escura premium","Detalhes dourados","Tipografia serifada","Hero cinematográfico"]'::jsonb,
  '{"colors":{"primary":"#0A0A0A","secondary":"#2A2A2A","accent":"#C9A96E","bg":"#FAFAF7","fg":"#0A0A0A"},"fonts":{"display":"Cormorant Garamond","body":"Inter"},"radius":"2px","shadow":"lg"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"featured","enabled":true},{"id":"categories","enabled":true},{"id":"offers","enabled":true},{"id":"testimonials","enabled":true}]'::jsonb,
  'profissional', 'approved', 3),

('vibrant', 'Vibrant', 'Cores vivas para conquistar olhares', 'Paleta colorida e energética para marcas jovens e divertidas.', 9700, false,
  ARRAY['Kids','Moda','Acessórios'], ARRAY['Colorido','Divertido','Jovem'],
  '["Paleta vibrante","Botões arredondados","Cards com sombra colorida"]'::jsonb,
  '{"colors":{"primary":"#FF3B7F","secondary":"#7C4DFF","accent":"#FFD43B","bg":"#FFFFFF","fg":"#1A1A1A"},"fonts":{"display":"Poppins","body":"Inter"},"radius":"24px","shadow":"md"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"categories","enabled":true},{"id":"featured","enabled":true},{"id":"new","enabled":true},{"id":"offers","enabled":true}]'::jsonb,
  'inicial', 'approved', 4),

('boutique', 'Boutique', 'Charme artesanal e acolhedor', 'Tons terrosos e tipografia caligráfica para um clima boutique.', 14700, false,
  ARRAY['Moda','Decoração','Artesanato'], ARRAY['Boutique','Aconchegante','Artesanal'],
  '["Tons terrosos","Tipografia caligráfica","Cards com borda suave"]'::jsonb,
  '{"colors":{"primary":"#8B5E3C","secondary":"#A47148","accent":"#D4A373","bg":"#FAF3E7","fg":"#3E2723"},"fonts":{"display":"DM Serif Display","body":"DM Sans"},"radius":"16px","shadow":"sm"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"featured","enabled":true},{"id":"categories","enabled":true},{"id":"new","enabled":true}]'::jsonb,
  'profissional', 'approved', 5),

('sport', 'Sport', 'Energia e movimento para marcas esportivas', 'Visual dinâmico com cores fortes e tipografia bold.', 12700, false,
  ARRAY['Esporte','Moda','Suplementos'], ARRAY['Esportivo','Energético','Bold'],
  '["Cores fortes","Tipografia bold","Layout dinâmico"]'::jsonb,
  '{"colors":{"primary":"#E63946","secondary":"#1D3557","accent":"#FFB703","bg":"#F8F9FA","fg":"#1D3557"},"fonts":{"display":"Bebas Neue","body":"Inter"},"radius":"8px","shadow":"md"}'::jsonb,
  '[{"id":"banner","enabled":true},{"id":"featured","enabled":true},{"id":"categories","enabled":true},{"id":"offers","enabled":true},{"id":"new","enabled":true}]'::jsonb,
  'inicial', 'approved', 6);
