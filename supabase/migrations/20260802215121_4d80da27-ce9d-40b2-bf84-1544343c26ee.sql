CREATE OR REPLACE VIEW public.product_color_groups
WITH (security_invoker = on) AS
SELECT
  p.store_id,
  p.brand,
  TRIM(SPLIT_PART(p.title, ' - ', 1)) AS model_name,
  array_agg(p.id ORDER BY p.created_at) AS product_ids,
  array_agg(p.slug ORDER BY p.created_at) AS product_slugs,
  array_agg(TRIM(SUBSTRING(p.title FROM POSITION(' - ' IN p.title) + 3)) ORDER BY p.created_at) AS colors,
  array_agg(COALESCE((
    SELECT pi.url FROM public.product_images pi
    WHERE pi.product_id = p.id
    ORDER BY pi.position ASC LIMIT 1
  ), '') ORDER BY p.created_at) AS first_images,
  COUNT(*) AS variant_count
FROM public.products p
WHERE p.title LIKE '% - %'
  AND p.active = true
GROUP BY p.store_id, p.brand, TRIM(SPLIT_PART(p.title, ' - ', 1))
HAVING COUNT(*) > 1;

GRANT SELECT ON public.product_color_groups TO anon, authenticated;
GRANT ALL ON public.product_color_groups TO service_role;