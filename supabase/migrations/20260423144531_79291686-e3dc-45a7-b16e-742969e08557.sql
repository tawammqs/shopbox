-- 1. Add video fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_type text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_video_type_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_video_type_check
  CHECK (video_type IS NULL OR video_type IN ('upload','mp4','youtube'));

-- 2. home_video_sections
CREATE TABLE IF NOT EXISTS public.home_video_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Descubra cada detalhe em vídeo',
  video_url text,
  video_type text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_video_sections
  DROP CONSTRAINT IF EXISTS home_video_sections_video_type_check;
ALTER TABLE public.home_video_sections
  ADD CONSTRAINT home_video_sections_video_type_check
  CHECK (video_type IS NULL OR video_type IN ('upload','mp4','youtube'));

ALTER TABLE public.home_video_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages home video section" ON public.home_video_sections;
CREATE POLICY "Owner manages home video section"
  ON public.home_video_sections FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Public view active home video section" ON public.home_video_sections;
CREATE POLICY "Public view active home video section"
  ON public.home_video_sections FOR SELECT
  USING (
    (is_active = true AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = home_video_sections.store_id AND s.active = true))
    OR public.is_store_owner(store_id)
  );

DROP TRIGGER IF EXISTS trg_home_video_sections_updated ON public.home_video_sections;
CREATE TRIGGER trg_home_video_sections_updated
  BEFORE UPDATE ON public.home_video_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. home_video_tags
CREATE TABLE IF NOT EXISTS public.home_video_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_video_section_id uuid NOT NULL REFERENCES public.home_video_sections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position_x numeric NOT NULL DEFAULT 50 CHECK (position_x >= 0 AND position_x <= 100),
  position_y numeric NOT NULL DEFAULT 50 CHECK (position_y >= 0 AND position_y <= 100),
  timestamp_start integer,
  timestamp_end integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_home_video_tags_section ON public.home_video_tags(home_video_section_id);

ALTER TABLE public.home_video_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages home video tags" ON public.home_video_tags;
CREATE POLICY "Owner manages home video tags"
  ON public.home_video_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.home_video_sections s WHERE s.id = home_video_tags.home_video_section_id AND (public.is_store_owner(s.store_id) OR public.has_role(auth.uid(),'platform_admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.home_video_sections s WHERE s.id = home_video_tags.home_video_section_id AND (public.is_store_owner(s.store_id) OR public.has_role(auth.uid(),'platform_admin'))));

DROP POLICY IF EXISTS "Public view tags of active sections" ON public.home_video_tags;
CREATE POLICY "Public view tags of active sections"
  ON public.home_video_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.home_video_sections s
    JOIN public.stores st ON st.id = s.store_id
    WHERE s.id = home_video_tags.home_video_section_id
      AND ((s.is_active = true AND st.active = true) OR public.is_store_owner(s.store_id))
  ));

-- 4. Storage bucket for product videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos','product-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product videos" ON storage.objects;
CREATE POLICY "Public read product videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Owner uploads product videos" ON storage.objects;
CREATE POLICY "Owner uploads product videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Owner updates product videos" ON storage.objects;
CREATE POLICY "Owner updates product videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Owner deletes product videos" ON storage.objects;
CREATE POLICY "Owner deletes product videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(name))[1]
    )
  );