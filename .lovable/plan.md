
# Plano de implementação

São 3 frentes independentes. Posso fazer todas, mas recomendo aprovar/ajustar cada bloco antes — principalmente o **Impersonate**, que é sensível.

---

## Bloco 1 — Superadmin: busca + acesso à conta do lojista

### 1.1 Busca aprimorada em `/superadmin/clientes`
A página já tem busca por e-mail/nome/slug. Vou adicionar:
- Busca também por **WhatsApp** (normalizando dígitos) e por **ID da loja/usuário**.
- Cada linha passa a mostrar de forma copiável: **e-mail de login**, **WhatsApp** e **ID**.
- Botão "Copiar e-mail" e "Copiar WhatsApp" em cada cliente.

Isso já resolve "achar o login da LZ Multimarcas" sem depender de impersonate.

### 1.2 Enviar link de redefinição de senha (a partir do superadmin)
Botão **"Enviar link de redefinição"** em cada cliente. Internamente chama uma server function protegida (só para `platform_admin`) que usa o admin client para gerar um link de recovery (`supabase.auth.admin.generateLink({ type: 'recovery' })`) e:
- Opção A (padrão): dispara o e-mail de recovery do Supabase para o lojista.
- Opção B: retorna o link e copia para a área de transferência (caso o e-mail dela esteja errado).

### 1.3 Impersonate (entrar como lojista) — **precisa decidir o modelo**

Existem 2 caminhos viáveis. **Eu recomendo o A.** Me diz qual prefere:

**Opção A — Magic link de admin (mais simples e seguro)**
- Server function `superadmin_impersonate(store_id)` protegida por `has_role('platform_admin')`.
- Gera um magic link com `supabase.auth.admin.generateLink({ type: 'magiclink', email: <email_do_lojista> })`.
- Abre em **aba anônima** (instrução para o admin) para não desconectar sua sessão de superadmin.
- Registra em uma tabela nova `impersonation_log` (admin_user_id, target_user_id, store_id, reason, created_at).
- Vantagem: zero gambiarra com tokens; o Supabase emite uma sessão real e expira normalmente.
- Desvantagem: você fica logado *como* o lojista naquela aba até deslogar.

**Opção B — Banner "Você está visualizando como X" sem trocar de sessão**
- Mantém você logado como superadmin, mas adiciona um parâmetro `?impersonate=<store_id>` que, junto com `has_role('platform_admin')`, faz as queries do `/admin/*` agirem sobre aquela loja (RLS já libera para platform_admin).
- Vantagem: não desloga você, banner sempre visível, fácil de sair.
- Desvantagem: precisa adaptar os hooks `useMyStore` e várias queries do painel admin para aceitar o store_id "fingido". Mais trabalho, mais chance de bug.

**Permissões em ambos os casos:** apenas `user_roles.role = 'platform_admin'`. Toda ação fica em `impersonation_log`.

---

## Bloco 2 — Recuperação de senha completa (lojistas)

Hoje existe `/recuperar-senha` e `/reset-password`. Vou:

1. **Permitir recuperação por e-mail OU WhatsApp** em `/recuperar-senha`:
   - Mesmo padrão do login: se for WhatsApp, usa `email_for_whatsapp(_whatsapp)` para resolver o e-mail e dispara `resetPasswordForEmail`.
   - Mensagem genérica de sucesso (não revela se o cadastro existe — boa prática anti-enumeração).

2. **Validar o formulário de nova senha em `/reset-password`**:
   - Mínimo 8 caracteres, com letra e número.
   - Confirmar senha.
   - Mensagens de erro claras em PT-BR.

3. **Personalizar o template de e-mail de recovery** com a marca ShopBox (logo, cores, copy em português, CTA "Redefinir senha"). Para isso vou configurar os templates de auth do Lovable Cloud — emails saem do seu domínio em vez do remetente padrão.
   - **Pré-requisito:** ter um domínio de e-mail configurado. Se ainda não tiver, eu te mostro o diálogo de setup antes.

4. **WhatsApp como canal de reset (opcional, me confirma)**: enviar o link de redefinição via WhatsApp também exige um provedor (uazapi, Z-API, etc.). Hoje o projeto não tem isso integrado. Posso:
   - (a) Deixar só por e-mail por enquanto, OU
   - (b) Adicionar um campo de "WhatsApp API token" e implementar o envio. Me diz qual.

---

## Bloco 3 — Ajustes finais mobile no formulário de produto

Tudo isso é só CSS/UX, sem mexer em lógica de dados:

1. **Teste real iPhone Safari**: vou usar o browser tool em viewport 390×844 para abrir `/admin/produtos/<id>`, focar cada input e confirmar:
   - Nenhum corte horizontal (sem scroll lateral).
   - `font-size: 16px` em todos os inputs (já está, vou validar) → sem zoom no focus.
   - Botões com `touch-action: manipulation` para evitar delay/zoom de duplo-toque.

2. **CategoryTreePicker — ações sempre visíveis no touch**:
   - Já adicionei `@media (hover: none)` na última iteração; vou auditar e garantir que **editar / excluir / reordenar** apareçam sempre, com alvos de 36px+.
   - Adicionar feedback de "pressionado" (`:active`) já que não há `:hover`.

3. **Estado vazio de categorias**:
   - Quando `categories.length === 0`, mostrar card com texto "Nenhuma categoria criada ainda" e botão "+ Criar primeira categoria" (já existe a função, só falta o empty state).

4. **Seletor múltiplo de categorias em mobile**:
   - Hoje o `CategoryTreePicker` mostra a árvore inline.
   - No mobile (`max-width: 767px`) vou trocar por:
     - Um campo "trigger" com chips das categorias selecionadas + "+ Adicionar categoria".
     - Ao tocar, abre um **Sheet** (drawer de baixo) com a árvore rolável, busca no topo, e botão "Concluir" fixo embaixo.
     - Desktop continua com a árvore inline (sem regressão).

---

## Arquitetura técnica resumida

- **Server functions novas** em `src/lib/superadmin.functions.ts`:
  - `searchClients(query)` — busca unificada (email, whatsapp, store name/slug, ids).
  - `sendPasswordResetForUser(user_id)` — admin-only, dispara recovery.
  - `impersonateStore(store_id, reason)` — admin-only, gera magic link (se Opção A).
- **Tabela nova** `impersonation_log` (RLS: só `platform_admin` lê).
- **Migrações**: criar tabela + ampliar `email_for_whatsapp` se necessário.
- **Componentes novos**:
  - `src/components/admin/MobileCategoryPicker.tsx` (Sheet com árvore).
  - Botões de copiar em `/superadmin/clientes`.

## O que eu **preciso** de você antes de começar

1. **Impersonate: Opção A (magic link, abre em anônima) ou Opção B (banner + RLS)?**
2. **Reset por WhatsApp: por e-mail apenas, ou integrar um provedor agora?**
3. **Templates de e-mail brandados:** posso configurar agora (vai precisar de um domínio próprio)?
4. **Posso fazer os 3 blocos no mesmo turno**, ou prefere começar só pelo Bloco 1?

