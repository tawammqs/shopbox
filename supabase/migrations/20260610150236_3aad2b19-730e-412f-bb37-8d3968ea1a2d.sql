
CREATE TABLE IF NOT EXISTS public.newsletter_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS newsletter_leads_store_id_idx ON public.newsletter_leads(store_id);

GRANT INSERT ON public.newsletter_leads TO anon, authenticated;
GRANT SELECT ON public.newsletter_leads TO authenticated;
GRANT ALL ON public.newsletter_leads TO service_role;

ALTER TABLE public.newsletter_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Store owner reads own leads" ON public.newsletter_leads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_user_id = auth.uid()));
