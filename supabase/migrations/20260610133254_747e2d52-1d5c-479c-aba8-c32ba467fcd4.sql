CREATE TABLE IF NOT EXISTS public.vip_group_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  whatsapp text NOT NULL,
  source text DEFAULT 'achadinhos_banner',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.vip_group_leads TO anon;
GRANT SELECT, INSERT ON public.vip_group_leads TO authenticated;
GRANT ALL ON public.vip_group_leads TO service_role;

ALTER TABLE public.vip_group_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a VIP lead"
  ON public.vip_group_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners can view their VIP leads"
  ON public.vip_group_leads
  FOR SELECT
  TO authenticated
  USING (public.is_store_owner(store_id));

CREATE INDEX IF NOT EXISTS vip_group_leads_store_id_idx ON public.vip_group_leads(store_id);