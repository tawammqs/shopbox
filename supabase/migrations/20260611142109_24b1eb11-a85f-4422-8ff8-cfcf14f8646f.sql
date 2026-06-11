
ALTER TABLE public.store_domains
  ADD COLUMN IF NOT EXISTS cloudflare_hostname_id TEXT,
  ADD COLUMN IF NOT EXISTS ownership_verification_name TEXT,
  ADD COLUMN IF NOT EXISTS ownership_verification_value TEXT;

CREATE INDEX IF NOT EXISTS idx_store_domains_domain_active
  ON public.store_domains(domain) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_store_domains_cloudflare_id
  ON public.store_domains(cloudflare_hostname_id);

-- Allow anonymous lookup of active domains for storefront hostname routing
DROP POLICY IF EXISTS "Public can read active domains" ON public.store_domains;
CREATE POLICY "Public can read active domains"
  ON public.store_domains FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

GRANT SELECT ON public.store_domains TO anon;
