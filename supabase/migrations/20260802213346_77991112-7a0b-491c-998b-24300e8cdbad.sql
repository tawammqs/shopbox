CREATE TABLE IF NOT EXISTS public.store_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  sobre_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_policies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_policies TO authenticated;
GRANT ALL ON public.store_policies TO service_role;

ALTER TABLE public.store_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view store policies"
  ON public.store_policies FOR SELECT
  USING (true);

CREATE POLICY "Owners manage store policies"
  ON public.store_policies FOR ALL
  TO authenticated
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER update_store_policies_updated_at
  BEFORE UPDATE ON public.store_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();