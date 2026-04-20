

## Diagnóstico: deploy publicado está quebrado

### O que descobri
1. **A loja existe e está OK no banco**: `loja-de-teste` (status `trialing`, `active=true`, plano Profissional vinculado).
2. **A assinatura funcionou perfeitamente**: webhook ativou a loja, RLS está correto, dados estão íntegros.
3. **O erro é no deploy publicado**, não no código:
   - URL publicada (`https://shopbox.lovable.app/loja/loja-de-teste`) retorna SSR vazio: `<main></main>` sem header, sem nav, sem footer, **sem nenhuma tag `<script>`**.
   - Logs do worker mostram 404 para os bundles JS:
     ```
     GET /assets/index-CXJO8uzO.js → 404
     GET /assets/index-BLYZfPCT.js → 404
     GET /assets/loja._slug.categoria.REDACTED.js → 404
     ```
   - O HTML servido está apontando para arquivos JS que não existem mais — provavelmente uma publicação anterior cuja CDN/cache ficou inconsistente após uma alteração em código.

### Por que aparece "Algo deu errado"
Sem o bundle JS, o React não consegue hidratar. O `defaultErrorComponent` em `src/router.tsx` captura a falha e mostra "Algo deu errado / Tentar novamente / Ir para a loja" — exatamente o screenshot enviado.

### Plano de correção

**1. Republicar o app** (ação principal)
- Disparar uma nova publicação para regenerar os bundles JS e o HTML estático em sincronia.
- Isso resolve o 404 dos `/assets/*.js` automaticamente.

**2. Validar o código antes da republicação** (defensivo)
- Conferir rapidamente que `src/routes/loja.$slug.tsx` e os componentes de storefront não têm imports quebrados ou dependências faltando — se tudo já roda na preview (que está OK), só republicar resolve.

**3. Testar pós-publicação**
- Abrir `https://shopbox.lovable.app/loja/loja-de-teste` em aba anônima.
- Verificar no devtools (Network) que os `/assets/*.js` retornam 200.
- Confirmar que header, banners (vazios) e footer aparecem.
- Hard refresh (Ctrl+Shift+R) para garantir que não é cache do browser.

### Arquivos
- Nenhuma alteração de código necessária — é problema de deploy.
- Após aprovar, eu disparo a republicação.

### Nota sobre a preview
Na preview (`/cadastro` que você está vendo agora) o app funciona porque o Vite serve os bundles do dev server em runtime. O erro só aparece para o público no domínio publicado.

