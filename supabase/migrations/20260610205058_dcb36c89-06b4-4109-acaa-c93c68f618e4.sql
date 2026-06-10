-- Seed marketplace themes (idempotent). Reuses existing themes / theme_purchases infra.
INSERT INTO public.themes (slug, name, tagline, description, price_cents, is_free, status, features, display_order)
VALUES
  (
    'default',
    'Tema Padrão',
    'O tema original da ShopBox',
    'Limpo, rápido e funcional. Layout responsivo, banner, carrosséis de produtos, carrinho via WhatsApp e página de produto completa.',
    0,
    true,
    'approved'::theme_status,
    '["Layout responsivo","Carrossel de banners","Grid de produtos","Carrinho WhatsApp","Página de produto completa"]'::jsonb,
    0
  ),
  (
    'mio-style',
    'Tema Premium — Estilo Mio',
    'Inspirado nas maiores lojas de moda do Brasil',
    'Tema premium com layout sofisticado, animações, carrossel avançado, depoimentos em pills, FAQ estilizado, Ofertas Secretas e muito mais.',
    39900,
    false,
    'approved'::theme_status,
    '["Barra de anúncios configurável","Banner com indicadores numerados","2 carrosséis de produtos","Marquee personalizável","Banner promocional clicável","Barra de ícones/benefícios","Seção Ofertas Secretas","Depoimentos em pills","FAQ estilizado","Feed do Instagram","Footer com marquee","Botão WhatsApp pulsante","Carrinho com Compre Junto","Barra de progresso de frete","Cupom de boas-vindas flutuante","Menu mobile estilizado","Parcelas automáticas","Painel admin de personalização"]'::jsonb,
    1
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  is_free = EXCLUDED.is_free,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  updated_at = now();
