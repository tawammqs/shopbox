GRANT SELECT ON public.store_addons TO anon, authenticated;
GRANT SELECT ON public.store_addon_configs TO anon, authenticated;
GRANT SELECT ON public.store_videos TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_addons'
      AND policyname = 'Public read store addons'
  ) THEN
    CREATE POLICY "Public read store addons"
      ON public.store_addons
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;