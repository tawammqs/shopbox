DO $$ BEGIN
  CREATE POLICY "Anyone can upload review photos to products bucket" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      bucket_id = 'products'
      AND (storage.foldername(name))[1] = 'reviews'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;