ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'aguardando_confirmacao',
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS delivery_notes text,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.track_order(_store_id uuid, _order_number integer, _whatsapp text)
RETURNS TABLE(
  order_number integer,
  created_at timestamptz,
  delivery_status text,
  tracking_code text,
  tracking_url text,
  delivery_notes text,
  status_updated_at timestamptz,
  total numeric,
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits text;
BEGIN
  v_digits := regexp_replace(coalesce(_whatsapp, ''), '\D', '', 'g');

  IF _order_number IS NULL AND length(v_digits) < 8 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT o.order_number, o.created_at, o.delivery_status, o.tracking_code,
         o.tracking_url, o.delivery_notes, o.status_updated_at, o.total, o.items
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
   WHERE o.store_id = _store_id
     AND (
       (_order_number IS NOT NULL AND o.order_number = _order_number)
       OR (
         _order_number IS NULL
         AND length(v_digits) >= 8
         AND regexp_replace(coalesce(c.whatsapp, ''), '\D', '', 'g') = v_digits
       )
     )
   ORDER BY o.created_at DESC
   LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order(uuid, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_order(uuid, integer, text) TO anon, authenticated;