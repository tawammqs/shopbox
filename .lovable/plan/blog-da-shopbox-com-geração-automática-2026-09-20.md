# Blog da ShopBox com geração automática

## Objetivo
Criar o blog público da ShopBox e um painel exclusivo do superadmin para gerar, editar, publicar e excluir artigos, sem alterar lojas, checkout, feeds ou integrações existentes.

## Entregas
- Criar a estrutura segura de posts, com leitura pública apenas para conteúdos publicados e gestão restrita ao papel `platform_admin` já usado pelo superadmin.
- Adicionar `/superadmin/blog` com lista, filtros de status, ações, editor completo e modal “Gerar artigo com IA”.
- Gerar artigos pelo Claude com a chave Anthropic já configurada, mantendo a chamada somente no servidor e exibindo erros reais com segurança.
- Criar `/blog` com filtros por categoria, capas, autor, data e tempo de leitura.
- Criar `/blog/$slug` com breadcrumb, conteúdo formatado, tags, chamada para cadastro, relacionados e metadados próprios.
- Criar `/sitemap.xml` dinâmico com os artigos publicados.
- Adicionar Blog e seus atalhos à navegação do superadmin, preservando o link `/blog` já existente no rodapé.

## Validação
- Aplicar a alteração da base de dados com permissões e regras de acesso.
- Validar compilação e as páginas públicas em desktop e celular.
- Testar a geração com “Como vender tênis pelo WhatsApp”, salvar como rascunho, editar, publicar e conferir listagem, página, CTA, breadcrumb e SEO.

## Detalhes técnicos
- O papel administrativo seguirá o padrão seguro existente (`platform_admin`/`has_role`), sem confiar em metadados editáveis pelo cliente.
- A integração usará `claude-sonnet-4-6`, `max_tokens: 4000` e validação rigorosa do JSON retornado.
- O HTML gerado será higienizado antes da exibição pública.
