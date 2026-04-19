

## Resposta direta
**Não, o fluxo não está 100% funcional ainda.** O cadastro até o checkout funciona, mas existem 3 problemas críticos que impedem a liberação automática do acesso após o pagamento.

## Como o fluxo está hoje

```text
/precos → /cadastro → 3 etapas:
  1. Conta + dados da loja
  2. Escolher plano
  3. signUp + signIn + INSERT store(trialing) + Stripe Checkout embedded
       ↓ pagamento confirmado
       /admin/dashboard?checkout=success
       ↓ webhook Stripe (payments-webhook)
       atualiza stores.subscription_status para "active"
```

## Problemas encontrados

### 1. Período de teste de 7 dias não está sendo enviado ao Stripe (CRÍTICO)
A landing e o cadastro prometem **"7 dias grátis sem cartão"**, mas:
- `create-checkout/index.ts` cria a sessão **sem `trial_period_days`** nem `subscription_data.trial_period_days`
- O Stripe vai cobrar imediatamente, quebrando a promessa
- A loja é criada com `subscription_status: "trialing"` antes do pagamento, o que também está incoerente

### 2. Webhook usa campos que o Stripe não retorna mais no payload raiz
Em `payments-webhook/index.ts`, `handleSubscriptionUpsert` lê:
```ts
subscription.current_period_start
subscription.current_period_end
```
Esses campos foram movidos para `subscription.items.data[0].current_period_*` em versões recentes da API Stripe. Resultado: `current_period_end` salvo como `null` → `has_active_subscription` pode falhar dependendo do status.

### 3. Falha silenciosa cria loja órfã (já aconteceu no banco)
Existe a loja `minha-loja-d53c88` com `subscription_status: "trialing"`, sem `stripe_subscription_id`, sem `trial_ends_at`. Isso indica que algum usuário concluiu o passo 3 mas não finalizou o pagamento — e a loja ficou ativa mesmo assim.

A função `handleCreateStore`:
- cria a loja **antes** de criar a sessão Stripe
- se o checkout falhar ou o usuário fechar a aba, a loja fica órfã com acesso liberado

### 4. Detalhes menores
- Não há listener pós-checkout para invalidar o cache do `useMyStore` quando o webhook atualiza
- `/checkout/return` envia para `/painel`, mas o redirect do Stripe vai para `/admin/dashboard?checkout=success` (o `return_url` é sobrescrito no cadastro) — ok, mas a página `/checkout/return` está órfã
- Plano `basico` no banco está ativo mas não aparece na UI (poluição)

## Plano de correção

### A. Adicionar trial de 7 dias no checkout
- `create-checkout/index.ts`: aceitar `trialPeriodDays` no body e passar `subscription_data.trial_period_days` quando for assinatura
- `cadastro.tsx`: enviar `trialPeriodDays: 7`
- ajustar copy do checkout para deixar claro "cartão necessário, primeiro débito em 7 dias"

### B. Corrigir webhook para nova estrutura da Stripe API
- ler `current_period_*` do `item` (com fallback ao subscription root para compatibilidade)
- gravar também `trial_ends_at` da loja a partir de `subscription.trial_end`
- mapear status `trialing` corretamente para o enum

### C. Adiar criação da loja para depois do pagamento confirmado
Duas abordagens — recomendo a 2:
1. Criar loja só no webhook `checkout.session.completed` (mas precisa carregar dados da loja na metadata)
2. **(recomendada)** Manter criação no cadastro, mas marcar `active=false` e `subscription_status='incomplete'` até o webhook confirmar; bloquear acesso ao `/admin` quando `subscription_status` ∈ {incomplete, canceled, unpaid}

### D. Polir experiência pós-pagamento
- adicionar polling/realtime em `/admin/dashboard?checkout=success` para invalidar `useMyStore` assim que o webhook atualizar
- mostrar "Ativando sua loja…" enquanto status estiver `incomplete`
- limpar a loja órfã `minha-loja-d53c88` do banco
- desativar o plano `basico` duplicado

### E. Adicionar gate de assinatura no admin
- criar helper `hasStoreAccess(store)` que retorna true se status ∈ {trialing, active, past_due (grace)}
- bloquear `/admin/*` com tela "Reative seu plano" quando não tiver acesso, com botão para portal Stripe

## Arquivos a editar
- `supabase/functions/create-checkout/index.ts` (trial)
- `supabase/functions/payments-webhook/index.ts` (period fields + trial_end)
- `src/lib/stripe.ts` (passar trialPeriodDays)
- `src/routes/cadastro.tsx` (status incomplete + trial)
- `src/routes/admin.tsx` (gate de acesso + polling pós-checkout)
- `src/lib/plans.ts` (helper hasStoreAccess)
- migration: limpar loja órfã + desativar plano `basico`

## O que farei quando aprovar
1. Aplicar A → E na ordem
2. Criar a migration de limpeza
3. Republicar e testar o fluxo completo: cadastro → pagamento (cartão de teste 4242) → liberação automática do `/admin/dashboard`

