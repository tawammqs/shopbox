CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id, changed_at);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views status history"
ON public.order_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND (public.is_store_owner(o.store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  )
);

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_history (order_id, status, changed_at)
    VALUES (NEW.id, NEW.status, NEW.created_at);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_at)
    VALUES (NEW.id, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_status_insert
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

CREATE TRIGGER trg_log_order_status_update
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Backfill existing orders with their current status
INSERT INTO public.order_status_history (order_id, status, changed_at)
SELECT id, status, created_at FROM public.orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_status_history h WHERE h.order_id = orders.id
);