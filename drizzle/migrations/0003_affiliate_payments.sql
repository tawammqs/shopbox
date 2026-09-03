-- Colunas financeiras no afiliado
ALTER TABLE public.store_affiliates
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pending_commission numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_commission numeric(12,2) NOT NULL DEFAULT 0;

-- Backfill a partir das vendas existentes
UPDATE public.store_affiliates a SET
  pending_commission = coalesce((SELECT sum(commission_amount) FROM public.affiliate_sales s WHERE s.affiliate_id = a.id AND s.status IN ('pending','confirmed')), 0),
  paid_commission = coalesce((SELECT sum(commission_amount) FROM public.affiliate_sales s WHERE s.affiliate_id = a.id AND s.status = 'paid'), 0);

-- Trigger: nova venda acumula saldo pendente
CREATE OR REPLACE FUNCTION public.affiliate_sale_accumulate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('pending','confirmed') THEN
    UPDATE public.store_affiliates SET pending_commission = pending_commission + coalesce(NEW.commission_amount,0) WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_affiliate_sale_accumulate ON public.affiliate_sales;
CREATE TRIGGER trg_affiliate_sale_accumulate AFTER INSERT ON public.affiliate_sales
FOR EACH ROW EXECUTE FUNCTION public.affiliate_sale_accumulate();

-- Tabela de pagamentos PIX
CREATE TABLE IF NOT EXISTS public.affiliate_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.store_affiliates(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  pix_key text,
  notes text,
  paid_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_payments_store_idx ON public.affiliate_payments(store_id, paid_at DESC);
GRANT SELECT ON public.affiliate_payments TO authenticated;
GRANT ALL ON public.affiliate_payments TO service_role;
ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view affiliate payments" ON public.affiliate_payments
  FOR SELECT TO authenticated USING (public.is_store_owner(store_id));

-- JSON público do afiliado inclui dados financeiros
CREATE OR REPLACE FUNCTION public.affiliate_public_json(_a store_affiliates)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', _a.id, 'store_id', _a.store_id, 'name', _a.name, 'email', _a.email,
    'whatsapp', _a.whatsapp, 'affiliate_slug', _a.affiliate_slug,
    'commission_percent', _a.commission_percent,
    'referral_commission_percent', _a.referral_commission_percent,
    'status', _a.status, 'created_at', _a.created_at, 'session_token', _a.session_token,
    'pix_key', _a.pix_key, 'pending_commission', _a.pending_commission, 'paid_commission', _a.paid_commission);
$$;

-- Dashboard inclui histórico de pagamentos
CREATE OR REPLACE FUNCTION public.affiliate_dashboard(_token uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a public.store_affiliates%ROWTYPE; v_sales jsonb; v_refs jsonb; v_pay jsonb;
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
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'amount', p.amount, 'notes', p.notes, 'paid_at', p.paid_at, 'pix_key', p.pix_key) ORDER BY p.paid_at DESC), '[]'::jsonb)
    INTO v_pay FROM public.affiliate_payments p WHERE p.affiliate_id = v_a.id;
  RETURN jsonb_build_object('affiliate', public.affiliate_public_json(v_a), 'sales', v_sales, 'referrals', v_refs, 'payments', v_pay);
END; $$;

-- Afiliado atualiza a própria chave PIX (via token de sessão)
CREATE OR REPLACE FUNCTION public.affiliate_set_pix_key(_token uuid, _pix_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a public.store_affiliates%ROWTYPE;
BEGIN
  UPDATE public.store_affiliates SET pix_key = nullif(trim(_pix_key), '')
   WHERE session_token = _token AND status = 'active' RETURNING * INTO v_a;
  IF v_a.id IS NULL THEN RETURN NULL; END IF;
  RETURN public.affiliate_public_json(v_a);
END; $$;
GRANT EXECUTE ON FUNCTION public.affiliate_set_pix_key(uuid, text) TO anon, authenticated;

-- Lojista registra pagamento PIX (atômico)
CREATE OR REPLACE FUNCTION public.pay_affiliate(_affiliate_id uuid, _notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a public.store_affiliates%ROWTYPE; v_amount numeric; v_pid uuid;
BEGIN
  SELECT * INTO v_a FROM public.store_affiliates WHERE id = _affiliate_id FOR UPDATE;
  IF v_a.id IS NULL OR NOT public.is_store_owner(v_a.store_id) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;
  v_amount := coalesce(v_a.pending_commission, 0);
  IF v_amount <= 0 THEN RETURN jsonb_build_object('amount', 0); END IF;
  INSERT INTO public.affiliate_payments (store_id, affiliate_id, amount, pix_key, notes, paid_by)
  VALUES (v_a.store_id, v_a.id, v_amount, v_a.pix_key, nullif(trim(_notes), ''), auth.uid()) RETURNING id INTO v_pid;
  UPDATE public.store_affiliates SET paid_commission = paid_commission + v_amount, pending_commission = 0 WHERE id = v_a.id;
  UPDATE public.affiliate_sales SET status = 'paid' WHERE affiliate_id = v_a.id AND status IN ('pending','confirmed');
  RETURN jsonb_build_object('payment_id', v_pid, 'amount', v_amount);
END; $$;
REVOKE ALL ON FUNCTION public.pay_affiliate(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_affiliate(uuid, text) TO authenticated;