-- Status enum
CREATE TYPE public.order_status AS ENUM ('aguardando', 'confirmado', 'enviado', 'entregue', 'cancelado');

-- Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  cpf text,
  cep text,
  address text,
  city_state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, whatsapp)
);

CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE INDEX idx_customers_search ON public.customers(store_id, name, whatsapp);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages customers"
  ON public.customers FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Public inserts customer at checkout"
  ON public.customers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(name)) >= 2
    AND length(trim(whatsapp)) >= 8
    AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true)
  );

CREATE POLICY "Public updates customer at checkout"
  ON public.customers FOR UPDATE
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number integer NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  coupon_code text,
  promotion_description text,
  total numeric NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'aguardando',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, order_number)
);

CREATE INDEX idx_orders_store ON public.orders(store_id, created_at DESC);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages orders"
  ON public.orders FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Public inserts order at checkout"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true)
  );

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-store sequential order numbering via trigger
CREATE OR REPLACE FUNCTION public.assign_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = 0 THEN
    SELECT COALESCE(MAX(order_number), 0) + 1
      INTO NEW.order_number
      FROM public.orders
     WHERE store_id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_assign_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.assign_order_number();

-- Helper RPC for upserting customer + creating order in one shot (atomic, public)
CREATE OR REPLACE FUNCTION public.create_order_with_customer(
  _store_id uuid,
  _name text,
  _whatsapp text,
  _email text,
  _cpf text,
  _cep text,
  _address text,
  _city_state text,
  _items jsonb,
  _subtotal numeric,
  _discount numeric,
  _coupon_code text,
  _promotion_description text,
  _total numeric
) RETURNS TABLE(order_id uuid, order_number integer, customer_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND active = true) THEN
    RAISE EXCEPTION 'Store not found or inactive';
  END IF;
  IF length(trim(_name)) < 2 OR length(trim(_whatsapp)) < 8 THEN
    RAISE EXCEPTION 'Invalid customer data';
  END IF;

  INSERT INTO public.customers (store_id, name, whatsapp, email, cpf, cep, address, city_state)
  VALUES (_store_id, _name, _whatsapp, _email, _cpf, _cep, _address, _city_state)
  ON CONFLICT (store_id, whatsapp) DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(EXCLUDED.email, public.customers.email),
    cpf = COALESCE(EXCLUDED.cpf, public.customers.cpf),
    cep = COALESCE(EXCLUDED.cep, public.customers.cep),
    address = COALESCE(EXCLUDED.address, public.customers.address),
    city_state = COALESCE(EXCLUDED.city_state, public.customers.city_state),
    updated_at = now()
  RETURNING id INTO v_customer_id;

  INSERT INTO public.orders (
    store_id, customer_id, items, subtotal, discount_amount,
    coupon_code, promotion_description, total
  ) VALUES (
    _store_id, v_customer_id, _items, _subtotal, _discount,
    _coupon_code, _promotion_description, _total
  ) RETURNING id, public.orders.order_number INTO v_order_id, v_order_number;

  RETURN QUERY SELECT v_order_id, v_order_number, v_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_customer(uuid, text, text, text, text, text, text, text, jsonb, numeric, numeric, text, text, numeric) TO anon, authenticated;