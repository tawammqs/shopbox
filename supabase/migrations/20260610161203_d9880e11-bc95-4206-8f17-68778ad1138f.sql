CREATE TABLE IF NOT EXISTS public.coupon_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  birthday text,
  coupon_code text NOT NULL DEFAULT 'PRIMEIRA05',
  source text NOT NULL DEFAULT 'floating_tab',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupon_leads TO authenticated;
GRANT INSERT ON public.coupon_leads TO anon, authenticated;
GRANT ALL ON public.coupon_leads TO service_role;

ALTER TABLE public.coupon_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit coupon leads"
  ON public.coupon_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners view their coupon leads"
  ON public.coupon_leads FOR SELECT
  TO authenticated
  USING (public.is_store_owner(store_id));

CREATE INDEX IF NOT EXISTS coupon_leads_store_idx ON public.coupon_leads(store_id, created_at DESC);
