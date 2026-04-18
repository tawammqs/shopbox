
DROP POLICY IF EXISTS "Anyone creates notify request" ON public.stock_notify_requests;
CREATE POLICY "Visitor creates notify request" ON public.stock_notify_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(customer_whatsapp)) >= 8);

DROP POLICY IF EXISTS "Anyone submits review" ON public.product_reviews;
CREATE POLICY "Visitor submits review" ON public.product_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND length(trim(customer_name)) >= 2 AND rating BETWEEN 1 AND 5);
