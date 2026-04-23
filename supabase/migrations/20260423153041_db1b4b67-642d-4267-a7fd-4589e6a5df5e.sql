-- Drop unique constraint on store_id (allows multiple videos per store)
ALTER TABLE public.home_video_sections
  DROP CONSTRAINT IF EXISTS home_video_sections_store_id_key;

-- Add position column for ordering carousel
ALTER TABLE public.home_video_sections
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Add aspect column (vertical or horizontal)
ALTER TABLE public.home_video_sections
  ADD COLUMN IF NOT EXISTS aspect text NOT NULL DEFAULT 'vertical';

-- Index for ordered fetching
CREATE INDEX IF NOT EXISTS idx_home_video_sections_store_position
  ON public.home_video_sections (store_id, position);
