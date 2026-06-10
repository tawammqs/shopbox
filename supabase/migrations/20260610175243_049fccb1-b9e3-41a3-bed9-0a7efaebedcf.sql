INSERT INTO public.categories (store_id, name, slug, parent_id, display_order)
SELECT id, 'NK', 'nk', NULL, 99 FROM public.stores WHERE slug = 'the-shoes'
ON CONFLICT DO NOTHING;