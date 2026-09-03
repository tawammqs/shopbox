ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS affiliate_commission_direct numeric(5,2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS affiliate_commission_referrer numeric(5,2) NOT NULL DEFAULT 2.50;

-- New affiliates inherit the store's configured commissions
CREATE OR REPLACE FUNCTION public.register_affiliate(_store_id uuid, _name text, _email text, _whatsapp text, _password text, _referred_by_slug text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  INSERT INTO public.store_affiliates (store_id, name, email, whatsapp, affiliate_slug, password_hash, referred_by, session_token, commission_percent, referral_commission_percent)
  VALUES (_store_id, trim(_name), lower(trim(_email)), NULLIF(regexp_replace(coalesce(_whatsapp,''), '\D', '', 'g'), ''),
          v_slug, extensions.crypt(_password, extensions.gen_salt('bf')), v_ref, gen_random_uuid(),
          coalesce(v_store.affiliate_commission_direct, 5), coalesce(v_store.affiliate_commission_referrer, 2.5))
  RETURNING * INTO v_row;
  RETURN public.affiliate_public_json(v_row);
END;
$function$;

-- Sales use the store's configured commission rates
CREATE OR REPLACE FUNCTION public.register_affiliate_sale(_store_id uuid, _affiliate_slug text, _order_id uuid, _order_total numeric, _customer_name text, _items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_a public.store_affiliates%ROWTYPE; v_ref public.store_affiliates%ROWTYPE;
  v_comm numeric; v_direct numeric; v_referrer numeric;
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = _affiliate_slug AND status = 'active';
  IF v_a.id IS NULL THEN RETURN NULL; END IF;
  IF _order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.affiliate_sales WHERE order_id = _order_id) THEN
    RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
  END IF;
  SELECT coalesce(affiliate_commission_direct, v_a.commission_percent), coalesce(affiliate_commission_referrer, 0)
    INTO v_direct, v_referrer FROM public.stores WHERE id = _store_id;
  v_direct := coalesce(v_direct, v_a.commission_percent);
  v_referrer := coalesce(v_referrer, 0);
  v_comm := round(coalesce(_order_total,0) * v_direct / 100, 2);
  INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items)
  VALUES (_store_id, v_a.id, v_a.id, _order_id, 1, coalesce(_order_total,0), v_direct, v_comm, _customer_name, coalesce(_items,'[]'::jsonb));
  IF v_a.referred_by IS NOT NULL AND v_referrer > 0 THEN
    SELECT * INTO v_ref FROM public.store_affiliates WHERE id = v_a.referred_by AND status = 'active';
    IF v_ref.id IS NOT NULL THEN
      INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items)
      VALUES (_store_id, v_ref.id, v_a.id, _order_id, 2, coalesce(_order_total,0), v_referrer,
              round(coalesce(_order_total,0) * v_referrer / 100, 2), _customer_name, coalesce(_items,'[]'::jsonb));
    END IF;
  END IF;
  RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
END;
$function$;