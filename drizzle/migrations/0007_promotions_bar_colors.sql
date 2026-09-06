ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#111827',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#ffffff';