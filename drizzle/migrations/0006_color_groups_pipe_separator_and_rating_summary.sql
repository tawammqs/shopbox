-- Color groups: accept " - " or " | " as model/color separator, normalize whitespace,
-- and group by store + model name (brand column may be inconsistent between variants).
DROP VIEW IF EXISTS public.product_color_groups;
CREATE VIEW public.product_color_groups
WITH (security_invoker = true) AS
WITH parsed AS (
  SELECT
    p.id, p.store_id, p.brand, p.slug, p.created_at,
    regexp_replace(p.title, '\s+', ' ', 'g') AS norm_title
  FROM public.products p
  WHERE p.active = true
    AND regexp_replace(p.title, '\s+', ' ', 'g') ~ '\s*(\||\s-\s)\s*'
), split AS (
  SELECT
    id, store_id, brand, slug, created_at,
    trim(both from (regexp_match(norm_title, '^(.*?)\s*(?:\||\s-\s)\s*(.+)$'))[1]) AS model_name,
    trim(both from (regexp_match(norm_title, '^(.*?)\s*(?:\||\s-\s)\s*(.+)$'))[2]) AS color_name
  FROM parsed
)
SELECT
  s.store_id,
  min(s.brand) AS brand,
  s.model_name,
  array_agg(s.id ORDER BY s.created_at) AS product_ids,
  array_agg(s.slug ORDER BY s.created_at) AS product_slugs,
  array_agg(s.color_name ORDER BY s.created_at) AS colors,
  array_agg(COALESCE((SELECT pi.url FROM public.product_images pi WHERE pi.product_id = s.id ORDER BY pi.position LIMIT 1), '') ORDER BY s.created_at) AS first_images,
  count(*) AS variant_count
FROM split s
WHERE s.model_name <> '' AND s.color_name IS NOT NULL AND s.color_name <> ''
GROUP BY s.store_id, lower(s.model_name), s.model_name
HAVING count(*) > 1;

GRANT SELECT ON public.product_color_groups TO anon, authenticated, service_role;

-- Rating summary per product (approved reviews only; RLS of product_reviews applies).
CREATE OR REPLACE VIEW public.product_rating_summary
WITH (security_invoker = true) AS
SELECT
  r.product_id,
  p.store_id,
  round(avg(r.rating)::numeric, 1) AS avg_rating,
  count(*)::integer AS review_count
FROM public.product_reviews r
JOIN public.products p ON p.id = r.product_id
WHERE r.status = 'approved'
GROUP BY r.product_id, p.store_id;

GRANT SELECT ON public.product_rating_summary TO anon, authenticated, service_role;