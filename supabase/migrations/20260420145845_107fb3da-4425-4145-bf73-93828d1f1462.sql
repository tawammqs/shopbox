-- Remove overly-permissive UPDATE policy; RPC handles upsert atomically
DROP POLICY IF EXISTS "Public updates customer at checkout" ON public.customers;

-- Tighten public order insert: customer must belong to same store (or be null)
DROP POLICY IF EXISTS "Public inserts order at checkout" ON public.orders;
CREATE POLICY "Public inserts order at checkout"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true)
    AND (
      customer_id IS NULL
      OR EXISTS (SELECT 1 FROM public.customers c WHERE c.id = customer_id AND c.store_id = orders.store_id)
    )
  );