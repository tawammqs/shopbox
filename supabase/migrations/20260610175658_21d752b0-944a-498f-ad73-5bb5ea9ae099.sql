UPDATE public.categories
SET parent_id = (SELECT id FROM public.categories WHERE store_id = (SELECT id FROM public.stores WHERE slug='the-shoes') AND slug='marcas')
WHERE store_id = (SELECT id FROM public.stores WHERE slug='the-shoes')
  AND slug IN ('nk','nb','add','vns','vrt','pm','olym','mzn','crcs');