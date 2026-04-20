
Objetivo: corrigir o redirecionamento indevido de `/superadmin/lojas` para `/login` no domínio publicado.

1. Remover a checagem de acesso do `beforeLoad` de `src/routes/superadmin.tsx`
- O problema atual é que essa checagem usa o client de autenticação no momento de SSR.
- Em acesso direto pelo domínio publicado, a sessão do navegador ainda não está disponível no servidor, então `getUser()` volta vazio e a rota redireciona para `/login`.
- Vou transformar `superadmin.tsx` em um layout que não decide acesso no `beforeLoad`.

2. Criar uma guarda de acesso no próprio layout do superadmin
- Dentro de `SuperadminLayout`, usar `useAuth()` para esperar a sessão ser restaurada no navegador.
- Enquanto estiver carregando, mostrar estado de “Carregando acesso…”.
- Depois da sessão pronta:
  - sem usuário: redirecionar para `/login`
  - com usuário: consultar `user_roles`
  - sem `platform_admin`: redirecionar para `/`
  - com `platform_admin`: renderizar o painel normalmente
- Isso evita o falso negativo no published site sem expor conteúdo protegido durante o carregamento.

3. Preservar o destino ao mandar para login
- Ajustar o fluxo para enviar `redirect=/superadmin/lojas` ao navegar para `/login`.
- Atualizar `src/routes/login.tsx` para ler esse destino e, após login bem-sucedido, voltar para a rota pedida em vez de sempre mandar para `/admin/dashboard`.
- Se não houver redirect, o comportamento atual continua.

4. Tratar estados de erro de forma clara
- Se a leitura de `user_roles` falhar, mostrar mensagem amigável no layout em vez de parecer “logout”.
- Remover logs temporários de diagnóstico se ainda estiverem no arquivo, deixando apenas o tratamento final.

5. Validar as rotas do superadmin após a correção
- Confirmar que o fluxo esperado fica assim:
  - usuário deslogado acessa `/superadmin/lojas` -> vai para `/login`
  - usuário logado sem permissão -> vai para `/`
  - usuário logado com `platform_admin` -> entra em `/superadmin/lojas`
- Garantir que `/superadmin` continue redirecionando para `/superadmin/lojas` e que `/superadmin/clientes` herde a mesma proteção.

Detalhes técnicos
- Arquivo principal a ajustar: `src/routes/superadmin.tsx`
- Arquivo complementar: `src/routes/login.tsx`
- Estratégia: mover a autorização do SSR para um gate client-side baseado em `useAuth()` + consulta a `user_roles`
- Motivo: a sessão atual está persistida no navegador, não em um mecanismo legível pelo servidor durante o render inicial
- Benefício: corrige o published deep link sem exigir mudanças no backend nem no modelo de permissões
