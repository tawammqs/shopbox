-- Junction table: product ↔ categories (many-to-many)
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages product_categories"
ON public.product_categories
FOR ALL
USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Public view product_categories"
ON public.product_categories
FOR SELECT
USING (true);

-- Backfill from legacy single category_id and subcategory_id columns
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

INSERT INTO public.product_categories (product_id, category_id)
SELECT id, subcategory_id FROM public.products WHERE subcategory_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;