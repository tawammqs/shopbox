GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_domains TO authenticated;
GRANT SELECT ON public.store_domains TO anon;
GRANT ALL ON public.store_domains TO service_role;