-- Fix ambiguous `name` reference inside EXISTS subselect.
-- The previous policies used `storage.foldername(name)` which Postgres
-- resolved to `stores.name` (the store's name column) instead of
-- `storage.objects.name` (the file path), causing all writes to fail.

DROP POLICY IF EXISTS "Owner uploads product videos" ON storage.objects;
DROP POLICY IF EXISTS "Owner updates product videos" ON storage.objects;
DROP POLICY IF EXISTS "Owner deletes product videos" ON storage.objects;

CREATE POLICY "Owner uploads product videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY "Owner updates product videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY "Owner deletes product videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );