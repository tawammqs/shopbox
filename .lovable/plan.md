# Domínio próprio sem redirecionar

Hoje, quem abre `www.theshoes.com.br` é redirecionado para `shopboxapp.com.br/loja/the-shoes` e vê esse endereço na barra. O objetivo é servir a loja no próprio domínio, mantendo `www.theshoes.com.br` (e `www.theshoes.com.br/produto/...`, `/rastreio`, etc.) na barra de endereço.

## Por que a sugestão do prompt não resolve sozinha

Renderizar a loja dentro da página inicial (`/`) só limpa a home. Assim que a pessoa clica em um produto, uma categoria ou o carrinho, os links internos continuam levando para `/loja/the-shoes/...` e o endereço "sujo" volta a aparecer. Também duplicaria o layout da loja (cabeçalho, carrinho, rodapé), que hoje vive numa estrutura de páginas aninhadas.

## Abordagem

Usar a reescrita de endereços do roteador: internamente tudo continua sendo `/loja/the-shoes/...` (nada muda nas páginas, no checkout, nos afiliados), mas na barra de endereço o trecho `/loja/the-shoes` é removido enquanto a pessoa estiver no domínio próprio.

1. **No servidor**: ao montar a aplicação para cada visita, ler o domínio da requisição e, se for um domínio próprio ativo, descobrir a loja correspondente.
2. **Reescrita de entrada**: `www.theshoes.com.br/produto/x` passa a ser interpretado como `/loja/the-shoes/produto/x`; a raiz vira a home da loja.
3. **Reescrita de saída**: todo link gerado (`/loja/the-shoes/...`) aparece e é gravado no histórico como `/...`.
4. **No navegador**: o mesmo par de regras precisa valer após o carregamento. O servidor grava um cookie leve com o identificador da loja do domínio, lido na inicialização, para que a navegação sem recarregar a página se comporte igual.
5. **Remover o redirecionamento** atual da página inicial; ela volta a ser só a landing da ShopBox nos domínios da ShopBox.
6. **Endereços da ShopBox seguem iguais**: `shopboxapp.com.br/loja/the-shoes` continua funcionando normalmente, sem reescrita.

## Detalhes técnicos

- `src/router.tsx`: `getRouter` passa a ser assíncrono; no servidor resolve o host via cabeçalho e consulta `store_domains`/`stores` (reaproveitando `resolveCurrentHostSlug`); no cliente lê o cookie. Com o slug em mãos, passa `rewrite: { input, output }` para `createRouter`, adicionando/removendo o prefixo `/loja/<slug>`.
- O cookie (`sb_store_host_slug`, não sensível, por domínio) é gravado na mesma resolução do servidor.
- `src/routes/index.tsx`: remove o `throw redirect(...)` do `beforeLoad`.
- Sem alterações em checkout WhatsApp, RLS, afiliados, feed XML e webhook do Stripe.
- Verificação: testes locais forçando o cabeçalho de host do domínio próprio, conferindo que a home e uma página de produto renderizam sem redirecionar, e que os endereços da ShopBox seguem intactos.

## Risco

A reescrita afeta todas as páginas. Se algo der errado no domínio próprio, o site publicado da ShopBox continua funcionando porque a reescrita só é ativada quando o domínio não é da ShopBox.
