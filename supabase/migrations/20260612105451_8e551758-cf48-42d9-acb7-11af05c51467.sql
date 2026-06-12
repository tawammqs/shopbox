
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.coupon_leads ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.vip_group_leads ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.vip_group_leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.newsletter_leads ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.product_questions ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_unread ON public.orders(store_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coupon_leads_unread ON public.coupon_leads(store_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vip_leads_unread ON public.vip_group_leads(store_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_unread ON public.newsletter_leads(store_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_questions_unread ON public.product_questions(product_id, viewed_at) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_reviews_unread ON public.product_reviews(product_id, viewed_at) WHERE viewed_at IS NULL;

NOTIFY pgrst, 'reload schema';
