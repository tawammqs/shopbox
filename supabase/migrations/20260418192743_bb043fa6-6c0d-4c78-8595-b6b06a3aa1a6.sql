
-- WIPE
DROP TABLE IF EXISTS public.product_stock CASCADE;
DROP TABLE IF EXISTS public.product_sizes CASCADE;
DROP TABLE IF EXISTS public.product_colors CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.product_tag CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'user');
CREATE TYPE public.product_tag AS ENUM ('destaques', 'lancamentos', 'ofertas', 'principal');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid', 'inactive');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.coupon_type AS ENUM ('fixed', 'percent');
CREATE TYPE public.promo_scope AS ENUM ('all', 'category', 'subcategory', 'tag', 'products');
CREATE TYPE public.combo_kind AS ENUM ('fixed_total', 'percent', 'free_n');
CREATE TYPE public.video_kind AS ENUM ('youtube', 'mp4');

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Platform admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'platform_admin'));

-- updated_at fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PLANS
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  max_products INTEGER NOT NULL DEFAULT 50,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active plans" ON public.plans FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Platform admins manage plans" ON public.plans FOR ALL USING (public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORES
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  segment TEXT,
  tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#1a6b4a',
  whatsapp TEXT NOT NULL DEFAULT '',
  whatsapp_greeting TEXT,
  instagram TEXT, facebook TEXT, tiktok TEXT, youtube TEXT,
  custom_domain TEXT,
  trust_badges JSONB NOT NULL DEFAULT '["Pagamento seguro","Entrega combinada","Troca facilitada"]'::jsonb,
  shipping_rates JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  welcome_popup JSONB NOT NULL DEFAULT '{"enabled":false,"coupon":"BEMVINDO","message":"Ganhe 10% na primeira compra!","delaySeconds":15,"frequency":"session"}'::jsonb,
  notify_stock_enabled BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  plan_id UUID REFERENCES public.plans(id),
  subscription_status public.subscription_status NOT NULL DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE INDEX stores_slug_idx ON public.stores(slug);
CREATE INDEX stores_owner_idx ON public.stores(owner_user_id);
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_user_id = auth.uid()) $$;

CREATE POLICY "Public view active stores" ON public.stores FOR SELECT
  USING (active = true OR owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Owner inserts own store" ON public.stores FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owner updates own store" ON public.stores FOR UPDATE USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Owner deletes own store" ON public.stores FOR DELETE USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX categories_store_idx ON public.categories(store_id);
CREATE POLICY "Public view categories of active stores" ON public.categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND (s.active = true OR s.owner_user_id = auth.uid())));
CREATE POLICY "Owner manages categories" ON public.categories FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  promo_price NUMERIC,
  promo_starts_at TIMESTAMPTZ,
  promo_ends_at TIMESTAMPTZ,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags public.product_tag[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  meta_title TEXT,
  meta_description TEXT,
  size_guide_url TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  wishlist_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX products_store_idx ON public.products(store_id);
CREATE INDEX products_category_idx ON public.products(category_id);

-- now safe to define helper that references products
CREATE OR REPLACE FUNCTION public.store_id_from_product(_product_id UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT store_id FROM public.products WHERE id = _product_id $$;

CREATE POLICY "Public view active products of active stores" ON public.products FOR SELECT
  USING ((active = true AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true)) OR public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));
CREATE POLICY "Owner manages products" ON public.products FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(), 'platform_admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VARIATIONS
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Owner manages product images" ON public.product_images FOR ALL
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product colors" ON public.product_colors FOR SELECT USING (true);
CREATE POLICY "Owner manages product colors" ON public.product_colors FOR ALL
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product sizes" ON public.product_sizes FOR SELECT USING (true);
CREATE POLICY "Owner manages product sizes" ON public.product_sizes FOR ALL
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.product_colors(id) ON DELETE CASCADE,
  size_id UUID REFERENCES public.product_sizes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product stock" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Owner manages product stock" ON public.product_stock FOR ALL
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.product_video_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  kind public.video_kind NOT NULL DEFAULT 'youtube',
  customer_name TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  quote TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_video_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view video testimonials" ON public.product_video_testimonials FOR SELECT USING (true);
CREATE POLICY "Owner manages video testimonials" ON public.product_video_testimonials FOR ALL
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  status public.review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view approved reviews" ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Anyone submits review" ON public.product_reviews FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Owner moderates reviews" ON public.product_reviews FOR UPDATE
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Owner deletes reviews" ON public.product_reviews FOR DELETE
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

