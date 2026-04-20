

## Diagnóstico: erro ao acessar /superadmin

### Estado atual confirmado
- Você (`tawam.mqs@outlook.com`) está marcado como `platform_admin` no banco ✅
- As rotas `/superadmin`, `/superadmin/lojas`, `/superadmin/clientes` existem e estão no route tree ✅
- Função RPC `admin_list_users` existe ✅
- Servidor está respondendo (307 = redirect, normal pra usuário não logado) ✅
- Os erros do dev-server log são de 15 minutos atrás (cache durante a deleção das rotas de tema), já resolvidos ✅

### Causas mais prováveis do erro que você está vendo

**1. Sessão antiga / cache do navegador (mais provável)**
Você fez login antes de ser promovido a `platform_admin`. O JWT em cache não contém a info atualizada e o `beforeLoad` em `superadmin.tsx` faz redirect pra `/`.

**2. Bundle desatualizado no preview/publicado**
Mesmo problema do `loja-de-teste` que tivemos antes — os assets JS antigos não têm a rota `/superadmin`.

**3. Erro de runtime na página (ex: edge function `admin-create-portal-session` falhando)**
A query carrega mas algo dispara o `errorComponent`.

### O que preciso de você
Me responde uma dessas pra eu agir certo:

**Opção A — Tentar primeiro o mais simples (recomendado)**
1. Fazer **logout** em `/admin/dashboard` (botão Sair)
2. Login de novo em `/login` com `tawam.mqs@outlook.com`
3. Acessar `/superadmin/lojas`
4. Se ainda der erro, me manda **screenshot da tela** + **mensagem exata do erro** (ou abrir DevTools → Console → tirar print)

**Opção B — Quero que você investigue mais antes**
Eu adiciono logs temporários no `beforeLoad` e nas queries pra cuspir no console o que está acontecendo, e te passo o passo-a-passo pra você reportar o output.

**Opção C — É no domínio publicado (shopbox.lovable.app/superadmin)**
Aí é só clicar em **Publish → Update** no canto superior direito, igual fizemos antes com `/loja/loja-de-teste`. Não preciso mexer em código.

### O que NÃO vou fazer agora
- Não vou alterar código sem saber qual o erro real (pode piorar)
- Não vou refazer auth/role check (já está correto e funcionando no banco)

Me confirma qual opção (A, B ou C) ou manda direto o screenshot do erro pra eu identificar.

