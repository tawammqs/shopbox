-- Update plans with stripe price IDs (lookup keys)
UPDATE public.plans SET stripe_price_id = 'shopbox_inicial_monthly', price_cents = 4700, max_products = 50,
  features = '["Até 50 produtos","Categorias e subcategorias ilimitadas","Variações de cor e tamanho","Carrinho com botão WhatsApp","1 banner (desktop + mobile)","Gestão de estoque básica","1 administrador","Logo e redes sociais","Subdomínio gratuito","Suporte via Central de Ajuda"]'::jsonb,
  display_order = 1
WHERE slug = 'inicial';

UPDATE public.plans SET stripe_price_id = 'shopbox_profissional_monthly', price_cents = 9700, max_products = 99999,
  features = '["Tudo do Inicial","Produtos ilimitados","Banners ilimitados","Cupons de desconto (fixo ou %)","Promoções por categoria","Combos (Leve 2 Pague 1)","Pop-up de boas-vindas","Bulk actions","Wishlist para clientes","Vídeos de depoimentos","Avaliações de clientes","Notificação de volta ao estoque","Comprar agora pelo WhatsApp","Suporte via WhatsApp"]'::jsonb,
  display_order = 2
WHERE slug = 'profissional';

UPDATE public.plans SET stripe_price_id = 'shopbox_premium_monthly', price_cents = 19700, max_products = 99999,
  features = '["Tudo do Profissional","Domínio personalizado","Cor de destaque personalizável","Analytics no admin","Páginas estáticas editáveis","Estimativa de frete por CEP","Compartilhamento via WhatsApp","Wishlist compartilhável","Badge Loja Verificada","SEO avançado por produto","Selo de confiança personalizável","Suporte prioritário"]'::jsonb,
  display_order = 3
WHERE slug = 'premium';

-- Insert plans if they don't exist yet
INSERT INTO public.plans (slug, name, price_cents, stripe_price_id, max_products, features, display_order)
SELECT 'inicial', 'Inicial', 4700, 'shopbox_inicial_monthly', 50,
  '["Até 50 produtos","Categorias e subcategorias ilimitadas","Variações de cor e tamanho","Carrinho com botão WhatsApp","1 banner (desktop + mobile)","Gestão de estoque básica","1 administrador","Logo e redes sociais","Subdomínio gratuito","Suporte via Central de Ajuda"]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'inicial');

INSERT INTO public.plans (slug, name, price_cents, stripe_price_id, max_products, features, display_order)
SELECT 'profissional', 'Profissional', 9700, 'shopbox_profissional_monthly', 99999,
  '["Tudo do Inicial","Produtos ilimitados","Banners ilimitados","Cupons de desconto (fixo ou %)","Promoções por categoria","Combos (Leve 2 Pague 1)","Pop-up de boas-vindas","Bulk actions","Wishlist para clientes","Vídeos de depoimentos","Avaliações de clientes","Notificação de volta ao estoque","Comprar agora pelo WhatsApp","Suporte via WhatsApp"]'::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'profissional');

INSERT INTO public.plans (slug, name, price_cents, stripe_price_id, max_products, features, display_order)
SELECT 'premium', 'Premium', 19700, 'shopbox_premium_monthly', 99999,
  '["Tudo do Profissional","Domínio personalizado","Cor de destaque personalizável","Analytics no admin","Páginas estáticas editáveis","Estimativa de frete por CEP","Compartilhamento via WhatsApp","Wishlist compartilhável","Badge Loja Verificada","SEO avançado por produto","Selo de confiança personalizável","Suporte prioritário"]'::jsonb, 3
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'premium');

-- Create subscriptions table for Stripe
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function for active subscription check
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'sandbox')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;