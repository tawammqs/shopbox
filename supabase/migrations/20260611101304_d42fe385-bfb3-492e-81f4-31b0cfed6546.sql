
CREATE TABLE public.store_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  path text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  session_id text,
  device text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_visits_store_created ON public.store_visits(store_id, created_at DESC);
CREATE INDEX idx_store_visits_product ON public.store_visits(product_id) WHERE product_id IS NOT NULL;

GRANT INSERT ON public.store_visits TO anon, authenticated;
GRANT SELECT ON public.store_visits TO authenticated;
GRANT ALL ON public.store_visits TO service_role;

ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a visit to an active store"
  ON public.store_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND active = true));

CREATE POLICY "Store owners can read their visits"
  ON public.store_visits FOR SELECT
  TO authenticated
  USING (public.is_store_owner(store_id));
