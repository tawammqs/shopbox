
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured_sections text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS stock_mode text DEFAULT 'infinite',
  ADD COLUMN IF NOT EXISTS stock_quantity integer;
