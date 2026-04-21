

# Corrigir crash da aba Descontos

## Problema

Quando o lojista abre `/admin/descontos`, a página quebra com `Cannot read properties of undefined (reading 'id')`.

**Causa**: o componente renderiza `<CouponsTab storeId={store!.id} />` (e idem para Promos/Combos) **antes** de `useMyStore()` terminar de carregar. Enquanto `store` é `undefined`, o `store!.id` estoura. O `PlanGate` também não impede a renderização durante o loading — ele só checa o plano.

Além disso, mesmo após carregar, se o usuário ainda não tem loja (`store === null`) ou está em plano sem o recurso, o código continua tentando acessar `store!.id` em pontos do `PopupTab`.

## Solução

Tratar 3 estados antes de renderizar as abas:
1. **Carregando** (`isLoading`) → skeleton
2. **Sem loja** (`store === null`) → mensagem orientando criar/ativar a loja
3. **Loja carregada** → renderiza `Tabs` normalmente, passando `store.id` já garantido

## Mudanças

**Arquivo único:** `src/routes/admin.descontos.tsx`

1. Desestruturar `isLoading` de `useMyStore()` além de `data: store`.
2. No início do `DiscountsPage`, antes do `return` principal:
   - Se `isLoading` → renderizar bloco de skeleton (cabeçalho + placeholder das tabs).
   - Se `!store` → renderizar card "Loja não encontrada" com link para `/admin/configuracoes` ou `/admin/plano`.
3. Só depois disso renderizar o `<PlanGate>` + `<Tabs>`, agora com `store.id` (não `store!.id`).
4. No `PopupTab`, manter o early-return atual mas substituir `store?.id` no array de dependências do `useEffect` por algo seguro — já está com `?.`, ok.

Resultado: a aba abre normalmente; durante o carregamento mostra skeleton em vez de quebrar; se não houver loja, mostra mensagem amigável em vez de tela de erro genérica.

## Detalhes técnicos

- Não mexe em banco, RLS, nem em outras rotas.
- Não altera comportamento de `useMyStore`, `PlanGate`, nem das abas internas — apenas adiciona guarda de loading/null no componente pai.
- Skeleton usa `<Skeleton />` de `@/components/ui/skeleton` (já existe no projeto).

