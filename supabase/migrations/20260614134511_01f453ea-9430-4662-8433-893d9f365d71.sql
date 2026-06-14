
CREATE TABLE public.store_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  plan_tier text,
  status text NOT NULL DEFAULT 'inactive',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, addon_key)
);
CREATE INDEX idx_store_addons_store ON public.store_addons(store_id);
CREATE INDEX idx_store_addons_sub ON public.store_addons(stripe_subscription_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_addons TO authenticated;
GRANT ALL ON public.store_addons TO service_role;

ALTER TABLE public.store_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages addons"
  ON public.store_addons FOR ALL
  TO authenticated
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER trg_store_addons_updated
  BEFORE UPDATE ON public.store_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_addon_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, addon_key)
);
CREATE INDEX idx_store_addon_configs_store ON public.store_addon_configs(store_id);

GRANT SELECT ON public.store_addon_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_addon_configs TO authenticated;
GRANT ALL ON public.store_addon_configs TO service_role;

ALTER TABLE public.store_addon_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read addon configs"
  ON public.store_addon_configs FOR SELECT
  USING (true);

CREATE POLICY "Owner manages addon configs"
  ON public.store_addon_configs FOR ALL
  TO authenticated
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER trg_store_addon_configs_updated
  BEFORE UPDATE ON public.store_addon_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  thumbnail_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  placement text NOT NULL DEFAULT 'home_carousel',
  title text,
  position integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_videos_store_placement ON public.store_videos(store_id, placement, position);
CREATE INDEX idx_store_videos_product ON public.store_videos(product_id);

GRANT SELECT ON public.store_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_videos TO authenticated;
GRANT ALL ON public.store_videos TO service_role;

ALTER TABLE public.store_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read store videos"
  ON public.store_videos FOR SELECT
  USING (true);

CREATE POLICY "Owner manages store videos"
  ON public.store_videos FOR ALL
  TO authenticated
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER trg_store_videos_updated
  BEFORE UPDATE ON public.store_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
