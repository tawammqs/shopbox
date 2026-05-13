
DROP POLICY IF EXISTS "Owner uploads storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner updates storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner deletes storefront assets" ON storage.objects;

CREATE POLICY "Owner uploads storefront assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = ANY (ARRAY['products','categories','banners','logo'])
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND (s.id)::text = (storage.foldername(objects.name))[1]
    )
  );

CREATE POLICY "Owner updates storefront assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = ANY (ARRAY['products','categories','banners','logo'])
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND (s.id)::text = (storage.foldername(objects.name))[1]
    )
  )
  WITH CHECK (
    bucket_id = ANY (ARRAY['products','categories','banners','logo'])
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND (s.id)::text = (storage.foldername(objects.name))[1]
    )
  );

CREATE POLICY "Owner deletes storefront assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = ANY (ARRAY['products','categories','banners','logo'])
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND (s.id)::text = (storage.foldername(objects.name))[1]
    )
  );
