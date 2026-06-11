# Aumentar logo ShopBox para ficar bem visível

## Contexto
A logo atual está em `h-10` (40px) com `maxWidth: 160` e mesmo assim está difícil de enxergar no sistema. A referência da Nuvemshop foi citada, mas o objetivo real é **destacar** a logo da ShopBox no header/sidebar do admin.

## Mudança
Arquivo: `src/components/admin/AdminShell.tsx` (linha ~255, `<img>` da logo)

- Altura: `h-10` (40px) → `h-14` (56px)
- `maxWidth`: 160 → 200
- Mantém `w-auto object-contain` para preservar proporção

## Por que h-14
- 40% maior que o atual, garante leitura imediata
- Ainda cabe confortavelmente em headers/sidebar padrão (64-72px de altura)
- Se quiser ainda mais impacto, posso usar `h-16` (64px) com `maxWidth: 220`

Confirma `h-14` (56px) ou prefere `h-16` (64px) para ficar ainda mais destacada?