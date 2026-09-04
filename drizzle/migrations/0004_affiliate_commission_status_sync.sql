-- Recompute an affiliate's payable balance: only CONFIRMED (unpaid) commissions count.
CREATE OR REPLACE FUNCTION public.recalc_affiliate_balance(_affiliate_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.store_affiliates a
     SET pending_commission = coalesce((
           SELECT sum(s.commission_amount) FROM public.affiliate_sales s
            WHERE s.affiliate_id = a.id AND s.status = 'confirmed'), 0)
   WHERE a.id = _affiliate_id;
$$;

-- Replace the old accumulate trigger with a recalc on any change.
DROP TRIGGER IF EXISTS trg_affiliate_sale_accumulate ON public.affiliate_sales;

CREATE OR REPLACE FUNCTION public.affiliate_sale_accumulate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_affiliate_balance(OLD.affiliate_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_affiliate_balance(NEW.affiliate_id);
  IF TG_OP = 'UPDATE' AND OLD.affiliate_id IS DISTINCT FROM NEW.affiliate_id THEN
    PERFORM public.recalc_affiliate_balance(OLD.affiliate_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_affiliate_sale_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_sales
FOR EACH ROW EXECUTE FUNCTION public.affiliate_sale_accumulate();

-- Map order status -> commission status
CREATE OR REPLACE FUNCTION public.affiliate_status_for_order(_status order_status)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _status = 'cancelado' THEN 'cancelled'
    WHEN _status IN ('confirmado','enviado','entregue') THEN 'confirmed'
    ELSE 'pending' END;
$$;

-- Orders status change -> sync affiliate_sales (never touch already paid rows)
CREATE OR REPLACE FUNCTION public.sync_affiliate_sale_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.affiliate_sales SET status = 'cancelled'
     WHERE order_id = OLD.id AND status <> 'paid';
    RETURN OLD;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.affiliate_sales SET status = public.affiliate_status_for_order(NEW.status)
     WHERE order_id = NEW.id AND status <> 'paid';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_sync_affiliate_status ON public.orders;
CREATE TRIGGER trg_orders_sync_affiliate_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_sale_status();

DROP TRIGGER IF EXISTS trg_orders_delete_affiliate_status ON public.orders;
CREATE TRIGGER trg_orders_delete_affiliate_status
BEFORE DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_sale_status();

-- New sales inherit the order's current status (normally pending)
CREATE OR REPLACE FUNCTION public.register_affiliate_sale(_store_id uuid, _affiliate_slug text, _order_id uuid, _order_total numeric, _customer_name text, _items jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_a public.store_affiliates%ROWTYPE; v_ref public.store_affiliates%ROWTYPE;
  v_comm numeric; v_direct numeric; v_referrer numeric; v_status text := 'pending';
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE store_id = _store_id AND affiliate_slug = _affiliate_slug AND status = 'active';
  IF v_a.id IS NULL THEN RETURN NULL; END IF;
  IF _order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.affiliate_sales WHERE order_id = _order_id) THEN
    RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
  END IF;
  IF _order_id IS NOT NULL THEN
    SELECT public.affiliate_status_for_order(o.status) INTO v_status FROM public.orders o WHERE o.id = _order_id;
    v_status := coalesce(v_status, 'pending');
  END IF;
  SELECT coalesce(affiliate_commission_direct, v_a.commission_percent), coalesce(affiliate_commission_referrer, 0)
    INTO v_direct, v_referrer FROM public.stores WHERE id = _store_id;
  v_direct := coalesce(v_direct, v_a.commission_percent);
  v_referrer := coalesce(v_referrer, 0);
  v_comm := round(coalesce(_order_total,0) * v_direct / 100, 2);
  INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items, status)
  VALUES (_store_id, v_a.id, v_a.id, _order_id, 1, coalesce(_order_total,0), v_direct, v_comm, _customer_name, coalesce(_items,'[]'::jsonb), v_status);
  IF v_a.referred_by IS NOT NULL AND v_referrer > 0 THEN
    SELECT * INTO v_ref FROM public.store_affiliates WHERE id = v_a.referred_by AND status = 'active';
    IF v_ref.id IS NOT NULL THEN
      INSERT INTO public.affiliate_sales (store_id, affiliate_id, source_affiliate_id, order_id, level, order_total, commission_percent, commission_amount, customer_name, items, status)
      VALUES (_store_id, v_ref.id, v_a.id, _order_id, 2, coalesce(_order_total,0), v_referrer,
              round(coalesce(_order_total,0) * v_referrer / 100, 2), _customer_name, coalesce(_items,'[]'::jsonb), v_status);
    END IF;
  END IF;
  RETURN jsonb_build_object('name', v_a.name, 'affiliate_slug', v_a.affiliate_slug);
END;
$$;

-- Paying only settles CONFIRMED commissions
CREATE OR REPLACE FUNCTION public.pay_affiliate(_affiliate_id uuid, _notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_a public.store_affiliates%ROWTYPE; v_amount numeric; v_pid uuid;
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE id = _affiliate_id FOR UPDATE;
  IF v_a.id IS NULL OR NOT public.is_store_owner(v_a.store_id) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  SELECT coalesce(sum(commission_amount),0) INTO v_amount FROM public.affiliate_sales WHERE affiliate_id = v_a.id AND status = 'confirmed';
  IF v_amount <= 0 THEN RETURN jsonb_build_object('amount', 0); END IF;
  INSERT INTO public.affiliate_payments (store_id, affiliate_id, amount, pix_key, notes, paid_by)
  VALUES (v_a.store_id, v_a.id, v_amount, v_a.pix_key, nullif(trim(_notes), ''), auth.uid()) RETURNING id INTO v_pid;
  UPDATE public.store_affiliates SET paid_commission = paid_commission + v_amount WHERE id = v_a.id;
  UPDATE public.affiliate_sales SET status = 'paid' WHERE affiliate_id = v_a.id AND status = 'confirmed';
  PERFORM public.recalc_affiliate_balance(v_a.id);
  RETURN jsonb_build_object('payment_id', v_pid, 'amount', v_amount);
END; $$;