
## Status
Ainda não dá para dizer que foi corrigido.

Pelo código atual, o erro 185 provavelmente continua possível na loja. A causa mais suspeita ainda está presente em `CartDrawer`.

## O problema identificado
Em `src/components/storefront/CartDrawer.tsx` existe este padrão:

```ts
const items = useCart((s) => s.itemsForStore(store.id));
```

E em `src/stores/cart.ts`:

```ts
itemsForStore: (storeId) => get().items.filter((i) => i.storeId === storeId)
```

Esse selector gera um **novo array a cada leitura**. Em Zustand, isso pode disparar renderizações em cascata e levar ao erro React 185 (“Maximum update depth exceeded”), especialmente em páginas como `/loja/demo` que sempre montam `CartDrawer`.

## Conclusão
Então, pela inspeção do código:
- **não consigo confirmar que o problema foi corrigido**
- **o ponto mais provável do bug ainda existe**
- a correção precisa ser aplicada no store/header/drawer antes de validar novamente em produção

## Plano de correção
1. Ajustar `CartDrawer` para não usar selector que retorna array novo a cada render
2. Ler `items` brutos do store com selector estável
3. Filtrar por `store.id` fora do selector, com `useMemo`
4. Calcular subtotal a partir desse array memoizado, ou criar selector estável no store
5. Revisar outros selectors derivados no storefront para evitar o mesmo padrão
6. Depois testar `/loja/demo` novamente

## Arquivos a ajustar
- `src/components/storefront/CartDrawer.tsx`
- `src/stores/cart.ts`
- revisar também:
  - `src/components/storefront/StorefrontHeader.tsx`
  - `src/components/storefront/ProductCard.tsx`
  - `src/routes/loja.$slug.produto.$productSlug.tsx`

## Detalhe técnico
A correção mais segura é trocar de:
```ts
useCart((s) => s.itemsForStore(store.id))
```

para algo como:
```ts
const allItems = useCart((s) => s.items);
const items = useMemo(() => allItems.filter((i) => i.storeId === store.id), [allItems, store.id]);
```

Assim o hook assina um valor estável do store, e a derivação acontece no componente sem provocar loop de assinatura.

## O que farei quando você aprovar
- aplicar a correção
- revisar os selectors derivados relacionados
- testar a rota `/loja/demo`
- confirmar se o erro desapareceu
