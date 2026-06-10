INSERT INTO public.store_theme_settings (store_id, active_theme_id)
SELECT s.id, t.id FROM public.stores s, public.themes t
WHERE s.slug = 'the-shoes' AND t.slug = 'mio-style'
ON CONFLICT (store_id) DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id;