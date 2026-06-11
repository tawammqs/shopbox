
-- ============= store_payment_settings =============
CREATE TABLE IF NOT EXISTS public.store_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  pix_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pix_key TEXT,
  pix_discount_percent NUMERIC(4,1) NOT NULL DEFAULT 0,
  credit_card_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cash_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  pickup_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  installments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_installments INTEGER NOT NULL DEFAULT 3,
  installments_no_interest BOOLEAN NOT NULL DEFAULT TRUE,
  min_installment_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_payment_settings TO authenticated;
GRANT ALL ON public.store_payment_settings TO service_role;
ALTER TABLE public.store_payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read payment settings for active stores"
  ON public.store_payment_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = TRUE));
CREATE POLICY "Owner manages payment settings"
  ON public.store_payment_settings FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

-- ============= store_contact_info =============
CREATE TABLE IF NOT EXISTS public.store_contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  company_name TEXT,
  tax_id TEXT,
  store_email TEXT,
  address TEXT,
  phone TEXT,
  contact_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_contact_info TO authenticated;
GRANT ALL ON public.store_contact_info TO service_role;
ALTER TABLE public.store_contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages contact info"
  ON public.store_contact_info FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

-- ============= store_users =============
CREATE TABLE IF NOT EXISTS public.store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'custom',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{"messages": true, "newsletter": false, "sale": true}'::jsonb,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_users_store ON public.store_users(store_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_users TO authenticated;
GRANT ALL ON public.store_users TO service_role;
ALTER TABLE public.store_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages store users"
  ON public.store_users FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

-- ============= store_domains =============
CREATE TABLE IF NOT EXISTS public.store_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending',
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_domains_store ON public.store_domains(store_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_domains TO authenticated;
GRANT ALL ON public.store_domains TO service_role;
ALTER TABLE public.store_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages domains"
  ON public.store_domains FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_user_id = auth.uid()));

-- ============= updated_at trigger =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_store_payment_settings_updated_at BEFORE UPDATE ON public.store_payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_store_contact_info_updated_at BEFORE UPDATE ON public.store_contact_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_store_users_updated_at BEFORE UPDATE ON public.store_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_store_domains_updated_at BEFORE UPDATE ON public.store_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
