

## Diagnóstico final: o redirect está correto, falta sessão no domínio publicado

### O que está acontecendo
O código de `src/routes/superadmin.tsx` já está com o gate client-side correto: ele espera `useAuth()` carregar, e só redireciona pra `/login` se `user` vier `null`.

A causa do redirect que você está vendo é simples: **a sessão do Supabase é guardada por origem (origin) no `localStorage` do navegador**.

- Quando você faz login no **preview** (`id-preview--6d9db69c-….lovable.app`) → a sessão fica salva só lá.
- Quando você abre `https://shopbox.lovable.app/superadmin/lojas` → é outro origin, sem sessão → `useAuth()` retorna `user = null` → o gate manda pra `/login`.

Isso é comportamento esperado (e desejável — senão qualquer um conseguiria entrar como você num domínio diferente). Não é bug.

### Como confirmar
Teste isso no `shopbox.lovable.app`:
- Abra DevTools → Application → Local Storage → `https://shopbox.lovable.app`
- Procure por chave começando com `sb-` (token do Supabase)
- Se não existir → você nunca logou nesse domínio. É exatamente esse o problema.

### Solução (sem mexer em código)
1. Acesse `https://shopbox.lovable.app/login`
2. Faça login com `tawam.mqs@outlook.com`
3. Após o login você cai em `/admin/dashboard`
4. Agora acesse `https://shopbox.lovable.app/superadmin/lojas` → vai entrar normal

Alternativa: acessar direto `https://shopbox.lovable.app/superadmin/lojas` deslogado → o gate envia pra `/login?redirect=/superadmin/lojas` → após login, o `login.tsx` te devolve pra `/superadmin/lojas` automaticamente (essa parte já está implementada).

### Por que você achou que era bug
Você provavelmente vinha logado no preview (`id-preview--…`) e abriu o link publicado direto, esperando estar logado lá também. Cada subdomínio mantém storage separado.

### O que vou implementar (melhoria opcional, se aprovar)

Para deixar a experiência mais clara em vez de só "jogar" no login:

1. **Toast informativo no login quando vier de redirect protegido**
   - Em `src/routes/login.tsx`, se `search.redirect` começar com `/superadmin` ou `/admin`, mostrar uma mensagem amigável: "Faça login para acessar o painel".

2. **Atalho visual no header da home pra superadmins**
   - Sem mudança grande: nada extra agora. Quem é admin já sabe a URL.

### Detalhes técnicos
- Arquivos tocados: `src/routes/login.tsx` (somente um `useEffect` com `toast.info` condicional ao montar, se houver `redirect`).
- Nada no `superadmin.tsx`. Ele já está correto.
- Nada no banco. Seu role `platform_admin` está OK.

### Se você confirmar que logou em `shopbox.lovable.app` e mesmo assim cai no `/login`
Aí sim é bug e eu investigo a fundo:
- Adicionar logs temporários no `useAuth` pra cuspir o que `getSession()` retorna no domínio publicado
- Verificar se o `persistSession: true` do client está funcionando corretamente em produção
- Conferir se há algum interceptor / middleware no edge que está limpando cookies

Mas primeiro precisamos descartar a causa óbvia (sessão por origin).

