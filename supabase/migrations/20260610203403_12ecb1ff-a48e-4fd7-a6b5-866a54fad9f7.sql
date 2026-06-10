-- Security hardening migration
-- 1. Move meta_conversion_token to a private table with strict RLS
CREATE TABLE IF NOT EXISTS public.store_private_secrets (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  meta_conversion_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_private_secrets TO authenticated;
GRANT ALL ON public.store_private_secrets TO service_role;
-- Intentionally NO grant to anon.

ALTER TABLE public.store_private_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner reads own store secrets" ON public.store_private_secrets;
CREATE POLICY "Owner reads own store secrets"
  ON public.store_private_secrets FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
      AND (s.owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  ));

DROP POLICY IF EXISTS "Owner inserts own store secrets" ON public.store_private_secrets;
CREATE POLICY "Owner inserts own store secrets"
  ON public.store_private_secrets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
      AND (s.owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  ));

DROP POLICY IF EXISTS "Owner updates own store secrets" ON public.store_private_secrets;
CREATE POLICY "Owner updates own store secrets"
  ON public.store_private_secrets FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
      AND (s.owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
      AND (s.owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  ));

DROP POLICY IF EXISTS "Owner deletes own store secrets" ON public.store_private_secrets;
CREATE POLICY "Owner deletes own store secrets"
  ON public.store_private_secrets FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = store_id
      AND (s.owner_user_id = auth.uid() OR has_role(auth.uid(), 'platform_admin'::app_role))
  ));

-- 2. Migrate existing meta_conversion_token values, then drop the column.
INSERT INTO public.store_private_secrets (store_id, meta_conversion_token)
SELECT id, meta_conversion_token
FROM public.stores
WHERE meta_conversion_token IS NOT NULL AND meta_conversion_token <> ''
ON CONFLICT (store_id) DO UPDATE SET meta_conversion_token = EXCLUDED.meta_conversion_token;

ALTER TABLE public.stores DROP COLUMN IF EXISTS meta_conversion_token;

-- 3. Hide Stripe identifiers from non-service-role clients.
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.stores FROM anon;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.stores FROM authenticated;

-- 4. Drop the unused customer_wishlist table (wishlist is client-side localStorage only).
DROP TABLE IF EXISTS public.customer_wishlist CASCADE;
