CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Time ShopBox',
  author_avatar_url TEXT,
  category TEXT NOT NULL DEFAULT 'Vendas pelo WhatsApp',
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  reading_time INTEGER NOT NULL DEFAULT 5 CHECK (reading_time > 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blog posts are public"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (is_published = TRUE AND published_at IS NOT NULL AND published_at <= NOW());

CREATE POLICY "Platform admins can read all blog posts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can create blog posts"
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can update blog posts"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can delete blog posts"
ON public.blog_posts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE INDEX blog_posts_published_at_idx
ON public.blog_posts (published_at DESC)
WHERE is_published = TRUE;

CREATE INDEX blog_posts_category_idx
ON public.blog_posts (category);

CREATE TRIGGER set_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();