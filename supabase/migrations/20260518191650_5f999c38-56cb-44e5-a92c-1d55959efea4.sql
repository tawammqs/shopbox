
-- Ensure table-level privileges are not blocking access (RLS still enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT SELECT ON public.banners TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;

-- Re-assert the canonical RLS policies on stores (idempotent)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner deletes own store" ON public.stores;
DROP POLICY IF EXISTS "Owner inserts own store" ON public.stores;
DROP POLICY IF EXISTS "Owner updates own store" ON public.stores;
DROP POLICY IF EXISTS "Public view active stores" ON public.stores;
DROP POLICY IF EXISTS "Owner reads own store" ON public.stores;

CREATE POLICY "Owner reads own store"
  ON public.stores FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid() OR active = true OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Public view active stores"
  ON public.stores FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Owner inserts own store"
  ON public.stores FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner updates own store"
  ON public.stores FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Owner deletes own store"
  ON public.stores FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role));
