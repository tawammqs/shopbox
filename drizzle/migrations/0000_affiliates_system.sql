CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS affiliates_enabled boolean NOT NULL DEFAULT false;
UPDATE public.stores SET affiliates_enabled = true WHERE slug = 'the-shoes';

CREATE TABLE IF NOT EXISTS public.store_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  affiliate_slug text NOT NULL,
  password_hash text NOT NULL,
  session_token uuid,
  referred_by uuid REFERENCES public.store_affiliates(id) ON DELETE SET NULL,
  commission_percent numeric NOT NULL DEFAULT 10,
  referral_commission_percent numeric NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, affiliate_slug),
  UNIQUE (store_id, email)
);
GRANT SELECT ON public.store_affiliates TO authenticated;
GRANT ALL ON public.store_affiliates TO service_role;
ALTER TABLE public.store_affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view affiliates" ON public.store_affiliates
  FOR SELECT TO authenticated USING (public.is_store_owner(store_id));

CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.store_affiliates(id) ON DELETE CASCADE,
  source_affiliate_id uuid REFERENCES public.store_affiliates(id) ON DELETE SET NULL,
  order_id uuid,
  level smallint NOT NULL DEFAULT 1,
  order_total numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  customer_name text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_sales_affiliate_idx ON public.affiliate_sales(affiliate_id, created_at DESC);
GRANT SELECT, UPDATE ON public.affiliate_sales TO authenticated;
GRANT ALL ON public.affiliate_sales TO service_role;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view affiliate sales" ON public.affiliate_sales
  FOR SELECT TO authenticated USING (public.is_store_owner(store_id));
CREATE POLICY "Store owners can update affiliate sales" ON public.affiliate_sales
  FOR UPDATE TO authenticated USING (public.is_store_owner(store_id));

-- Slug generator: "Tawam Marques" -> "tawammarques"
CREATE OR REPLACE FUNCTION public.affiliate_slugify(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT substr(lower(regexp_replace(translate(_name,
    'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'), '[^a-zA-Z0-9]', '', 'g')), 1, 30);
$$;

CREATE OR REPLACE FUNCTION public.affiliate_public_json(_a public.store_affiliates)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', _a.id, 'store_id', _a.store_id, 'name', _a.name, 'email', _a.email,
    'whatsapp', _a.whatsapp, 'affiliate_slug', _a.affiliate_slug,
    'commission_percent', _a.commission_percent,
    'referral_commission_percent', _a.referral_commission_percent,
    'status', _a.status, 'created_at', _a.created_at, 'session_token', _a.session_token);
$$;

-- Registration: hashes password, generates unique slug, links referrer
CREATE OR REPLACE FUNCTION public.register_affiliate(
  _store_id uuid, _name text, _email text, _whatsapp text, _password text, _referred_by_slug text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_store public.stores%ROWTYPE;
  v_base text; v_slug text; v_n int := 1;
  v_ref uuid; v_row public.store_affiliates%ROWTYPE;
BEGIN
  SELECT * INTO v_store FROM public.stores WHERE id = _store_id;
  IF v_store.id IS NULL OR NOT v_store.affiliates_enabled THEN
    RAISE EXCEPTION 'Programa de afiliados indisponível para esta loja';
  END IF;
  IF length(trim(_name)) < 2 THEN RAISE EXCEPTION 'Informe seu nome'; END IF;
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Email inválido'; END IF;
  IF length(_password) < 6 THEN RAISE EXCEPTION 'A senha deve ter pelo menos 6 caracteres'; END IF;
  IF EXISTS (SELECT 1 FROM public.store_affiliates WHERE store_id = _store_id AND email = lower(trim(_email))) THEN
    RAISE EXCEPTION 'Este email já está cadastrado como afiliado';
  END IF;
  v_base := public.affiliate_slugify(_name);
  IF v_base = '' THEN v_base := 'afiliado'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = v_slug) LOOP
    v_n := v_n + 1; v_slug := v_base || v_n::text;
  END LOOP;
  IF _referred_by_slug IS NOT NULL AND _referred_by_slug <> '' THEN
    SELECT id INTO v_ref FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = _referred_by_slug AND status = 'active';
  END IF;
  INSERT INTO public.store_affiliates (store_id, name, email, whatsapp, affiliate_slug, password_hash, referred_by, session_token)
  VALUES (_store_id, trim(_name), lower(trim(_email)), NULLIF(regexp_replace(coalesce(_whatsapp,''), '\D', '', 'g'), ''),
          v_slug, extensions.crypt(_password, extensions.gen_salt('bf')), v_ref, gen_random_uuid())
  RETURNING * INTO v_row;
  RETURN public.affiliate_public_json(v_row);
