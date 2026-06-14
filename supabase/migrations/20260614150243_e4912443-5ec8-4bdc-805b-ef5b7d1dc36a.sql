ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS photo_url text;

DO $$ BEGIN
  CREATE POLICY "Anyone can upload review photos" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'review-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read review photos" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'review-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;