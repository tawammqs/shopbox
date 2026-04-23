

## Corrigir erro de RLS no upload de vídeo de depoimento

### Causa raiz

O componente `VideoSourcePicker` usado no card "Vídeos depoimento" (em `admin.produtos.$id.tsx`) tenta enviar o arquivo para o bucket `product-videos` num caminho que **precisa começar com o `store_id` do usuário**, conforme a policy de INSERT do storage:

```
(storage.foldername(name))[1] = stores.id  AND  stores.owner_user_id = auth.uid()
```

Hoje o componente recebe `storeId={store?.id ?? ""}`. Quando `store` ainda não foi carregado (ou o `useMyStore` retorna sem dados naquele instante), o `storeId` vai como `""`, o path do upload vira algo como `"/1700000000-abc.mp4"`, e a policy rejeita com **"new row violates row-level security policy"**.

Outro fator que pode contribuir: o `VideoSourcePicker` não bloqueia o clique do botão de upload enquanto a loja está carregando, então o usuário consegue tentar enviar antes do `store.id` existir.

### Mudanças

**1. `src/components/admin/VideoSourcePicker.tsx`**
- No início do `handleFile`, validar que `storeId` é um UUID não-vazio. Se vier vazio, abortar com `toast.error("Aguarde — carregando dados da loja…")` e não chamar o `supabase.storage.upload`.
- Desabilitar (`disabled`) o botão "Selecionar vídeo" quando `storeId` for vazio, com tooltip/label explicativo.
- Melhorar a mensagem de erro do `catch`: se o erro do Supabase contiver "row-level security" ou "Unauthorized", mostrar mensagem clara: "Sem permissão para enviar. Verifique se você está logado como dono desta loja."

**2. `src/routes/admin.produtos.$id.tsx`** (card de depoimentos)
- Garantir que o card de depoimentos só renderiza o `VideoSourcePicker` quando `store?.id` já está disponível. Se `store` ainda está carregando, mostrar um placeholder de "Carregando…" no lugar das tabs do picker. Isso elimina a janela em que o usuário poderia clicar antes da hora.

### Resultado

- Usuário recebe feedback claro caso tente enviar antes da loja carregar (em vez do erro técnico de RLS).
- Upload sempre vai para `{store_id}/...`, satisfazendo a policy do bucket.
- O erro "new row violates row-level security policy" deixa de aparecer no fluxo normal de cadastro/edição de produto.

### Detalhe técnico

Não é necessário alterar policies do banco nem do storage — elas estão corretas e seguras (cada lojista só pode escrever na pasta da sua própria loja). A correção é puramente no front-end, garantindo que o `storeId` passado ao picker é sempre válido antes de iniciar o upload.

