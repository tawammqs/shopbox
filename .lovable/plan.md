

## Plano: cron de limpeza + realtime + republicação

### A. Cron de limpeza de lojas órfãs (TanStack server route)

**Por quê:** evitar que lojas com `subscription_status='incomplete'` sem `stripe_subscription_id` há mais de 24h ocupem slugs/poluam o banco quando o usuário desistir do checkout.

**Arquivos:**
- Criar `src/routes/hooks/cleanup-orphan-stores.ts`
  - Server route POST com validação de `Authorization: Bearer <anon-key>`
  - Usa `supabaseAdmin` (service role) para `DELETE FROM stores WHERE subscription_status='incomplete' AND stripe_subscription_id IS NULL AND created_at < now() - interval '24 hours'`
  - Também cancela usuários auth órfãos? **Não** — só remove a loja. O usuário pode tentar criar outra depois.
  - Retorna JSON `{ deleted: number }`

- Agendar via `pg_cron` + `pg_net` (insert tool, não migration) rodando 1x por hora:
  ```sql
  SELECT cron.schedule(
    'cleanup-orphan-stores-hourly',
    '15 * * * *',
    $$ SELECT net.http_post(
      url := 'https://shopbox.lovable.app/hooks/cleanup-orphan-stores',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon>"}'::jsonb,
      body := '{}'::jsonb
    ); $$
  );
  ```
  Garantir extensions `pg_cron` e `pg_net` ativadas (migration separada se preciso).

### B. Realtime na tabela `stores` (substitui polling)

**Por quê:** hoje o `/admin?checkout=success` invalida a query a cada 2.5s por 30s. Com Realtime, a tela "Ativando sua loja…" libera no instante em que o webhook atualiza a linha.

**Arquivos:**
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;` e `ALTER TABLE public.stores REPLICA IDENTITY FULL;`
- `src/hooks/useMyStore.ts`: adicionar `useEffect` que assina `postgres_changes` (UPDATE) na tabela `stores` filtrado por `owner_user_id=eq.<userId>` e invalida a query no callback. Cleanup do canal no unmount.
- `src/routes/admin.tsx`: remover o bloco `setInterval/setTimeout` de polling (linhas 62-75) — o realtime cuida disso. Manter o botão "Já paguei — atualizar" como fallback manual.

### C. Republicar e testar end-to-end

1. Republicar (deploy automático de edge functions + nova rota `/hooks/cleanup-orphan-stores`)
2. Disparar manualmente uma vez `curl -X POST .../hooks/cleanup-orphan-stores` para validar
3. Fluxo completo no preview:
   - `/cadastro` → criar conta + escolher plano "Profissional"
   - Pagar com `4242 4242 4242 4242`, qualquer CVC, validade futura
   - Verificar redirect para `/admin/dashboard?checkout=success`
   - Confirmar que a tela "Ativando sua loja…" some sozinha em <3s (graças ao realtime)
   - Confirmar `subscription_status='trialing'` e acesso ao dashboard

### Riscos / observações
- O endpoint `/hooks/cleanup-orphan-stores` precisa do anon key no header — armazeno no SQL do cron, não no código
- Realtime só dispara para o owner que está logado (filtro `owner_user_id`), não há vazamento entre usuários
- Sem e-mail Resend nesta rodada (recusado) — se quiser depois, basta colar a chave API

### Resultado esperado
- Lojas incompletas somem automaticamente após 24h
- Liberação pós-pagamento é instantânea (sem polling)
- Fluxo cadastro→pagamento→admin testado e validado

