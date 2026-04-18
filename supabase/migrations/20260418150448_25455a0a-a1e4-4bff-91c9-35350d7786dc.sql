
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.product_tag AS ENUM ('destaques', 'lancamentos', 'ofertas', 'principal');

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- CATEGORIES (self-referencing for subcategories)
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT,
  description TEXT,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(10,2),
  promo_starts_at TIMESTAMPTZ,
  promo_ends_at TIMESTAMPTZ,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags product_tag[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);

-- PRODUCT IMAGES
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_product_images_product ON public.product_images(product_id);

-- PRODUCT COLORS
CREATE TABLE public.product_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product colors" ON public.product_colors FOR SELECT USING (true);
CREATE POLICY "Admins manage product colors" ON public.product_colors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCT SIZES
CREATE TABLE public.product_sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product sizes" ON public.product_sizes FOR SELECT USING (true);
CREATE POLICY "Admins manage product sizes" ON public.product_sizes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCT STOCK (matrix color x size)
CREATE TABLE public.product_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.product_colors(id) ON DELETE CASCADE,
  size_id UUID REFERENCES public.product_sizes(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, color_id, size_id)
);
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view product stock" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Admins manage product stock" ON public.product_stock FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_product_stock_product ON public.product_stock(product_id);

-- BANNERS
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  button_label TEXT,
  button_link TEXT,
  desktop_url TEXT,
  mobile_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active banners" ON public.banners FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORE SETTINGS (singleton)
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Minha Loja',
  logo_url TEXT,
  whatsapp TEXT NOT NULL DEFAULT '',
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  youtube TEXT,
  custom_domain TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('products', 'products', true),
  ('categories', 'categories', true),
  ('banners', 'banners', true),
  ('logo', 'logo', true);

-- STORAGE POLICIES (public read, admin write)
CREATE POLICY "Public read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admins write products bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products bucket" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read categories bucket" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "Admins write categories bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update categories bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete categories bucket" ON storage.objects FOR DELETE USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read banners bucket" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins write banners bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update banners bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete banners bucket" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read logo bucket" ON storage.objects FOR SELECT USING (bucket_id = 'logo');
CREATE POLICY "Admins write logo bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update logo bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete logo bucket" ON storage.objects FOR DELETE USING (bucket_id = 'logo' AND public.has_role(auth.uid(), 'admin'));

-- Initial store settings row
INSERT INTO public.store_settings (name, whatsapp) VALUES ('Minha Loja', '5511999999999');
