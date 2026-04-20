

## Causa raiz

O erro `cannot add postgres_changes callbacks for realtime:my-store-... after subscribe()` vem de `src/hooks/useMyStore.ts`. O canal usa nome fixo `my-store-${user.id}` e, em re-mounts (StrictMode em dev, ou navegação que remonta o hook), o Supabase reaproveita a instância já inscrita no registry interno e rejeita o novo `.on()`. Esse erro derruba o render do `/admin/dashboard`.

## Correção (1 arquivo)

**`src/hooks/useMyStore.ts`** — tornar a subscription idempotente e segura para re-mount:

1. Gerar nome de canal único por execução do `useEffect` usando um sufixo aleatório curto (`crypto.randomUUID().slice(0,8)`), pois mesmo com cleanup correto o Supabase pode demorar a remover do registry entre mount/unmount duplicado do StrictMode.
2. Garantir que o cleanup chame `supabase.removeChannel(channel)` sempre — já existe, mas vou envolver em try/catch para nunca propagar erro.
3. Envolver toda a configuração da subscription em try/catch silencioso. Realtime é um nice-to-have (apenas invalida cache); se falhar, o app continua funcionando — o React Query já tem `staleTime: 10s` e refetch on focus.
4. Não tocar na query principal — ela está correta.

## Por que isso resolve o admin

- A exceção do `.on(...).subscribe()` está sendo lançada dentro do `useEffect` durante o render do `/admin`, o que estoura para o error boundary do router e mostra a tela "Algo deu errado".
- Com nome único + try/catch, o realtime nunca pode derrubar a página, mesmo se o WebSocket falhar.

## O que NÃO vou mexer

- `src/router.tsx`, `src/routes/admin.tsx`, `src/routes/superadmin.tsx` — superadmin já funciona, gates já estão defensivos.
- RLS, auth, banco — sem mudanças.
- Tipagem do `MyStore` — sem mudanças.

## Detalhes técnicos

- Arquivo: `src/hooks/useMyStore.ts`
- Mudança de ~10 linhas no `useEffect`
- Após o deploy: hard refresh em `shopbox.lovable.app/admin/dashboard` deve carregar o painel do lojista normalmente

