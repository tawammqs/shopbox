
-- ============================================================================
-- 1. STORES: column-level privileges to hide Stripe / billing fields
-- ============================================================================
-- Strategy: keep existing RLS policies, but restrict which COLUMNS the
-- anon and authenticated roles can read. Service role (server functions)
-- still has full access.

REVOKE SELECT ON public.stores FROM anon, authenticated;

GRANT SELECT (
  id, owner_user_id, name, slug, tagline, segment, logo_url, favicon_url,
  accent_color, whatsapp, whatsapp_greeting, instagram, facebook, tiktok,
  youtube, trust_badges, shipping_rates, seo_meta, welcome_popup,
  notify_stock_enabled, active, plan_id, subscription_status,
  trial_ends_at, current_period_end, custom_domain,
  created_at, updated_at
) ON public.stores TO anon, authenticated;

-- INSERT/UPDATE grants stay as-is (default for authenticated via RLS).
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;

-- ============================================================================
-- 2. REALTIME: stop broadcasting stores changes to all subscribers
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'stores'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.stores';
  END IF;
END $$;

-- ============================================================================
-- 3. STORAGE: enforce per-store folder ownership on storefront buckets
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated upload storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete storefront assets" ON storage.objects;

CREATE POLICY "Owner uploads storefront assets"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = ANY (ARRAY['products','categories','banners','logo'])
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_user_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Owner updates storefront assets"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = ANY (ARRAY['products','categories','banners','logo'])
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_user_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = ANY (ARRAY['products','categories','banners','logo'])
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_user_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Owner deletes storefront assets"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = ANY (ARRAY['products','categories','banners','logo'])
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_user_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
  )
);
