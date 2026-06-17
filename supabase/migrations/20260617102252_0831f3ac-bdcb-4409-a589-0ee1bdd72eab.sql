
-- 1. Table for ordering products inside each homepage section
CREATE TABLE IF NOT EXISTS public.product_section_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, product_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_psp_store_section ON public.product_section_positions(store_id, section_key, position);

GRANT SELECT ON public.product_section_positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_section_positions TO authenticated;
GRANT ALL ON public.product_section_positions TO service_role;

ALTER TABLE public.product_section_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product section positions"
  ON public.product_section_positions FOR SELECT
  USING (true);

CREATE POLICY "Store owners manage product section positions"
  ON public.product_section_positions FOR ALL
  USING (public.is_store_owner(store_id))
  WITH CHECK (public.is_store_owner(store_id));

CREATE TRIGGER update_psp_updated_at
  BEFORE UPDATE ON public.product_section_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Backfill: copy legacy section aliases from tags -> featured_sections
-- so the admin checkbox (which writes featured_sections) reflects current
-- visibility and the strict storefront filter shows the same products.
WITH alias_map(alias, canonical) AS (
  VALUES
    ('destaque','destaque'),('destaques','destaque'),('featured','destaque'),
    ('lancamento','lancamento'),('lancamentos','lancamento'),
    ('lançamento','lancamento'),('lançamentos','lancamento'),('novos','lancamento'),
    ('promocao','promocao'),('promoção','promocao'),
    ('oferta','promocao'),('ofertas','promocao'),('sale','promocao'),
    ('mais_vendido','mais_vendido'),('mais_vendidos','mais_vendido'),('best_seller','mais_vendido')
),
to_add AS (
  SELECT p.id AS product_id, am.canonical
  FROM public.products p
  CROSS JOIN LATERAL unnest(p.tags::text[]) AS t(tag_value)
  JOIN alias_map am ON lower(t.tag_value) = am.alias
  WHERE NOT (am.canonical = ANY(COALESCE(p.featured_sections, ARRAY[]::text[])))
  GROUP BY p.id, am.canonical
)
UPDATE public.products p
SET featured_sections = (
  SELECT ARRAY(
    SELECT DISTINCT x FROM unnest(
      COALESCE(p.featured_sections, ARRAY[]::text[]) ||
      ARRAY(SELECT canonical FROM to_add ta WHERE ta.product_id = p.id)
    ) AS x
  )
)
WHERE EXISTS (SELECT 1 FROM to_add ta WHERE ta.product_id = p.id);