END;
$$;

-- Login: verifies password, rotates session token
CREATE OR REPLACE FUNCTION public.affiliate_login(_store_id uuid, _email text, _password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_row public.store_affiliates%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.store_affiliates
   WHERE store_id = _store_id AND email = lower(trim(_email)) AND status = 'active';
  IF v_row.id IS NULL THEN RETURN jsonb_build_object('error', 'email_not_found'); END IF;
  IF v_row.password_hash <> extensions.crypt(_password, v_row.password_hash) THEN
    RETURN jsonb_build_object('error', 'invalid_password');
  END IF;
  UPDATE public.store_affiliates SET session_token = gen_random_uuid() WHERE id = v_row.id RETURNING * INTO v_row;
  RETURN public.affiliate_public_json(v_row);
END;
$$;

-- Kept for compatibility with the spec
CREATE OR REPLACE FUNCTION public.verify_affiliate_password(affiliate_id uuid, password_input text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, extensions AS $$
  SELECT EXISTS (SELECT 1 FROM public.store_affiliates a
    WHERE a.id = affiliate_id AND a.password_hash = extensions.crypt(password_input, a.password_hash));
$$;

-- Public lookup of affiliate name by slug (for banner/checkout message)
CREATE OR REPLACE FUNCTION public.affiliate_name_by_slug(_store_id uuid, _slug text)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT name FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = _slug AND status = 'active' LIMIT 1;
$$;

-- Register sale + commissions (direct + referral level)
CREATE OR REPLACE FUNCTION public.register_affiliate_sale(
  _store_id uuid, _affiliate_slug text, _order_id uuid, _order_total numeric, _customer_name text, _items jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a public.store_affiliates%ROWTYPE; v_ref public.store_affiliates%ROWTYPE; v_comm numeric;
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = _affiliate_slug AND status = 'active';
  IF v_a.id IS NULL THEN RETURN NULL; END IF;
  IF _order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.affiliate_sales WHERE order_id = _order_id) THEN
    RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
  END IF;
  v_comm := round(coalesce(_order_total,0) * v_a.commission_percent / 100, 2);
  INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items)
  VALUES (_store_id, v_a.id, v_a.id, _order_id, 1, coalesce(_order_total,0), v_a.commission_percent, v_comm, _customer_name, coalesce(_items,'[]'::jsonb));
  IF v_a.referred_by IS NOT NULL THEN
    SELECT * INTO v_ref FROM public.store_affiliates WHERE id = v_a.referred_by AND status = 'active';
    IF v_ref.id IS NOT NULL AND v_ref.referral_commission_percent > 0 THEN
      INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items)
      VALUES (_store_id, v_ref.id, v_a.id, _order_id, 2, coalesce(_order_total,0), v_ref.referral_commission_percent,
              round(coalesce(_order_total,0) * v_ref.referral_commission_percent / 100, 2), _customer_name, coalesce(_items,'[]'::jsonb));
    END IF;
  END IF;
  RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
END;
$$;

-- Dashboard data, authenticated by session token
CREATE OR REPLACE FUNCTION public.affiliate_dashboard(_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_a public.store_affiliates%ROWTYPE; v_sales jsonb; v_refs jsonb;
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE session_token = _token AND status = 'active';
  IF v_a.id IS NULL THEN RETURN NULL; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'level', s.level, 'order_total', s.order_total, 'commission_amount', s.commission_amount,
      'commission_percent', s.commission_percent, 'customer_name', s.customer_name, 'status', s.status,
      'created_at', s.created_at, 'items', s.items,
      'source_name', CASE WHEN s.level = 2 THEN src.name ELSE NULL END) ORDER BY s.created_at DESC), '[]'::jsonb)
    INTO v_sales
    FROM public.affiliate_sales s LEFT JOIN public.store_affiliates src ON src.id = s.source_affiliate_id
    WHERE s.affiliate_id = v_a.id;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'affiliate_slug', r.affiliate_slug, 'created_at', r.created_at) ORDER BY r.created_at DESC), '[]'::jsonb)
    INTO v_refs FROM public.store_affiliates r WHERE r.referred_by = v_a.id;
  RETURN jsonb_build_object('affiliate', public.affiliate_public_json(v_a), 'sales', v_sales, 'referrals', v_refs);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_affiliate(uuid, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_login(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_affiliate_password(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_name_by_slug(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_affiliate_sale(uuid, text, uuid, numeric, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_dashboard(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_slugify(text) TO anon, authenticated;