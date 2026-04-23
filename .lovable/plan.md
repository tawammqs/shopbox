
## Ajustar altura da logo do badge "Criado com ShopBox"

Aumentar a altura da logo no badge do rodapé das lojas para melhor visibilidade.

### Mudança

**Arquivo:** `src/components/storefront/StorefrontFooter.tsx`

Atualizar as classes do `<img>` da logo do badge:

- **Antes:** `h-8 min-h-[32px] ... sm:h-9 sm:min-h-[36px]` (32px mobile / 36px desktop)
- **Depois:** `h-10 min-h-[40px] ... sm:h-11 sm:min-h-[44px]` (40px mobile / 44px desktop)

Também atualizar o atributo `height={32}` para `height={40}` para refletir o novo tamanho base e evitar layout shift. O `width={120}` e `w-auto` permanecem para manter proporção automática.

### Resultado

Logo mais visível no badge, com 40px de altura no mobile e 44px no desktop, mantendo a proporção e o layout responsivo do rodapé intacto.
