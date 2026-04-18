
-- Wishlist (anonymous, identified by visitor_id stored in localStorage)
CREATE TABLE IF NOT EXISTS public.customer_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_visitor ON public.customer_wishlist(visitor_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.customer_wishlist(product_id);

ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;

-- Anyone can read/write wishlist (scoped by visitor_id at app layer)
CREATE POLICY "Public read wishlist"
  ON public.customer_wishlist FOR SELECT USING (true);

CREATE POLICY "Public insert wishlist"
  ON public.customer_wishlist FOR INSERT WITH CHECK (length(trim(visitor_id)) >= 8);

CREATE POLICY "Public delete wishlist"
  ON public.customer_wishlist FOR DELETE USING (true);

-- Increment view count safely
CREATE OR REPLACE FUNCTION public.increment_product_view(_product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.products SET view_count = view_count + 1 WHERE id = _product_id;
$$;

-- Increment wishlist count trigger
CREATE OR REPLACE FUNCTION public.sync_wishlist_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products SET wishlist_count = wishlist_count + 1 WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products SET wishlist_count = GREATEST(0, wishlist_count - 1) WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wishlist_count ON public.customer_wishlist;
CREATE TRIGGER trg_sync_wishlist_count
AFTER INSERT OR DELETE ON public.customer_wishlist
FOR EACH ROW EXECUTE FUNCTION public.sync_wishlist_count();
