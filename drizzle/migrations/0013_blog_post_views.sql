CREATE TABLE public.blog_post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_post_views_created_at_idx ON public.blog_post_views (created_at DESC);
CREATE INDEX blog_post_views_post_id_idx ON public.blog_post_views (post_id);

GRANT SELECT ON public.blog_post_views TO authenticated;
GRANT ALL ON public.blog_post_views TO service_role;

ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin le views do blog"
ON public.blog_post_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE OR REPLACE FUNCTION public.increment_blog_view(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE id = _post_id AND is_published = true;
  IF FOUND THEN
    INSERT INTO public.blog_post_views (post_id) VALUES (_post_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_view(uuid) TO anon, authenticated;