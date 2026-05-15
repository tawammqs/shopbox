WITH duplicates AS (
  SELECT
    id,
    store_id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY store_id, slug ORDER BY created_at) AS rn
  FROM public.products
)
UPDATE public.products p
SET slug = p.slug || '-' || SUBSTRING(p.id::text, 1, 8)
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;