

# Auditoria de prontidão comercial — ShopBox

## Resposta direta
**Sim — o sistema está tecnicamente pronto** para o cliente entrar, escolher um plano (mensal ou anual) e receber acesso. Mas existem **3 ajustes recomendados antes de divulgar publicamente** para evitar problemas com os primeiros clientes pagantes.

---

## ✅ O que está funcionando ponta-a-ponta

| Etapa | Status | Detalhes |
|---|---|---|
| Cadastro em 3 passos | ✅ | `/cadastro` — Conta → Plano → Pagamento |
| Toggle Mensal/Anual | ✅ | Funciona em `/`, `/precos` e `/cadastro` |
| Planos no banco | ✅ | Inicial, Profissional e Premium ativos com `stripe_price_id` mensal e anual |
| Stripe Checkout embedded | ✅ | Trial de 7 dias automático |
| Stripe LIVE | ✅ | Conta verificada, app instalado, readiness check OK — pronto para receber dinheiro real |
| Webhook | ✅ | `payments-webhook` ativa a loja (`active=true`, `subscription_status=trialing/active`) ao confirmar pagamento |
| Realtime | ✅ | Painel detecta ativação automaticamente sem reload |
| Bloqueio de acesso | ✅ | `SubscriptionGate` bloqueia painel se status for `incomplete/canceled/unpaid` |
| Portal de cobrança | ✅ | Cliente troca cartão / cancela via Stripe Billing Portal |

---

## ⚠️ Ajustes recomendados antes de comercializar

### 1. URL de retorno aponta para query inexistente após publish
No `cadastro.tsx` (linha 222), o `returnUrl` vai para `/admin/dashboard?checkout=success`. Isso funciona, mas a **página `/checkout/return`** existe e está mais polida (com confirmação visual). Decidir se quer:
- **(A) Manter atual** — redireciona direto pro painel com loader "Ativando sua loja…" (UX atual)
- **(B) Usar `/checkout/return`** — mostra tela de sucesso + botão "Acessar painel"

### 2. Plano `basico` órfão no banco
Existe um plano `basico` (R$49) **inativo** sem `stripe_price_id`. Não aparece para o cliente, mas polui consultas. Recomendo deletar ou deixar documentado.

### 3. Número de WhatsApp do botão "Falar com consultor" (Premium anual)
Em `PricingCards.tsx` e na home, o link aponta para `5500000000000` (placeholder). Precisa do número real da ShopBox antes de divulgar.

### 4. Validações finais não testadas em produção real
Nunca foi rodado um cadastro completo em **modo LIVE** (com cartão real). O fluxo foi validado em sandbox. Recomendo um **teste end-to-end com cartão real próprio** após publicar — risco baixo mas é a única forma de garantir 100%.

---

## 📋 Checklist final antes de divulgar

```text
[ ] Atualizar WhatsApp do consultor (Premium anual) — 2 lugares
[ ] Decidir entre /checkout/return ou /admin/dashboard como returnUrl
[ ] (Opcional) Deletar plano "basico" órfão
[ ] Publicar app (botão Publish)
[ ] Fazer 1 cadastro real com cartão próprio em modo LIVE
[ ] Cancelar essa assinatura teste no Stripe
[ ] Pronto para divulgar 🚀
```

---

## 🔮 Melhorias futuras (não-bloqueantes)

- **Aceite de Termos/LGPD** no Step 1 do cadastro (checkbox obrigatório)
- **Recuperação de carrinho abandonado** caso cliente feche o checkout antes de pagar (loja fica `incomplete` no banco)
- **E-mail de boas-vindas** após ativação da assinatura
- **Tela de upgrade/downgrade de ciclo** dentro de `/admin/plano` (hoje só dá para gerenciar via Stripe Portal)
- **Métricas de conversão** no `/superadmin` (cadastros iniciados vs. pagamentos confirmados)

---

## Arquivos que seriam tocados se você aprovar os ajustes

- `src/components/marketing/PricingCards.tsx` — número de WhatsApp
- `src/routes/index.tsx` — número de WhatsApp do CTA do Premium anual
- `src/routes/cadastro.tsx` — (opcional) trocar returnUrl
- Migração SQL — (opcional) `DELETE FROM plans WHERE slug = 'basico'`

