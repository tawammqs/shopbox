CREATE TABLE IF NOT EXISTS public.store_sales_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, whatsapp)
);

GRANT SELECT ON public.store_sales_team TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_sales_team TO authenticated;
GRANT ALL ON public.store_sales_team TO service_role;

ALTER TABLE public.store_sales_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages sales team"
ON public.store_sales_team FOR ALL
TO authenticated
USING (public.is_store_owner(store_id))
WITH CHECK (public.is_store_owner(store_id));

CREATE POLICY "Public reads active sales team"
ON public.store_sales_team FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE TRIGGER update_store_sales_team_updated_at
BEFORE UPDATE ON public.store_sales_team
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();