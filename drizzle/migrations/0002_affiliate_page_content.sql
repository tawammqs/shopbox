ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS affiliate_page_content jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.stores SET affiliate_page_content = '{
  "title": "Programa de Afiliados The Shoes",
  "subtitle": "Transforme sua paixão por tênis em renda extra",
  "description": "Seja um Afiliado The Shoes e ganhe comissão por cada venda que você indicar. Ideal para quem ama tênis e quer transformar isso em renda extra divulgando produtos para amigos e seguidores.",
  "steps": [
    {"number": "1", "title": "Cadastre-se", "text": "Preencha o formulário com seus dados. O acesso é liberado na hora, sem aprovação."},
    {"number": "2", "title": "Faça login e compartilhe", "text": "Acesse sua conta, navegue pelos produtos e clique em Compartilhar para gerar seu link personalizado. Cada link é único e rastreia suas vendas automaticamente."},
    {"number": "3", "title": "Ganhe comissão", "text": "A cada venda realizada pelo seu link, você ganha comissão sobre o valor total. Se você indicar outros afiliados, ganha comissão sobre as vendas deles também."}
  ],
  "benefits": [
    "Link personalizado com seu nome",
    "Painel completo com suas vendas e comissões em tempo real",
    "Pagamento via PIX todo dia 20"
  ],
  "rules": [
    "É proibido divulgar seu link em comentários de publicações da The Shoes",
    "É proibido enviar seu link por mensagem privada para clientes da loja",
    "Comportamentos fraudulentos ou inadequados resultam no cancelamento imediato do cadastro"
  ],
  "payment_text": "As comissões são pagas via PIX todo dia 20 do mês. Certifique-se de cadastrar sua chave PIX corretamente.",
  "cta_button": "Quero ser afiliado"
}'::jsonb WHERE slug = 'the-shoes';