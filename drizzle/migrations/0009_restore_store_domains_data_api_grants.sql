GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.store_domains TO authenticated;
GRANT SELECT ON TABLE public.store_domains TO anon;
GRANT ALL ON TABLE public.store_domains TO service_role;