

## Corrigir policies do bucket `product-videos` (referência ambígua de `name`)

### Causa raiz

As policies de INSERT/UPDATE/DELETE do bucket `product-videos` usam `storage.foldername(name)` **dentro** de um `EXISTS (SELECT 1 FROM public.stores s ...)`. Como `stores` também tem uma coluna chamada `name`, o Postgres resolve `name` para `s.name` (nome da loja) em vez de `storage.objects.name` (caminho do arquivo). A comparação `s.id::text = (storage.foldername(s.name))[1]` praticamente nunca é verdadeira → toda tentativa de upload é rejeitada com **"new row violates row-level security policy"**, que o front-end mapeia para **"Sem permissão para enviar…"**.

A policy de SELECT funciona porque não usa `foldername`; o bucket é público e leitura passa.

### Mudança

**Nova migração** que recria as três policies de escrita do bucket `product-videos` qualificando a coluna como `storage.objects.name` para eliminar a ambiguidade:

```sql
DROP POLICY IF EXISTS "Owner uploads product videos" ON storage.objects;
CREATE POLICY "Owner uploads product videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-videos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_user_id = auth.uid()
        AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

-- mesma correção para "Owner updates product videos" (USING)
-- mesma correção para "Owner deletes product videos" (USING)
```

A policy de SELECT (`Public read product videos`) já está correta e fica intacta. O bucket continua público.

### Resultado

- Upload de vídeo (produto principal e depoimento) volta a funcionar para o lojista logado dono da loja.
- Caminho continua obrigatoriamente prefixado por `{store_id}/...`, mantendo o isolamento entre lojas.
- Nenhuma mudança no front-end é necessária — o `VideoSourcePicker` já envia para o caminho correto.

### Detalhe técnico

A correção é **apenas** trocar `name` por `storage.objects.name` dentro do subselect. Isso força o planner a referenciar a coluna do storage em vez da coluna `name` da tabela `stores` introduzida pelo `EXISTS`. Sem essa qualificação, qualquer `EXISTS (SELECT … FROM uma_tabela_com_coluna_name …)` dentro de uma policy do storage sofre o mesmo silent shadowing.

