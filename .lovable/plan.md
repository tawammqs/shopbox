

## Por que ainda dá erro e como vou resolver

### O que está realmente acontecendo
A imagem que você mandou é a tela `defaultErrorComponent` do router (em `src/router.tsx`). Não é o redirect pra login mais — é **um erro JavaScript real** dentro de alguma rota, que está sendo capturado pelo error boundary global.

O problema: em produção, `import.meta.env.DEV` é `false`, então o componente esconde a mensagem do erro. Por isso só aparece "Algo deu errado" sem detalhes — eu literalmente não consigo saber o que está estourando sem ver a mensagem.

Os logs do servidor confirmam: `/superadmin/lojas` retorna **HTTP 200**, ou seja, o SSR funciona. O crash é no **client**, depois da hidratação.

### O que vou fazer (em uma mensagem só)

**1. Mostrar a mensagem de erro em produção também**
- `src/router.tsx`: remover o gate `import.meta.env.DEV` para que `error.message` apareça sempre. Isso é seguro pra um app com auth — e essencial pra você (e eu) saber o que falha.
- Adicionar também um botão "Recarregar página" e mostrar o stack trace recolhível.

**2. Tornar o gate do superadmin defensivo contra erros**
- `src/routes/superadmin.tsx`: envolver a query `user_roles` em try/catch que **não relance**. Se a checagem de role falhar por qualquer motivo (RLS, rede, sessão expirada), em vez de deixar o React Query lançar e cair no errorComponent, vou setar `state="error"` e mostrar a tela de retry amigável que já existe.
- Trocar o `as never` por tipagem correta no `navigate({ to: "/login", search: { redirect } })`.

**3. Tornar o gate do admin defensivo igual**
- `src/routes/admin.tsx`: o `useMyStore` lança erro (`if (error) throw error`) e isso vira um Promise rejeitado dentro do `useQuery`. O React Query default não relança no render, mas se houver um throwOnError em algum lugar, vira a tela genérica. Vou:
  - Verificar a config do QueryClient em `router.tsx` e adicionar `throwOnError: false` explícito como default, pra garantir que erros de query nunca cheguem ao errorComponent do router.
  - Em `admin.tsx`, ler `error` do `useMyStore` e mostrar uma tela amigável com botão de retry e "Sair" se vier erro.

**4. Limpar logs de diagnóstico antigos**
- Remover qualquer `console.log("[SUPERADMIN] …")` que sobrou de tentativas anteriores.

### O que isso vai resolver
- Se ainda houver erro, **a próxima tela vai mostrar a mensagem real** e em 1 mensagem eu corrijo o problema raiz.
- Os gates de admin e superadmin ficam tolerantes a falhas de rede/RLS/sessão e te dão um botão de retry em vez de uma tela genérica.
- Erros transitórios de Supabase (timeout, RLS recursiva, etc.) param de derrubar o app inteiro.

### O que NÃO vou fazer
- Não vou mudar o modelo de auth nem RLS — está correto no banco (você é `platform_admin`, login funcionou às 14:14 nos logs).
- Não vou re-arquitetar a estratégia SSR/CSR — o gate client-side é o padrão correto para auth com sessão em localStorage.
- Não vou tocar em `src/integrations/supabase/client.ts`, `types.ts` ou `routeTree.gen.ts`.

### Detalhes técnicos
- Arquivos: `src/router.tsx`, `src/routes/superadmin.tsx`, `src/routes/admin.tsx`.
- Adicionar `defaultOptions.queries.throwOnError = false` no `QueryClient` (já é o default, mas explícito para garantia).
- Mostrar `error.message` + `error.stack` (recolhido por padrão) sempre, não só em DEV.
- Após o deploy, **acesse `/superadmin/lojas` em `shopbox.lovable.app` e me mande a mensagem de erro que aparecer** — aí eu corrijo a causa raiz em 1 mensagem.

