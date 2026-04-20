

# Plano: teste end-to-end do fluxo de cadastro + checkout + e-mail

## ⚠️ Bloqueio importante antes de começar

O domínio de envio de e-mail **`notify.shopboxapp.com.br` ainda está com status "Pending" (DNS não verificado)**.

Isso significa que **o e-mail de boas-vindas NÃO vai chegar na caixa de entrada** mesmo que todo o restante do fluxo funcione. O que vai acontecer com o DNS pendente:

- O webhook do Stripe vai disparar normalmente
- O e-mail vai ser **enfileirado** na fila `transactional_emails`
- O processador vai tentar enviar, mas o provedor vai rejeitar (domínio não verificado)
- O e-mail vai parar no log com status `pending` ou `dlq`

**Você precisa primeiro completar a configuração DNS** em **Cloud → Emails** (adicionar os registros NS no seu provedor de domínio e aguardar propagação, até 72h).

Posso fazer o teste mesmo assim para validar tudo até o ponto do envio, e te mostrar o estado do log de e-mails — o envio real só vai funcionar depois que o DNS propagar.

---

## O que eu posso testar de fato (sem precisar do DNS)

Como sou um agente de código, **não consigo realmente preencher um formulário de cadastro com cartão de crédito de teste do Stripe e clicar em botões na sua tela**. O que posso fazer é validar o fluxo via código + queries de banco:

### Etapa 1 — Validar o código do fluxo
- Reler `src/routes/cadastro.tsx` para confirmar que: validação Zod com `acceptTerms`, criação de usuário via `supabase.auth.signUp`, criação da loja, e abertura do `EmbeddedCheckout` estão corretos
- Reler `supabase/functions/payments-webhook/index.ts` para confirmar que `sendWelcomeEmail` é chamado quando o status muda para `trialing`/`active`
- Reler `src/routes/lovable/email/transactional/send-internal.ts` para confirmar que aceita auth via service role e enfileira no template `welcome`
- Confirmar que `welcome` está registrado em `src/lib/email-templates/registry.ts`

### Etapa 2 — Validar o estado atual do banco
- Verificar que existem 3 planos ativos (`inicial`, `profissional`, `premium`) e que o `basico` foi removido
- Verificar que a tabela `email_send_log` existe e está vazia (ou listar últimos envios)
- Verificar que o cron `process-email-queue` está agendado em `cron.job`

### Etapa 3 — Simular o disparo do e-mail diretamente
Como o webhook do Stripe só dispara com pagamento real, vou **chamar o endpoint interno `/lovable/email/transactional/send-internal` diretamente** com dados de teste (usando service role key e um e-mail seu real), para validar:
- O endpoint aceita a autenticação interna
- O template `welcome` renderiza sem erro
- O e-mail é enfileirado na fila pgmq
- Aparece um registro novo em `email_send_log`

### Etapa 4 — Te entregar instruções para o teste manual real
Como não consigo digitar no Stripe Embedded Checkout, vou te dar um passo-a-passo claro para você executar manualmente em ~3 minutos:
1. Abrir `/cadastro` em janela anônima
2. Preencher Step 1 (incluindo o checkbox de termos)
3. Escolher um plano
4. No Stripe Checkout (sandbox), usar o cartão de teste `4242 4242 4242 4242`, validade futura, CVC qualquer
5. Aguardar o redirect para `/checkout/return`
6. Eu rodo as queries no banco logo depois para confirmar:
   - Linha em `subscriptions` com status `trialing`
   - `stores.subscription_status = 'trialing'`
   - Linha em `email_send_log` com `template_name = 'welcome'`

---

## Resumo do que vou entregar

1. ✅ Auditoria do código (4 arquivos críticos)
2. ✅ Estado do banco (planos, cron, email log)
3. ✅ Teste real do envio de e-mail enfileirado (via endpoint interno) — vou te pedir um e-mail seu real para usar como destinatário
4. ✅ Roteiro passo-a-passo para o teste manual no navegador
5. ⚠️ **Nota explícita** de que o e-mail só vai chegar de verdade depois que `notify.shopboxapp.com.br` ficar `active` — mesmo o teste via endpoint vai parar na fila até lá

---

## O que preciso de você antes de eu começar

**Uma decisão e um dado**:

1. **Quer que eu faça o teste mesmo com o DNS pendente?** (Vai validar tudo menos a entrega real na caixa de entrada)
2. **Qual e-mail você quer usar como destinatário do teste?** (Use um e-mail real seu para conseguir verificar quando o DNS subir)

Se preferir, posso primeiro te ajudar a verificar/diagnosticar o status do DNS antes de qualquer teste.

