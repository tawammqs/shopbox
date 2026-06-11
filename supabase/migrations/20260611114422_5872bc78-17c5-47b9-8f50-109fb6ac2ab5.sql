
CREATE POLICY "Store owners delete their coupon leads"
  ON public.coupon_leads FOR DELETE
  TO authenticated
  USING (public.is_store_owner(store_id));

ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS preview_mobile_url text,
  ADD COLUMN IF NOT EXISTS category text;

UPDATE public.themes
SET preview_desktop_url = COALESCE(preview_desktop_url, 'https://placehold.co/800x500/ff6b00/ffffff?text=Tema+Padrao'),
    preview_mobile_url  = COALESCE(preview_mobile_url,  'https://placehold.co/300x500/ff6b00/ffffff?text=Mobile'),
    category            = COALESCE(category, 'Infantil, Roupas')
WHERE slug IN ('default','padrao');

UPDATE public.themes
SET preview_desktop_url = COALESCE(preview_desktop_url, 'https://placehold.co/800x500/dfdac8/333333?text=Mio+Style'),
    preview_mobile_url  = COALESCE(preview_mobile_url,  'https://placehold.co/300x500/dfdac8/333333?text=Mobile'),
    category            = COALESCE(category, 'Roupas, Moda')
WHERE slug = 'mio-style';
