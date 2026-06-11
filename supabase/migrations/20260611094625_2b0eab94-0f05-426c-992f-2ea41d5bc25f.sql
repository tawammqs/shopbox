
CREATE TABLE IF NOT EXISTS public.store_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_menus TO authenticated;
GRANT SELECT ON public.store_menus TO anon;
GRANT ALL ON public.store_menus TO service_role;
ALTER TABLE public.store_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menus" ON public.store_menus FOR SELECT USING (true);
CREATE POLICY "Owner manages menus" ON public.store_menus FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.store_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.store_menus(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_menu_items TO authenticated;
GRANT SELECT ON public.store_menu_items TO anon;
GRANT ALL ON public.store_menu_items TO service_role;
ALTER TABLE public.store_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu items" ON public.store_menu_items FOR SELECT USING (true);
CREATE POLICY "Owner manages menu items" ON public.store_menu_items FOR ALL
  USING (menu_id IN (SELECT m.id FROM public.store_menus m JOIN public.stores s ON s.id = m.store_id WHERE s.owner_user_id = auth.uid()))
  WITH CHECK (menu_id IN (SELECT m.id FROM public.store_menus m JOIN public.stores s ON s.id = m.store_id WHERE s.owner_user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.store_filter_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  show_variations boolean NOT NULL DEFAULT true,
  show_brand boolean NOT NULL DEFAULT true,
  show_price boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_filter_settings TO authenticated;
GRANT SELECT ON public.store_filter_settings TO anon;
GRANT ALL ON public.store_filter_settings TO service_role;
ALTER TABLE public.store_filter_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read filters" ON public.store_filter_settings FOR SELECT USING (true);
CREATE POLICY "Owner manages filters" ON public.store_filter_settings FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.store_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  instagram_username text,
  instagram_token text,
  facebook_url text,
  youtube_url text,
  tiktok_username text,
  twitter_username text,
  pinterest_url text,
  pinterest_tag text,
  blog_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_social_links TO authenticated;
GRANT SELECT ON public.store_social_links TO anon;
GRANT ALL ON public.store_social_links TO service_role;
ALTER TABLE public.store_social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read social" ON public.store_social_links FOR SELECT USING (true);
CREATE POLICY "Owner manages social" ON public.store_social_links FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));
