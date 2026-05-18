ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
  ADD COLUMN IF NOT EXISTS meta_conversion_token text,
  ADD COLUMN IF NOT EXISTS google_analytics_id text;