-- BANNERS
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT, subtitle TEXT, button_label TEXT, button_link TEXT,
  desktop_url TEXT, mobile_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE INDEX banners_store_idx ON public.banners(store_id);
CREATE POLICY "Public view active banners" ON public.banners FOR SELECT
  USING ((active = true AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active = true)) OR public.is_store_owner(store_id));
CREATE POLICY "Owner manages banners" ON public.banners FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STATIC PAGES
CREATE TABLE public.static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view static pages" ON public.static_pages FOR SELECT USING (true);
CREATE POLICY "Owner manages static pages" ON public.static_pages FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER static_pages_updated BEFORE UPDATE ON public.static_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type public.coupon_type NOT NULL,
  value NUMERIC NOT NULL,
  min_cart NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  max_uses_per_customer INTEGER,
  expires_at TIMESTAMPTZ,
  scope_type public.promo_scope NOT NULL DEFAULT 'all',
  scope_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_purchase_only BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  uses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages coupons" ON public.coupons FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_whatsapp TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views coupon uses" ON public.coupon_uses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.coupons c WHERE c.id = coupon_id AND public.is_store_owner(c.store_id)));

-- PROMOTIONS
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  badge_label TEXT,
  type public.coupon_type NOT NULL,
  value NUMERIC NOT NULL,
  scope_type public.promo_scope NOT NULL DEFAULT 'all',
  scope_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active promotions" ON public.promotions FOR SELECT
  USING (active = true OR public.is_store_owner(store_id));
CREATE POLICY "Owner manages promotions" ON public.promotions FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER promotions_updated BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.combo_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  badge_label TEXT,
  scope_type public.promo_scope NOT NULL DEFAULT 'all',
  scope_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_quantity INTEGER NOT NULL DEFAULT 2,
  discount_kind public.combo_kind NOT NULL,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.combo_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active combos" ON public.combo_promotions FOR SELECT
  USING (active = true OR public.is_store_owner(store_id));
CREATE POLICY "Owner manages combos" ON public.combo_promotions FOR ALL
  USING (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'))
  WITH CHECK (public.is_store_owner(store_id) OR public.has_role(auth.uid(),'platform_admin'));
CREATE TRIGGER combo_promotions_updated BEFORE UPDATE ON public.combo_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STOCK NOTIFY
CREATE TABLE public.stock_notify_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.product_colors(id) ON DELETE SET NULL,
  size_id UUID REFERENCES public.product_sizes(id) ON DELETE SET NULL,
  customer_whatsapp TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_notify_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone creates notify request" ON public.stock_notify_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner views notify requests" ON public.stock_notify_requests FOR SELECT
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));
CREATE POLICY "Owner updates notify requests" ON public.stock_notify_requests FOR UPDATE
  USING (public.is_store_owner(public.store_id_from_product(product_id)) OR public.has_role(auth.uid(),'platform_admin'));

-- SUBSCRIPTION EVENTS
CREATE TABLE public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  stripe_event_id TEXT UNIQUE,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner views own events" ON public.subscription_events FOR SELECT
  USING ((store_id IS NOT NULL AND public.is_store_owner(store_id)) OR public.has_role(auth.uid(),'platform_admin'));

-- TRIGGER: defaults on store creation
CREATE OR REPLACE FUNCTION public.create_store_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.static_pages (store_id, slug, title, content_md) VALUES
    (NEW.id, 'sobre', 'Quem Somos', '# Quem Somos' || E'\n\nConte aqui a história da sua loja.'),
    (NEW.id, 'politicas', 'Políticas de Troca e Entrega', '# Políticas' || E'\n\nDescreva suas políticas de troca, devolução e entrega.'),
    (NEW.id, 'contato', 'Contato', '# Contato' || E'\n\nEntre em contato pelo nosso WhatsApp.');
  RETURN NEW;
END; $$;
CREATE TRIGGER stores_create_defaults AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.create_store_defaults();

-- SEED PLANS
INSERT INTO public.plans (name, slug, price_cents, max_products, features, display_order) VALUES
  ('Básico', 'basico', 4900, 50, '["Até 50 produtos","Checkout WhatsApp","1 banner","Suporte por email"]'::jsonb, 1),
  ('Profissional', 'profissional', 9900, 500, '["Até 500 produtos","Checkout WhatsApp","Banners ilimitados","Cupons e promoções","Reviews","Vídeos de depoimento","Suporte prioritário"]'::jsonb, 2),
  ('Premium', 'premium', 19900, 5000, '["Produtos ilimitados","Tudo do Profissional","Domínio personalizado","Relatórios avançados","Suporte dedicado"]'::jsonb, 3);
