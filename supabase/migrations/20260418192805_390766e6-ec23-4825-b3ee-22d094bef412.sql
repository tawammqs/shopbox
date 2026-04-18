
-- Remove existing overly permissive bucket SELECT policies and replace with read-only object access
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Public READ on individual objects from public buckets (no listing)
CREATE POLICY "Public read storefront assets" ON storage.objects FOR SELECT
  USING (bucket_id IN ('products','categories','banners','logo'));

-- Authenticated users can upload to these buckets
CREATE POLICY "Authenticated upload storefront assets" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('products','categories','banners','logo'));

-- Authenticated users can update objects they own
CREATE POLICY "Authenticated update storefront assets" ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('products','categories','banners','logo') AND owner = auth.uid());

-- Authenticated users can delete objects they own
CREATE POLICY "Authenticated delete storefront assets" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('products','categories','banners','logo') AND owner = auth.uid());
