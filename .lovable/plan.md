

# Remover aba Avaliações + Ignorar estoque na vitrine

## 1. Remover a aba "Avaliações" do painel do lojista

**Arquivos:**
- `src/routes/admin.tsx` — remover o item `{ to: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquare }` do array `NAV` (linha 36) e remover o import `MessageSquare` (não usado mais).
- `src/routes/admin.avaliacoes.tsx` — **excluir o arquivo**. O TanStack Router regera `routeTree.gen.ts` automaticamente, então a rota some.

A página pública de produto continua mostrando avaliações já aprovadas (sem alteração). Só o item do menu do painel do lojista é removido.

## 2. Mostrar todas as opções de tamanho/cor independentemente do estoque

Hoje o site da loja trata estoque zerado como "Esgotado": esmaece cores indisponíveis, risca tamanhos sem estoque, mostra overlay "Esgotado" no card e bloqueia os botões "Adicionar ao carrinho" e "Comprar pelo WhatsApp". O lojista quer que o cliente sempre consiga escolher e comprar, ignorando o estoque cadastrado.

### 2a. `src/components/storefront/ProductCard.tsx` (cards de listagem)

- Forçar `out = false` (remover a checagem `p.totalStock === 0`).
- Remover o overlay "Esgotado" (bloco que renderiza quando `out`).
- Remover o aviso "⚠️ Restam X unidades" (`lowStock`).
- Botão "Adicionar"/"Escolher opções" sempre habilitado.

### 2b. `src/routes/loja.$slug.produto.$productSlug.tsx` (página de produto)

- Forçar `colorAvailable` a sempre retornar `true` → todas as cores aparecem 100% opacas e clicáveis (sem o risco diagonal).
- Forçar `sizeAvailableForColor` a sempre retornar `true` → todos os tamanhos clicáveis, sem `line-through` nem `disabled`.
- Forçar `isOut = false` e `lowStock = false` → bloco de estoque exibe sempre "Em estoque"; botões "Adicionar ao carrinho" e "Comprar agora pelo WhatsApp" sempre habilitados.
- Em `validate()`, remover a regra `if (variantStock === 0) return "Variação esgotada"` — só continua exigindo seleção de cor/tamanho quando o produto tiver variações.

### 2c. `src/lib/storefront.ts`

- Remover o filtro `if (opts.inStock)` em `fetchProductsForCategory` (já que estoque deixa de ser critério de exibição). O filtro "Em estoque" do menu de filtros simplesmente deixa de filtrar.

### O que NÃO muda

- O painel do lojista continua mostrando "Esgotado" e "Estoque baixo" em `/admin/produtos` (controle interno do lojista).
- O cadastro de estoque por variação continua existindo no admin — apenas deixa de impactar a vitrine.
- O botão "Avise-me quando chegar" (stock_notify_requests) deixa de aparecer naturalmente, pois não há mais cenário de "esgotado" exibido.

## Detalhes técnicos

- Nenhuma migração de banco. Nenhuma alteração em RLS ou edge functions.
- `routeTree.gen.ts` é regerado pelo plugin do Vite ao excluir `admin.avaliacoes.tsx` — não editar manualmente.
- Imports não usados (`MessageSquare` em `admin.tsx`) precisam ser removidos para não quebrar o ESLint/TS estrito.

