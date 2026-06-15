
# Editor "Página inicial" — Plano de execução

## Diagnóstico atual

- O editor (`src/routes/admin.loja.layout.editar.tsx`, 941 linhas) lista as seções mas a maioria dos painéis de configuração ou não existe, ou salva em um lugar que o storefront não lê.
- O storefront Mio (`TheShoesHomepage.tsx`, 934 linhas) ainda lê majoritariamente de `the_shoes_theme_settings` e tem fallbacks hardcoded da The Shoes, em vez de `store_theme_settings.customizations` (problema multi-tenant já mapeado em prompt anterior).
- Resultado: nada do que o lojista edita aparece na loja.

Cobrir as **13 seções pedidas** (4 de marca + 9 da home), com painel real + persistência + render no storefront, mais um teste E2E em `/loja/themini`, é trabalho grande e de alto risco. Vou dividir em fases entregáveis para você poder validar cada uma antes de seguir.

## Contrato de dados (única fonte de verdade)

`store_theme_settings.customizations.homepage`:

```text
{
  sections_order: string[],                       // ordem das seções
  sections_visibility: Record<key, boolean>,      // toggle do olho
  sections_config: Record<key, object>            // 1 objeto por seção (shapes do prompt)
}
```

Chaves canônicas: `banners_rotativos`, `produtos_oferta`, `produtos_destaque`, `produtos_novos`, `boas_vindas_marquee`, `anuncios_marquee`, `frete_pagamento`, `banners_categorias`, `instagram`, `faq`, `produto_principal`, `marcas`, `newsletter`, `categorias_principais`, `video`, `depoimentos`, `imagem_texto`, `institucional`.

O tema Mio passa a ler **primeiro** de `customizations.homepage.sections_config[key]` e só cai em `the_shoes_theme_settings` como fallback legado **exclusivo da loja The Shoes**. Para qualquer outra loja (themini etc.), sem config = seção não renderiza (sem vazar dados de outra loja).

## Fase 1 — Fundação (1 entrega)

1. Arquivo `src/lib/homepage-sections.ts`: define as chaves, defaults, tipos TS por seção, helpers `getSectionConfig(cust, key)` e `isSectionVisible(cust, key)`.
2. Hook `useHomepageSection(storeId, key)` que devolve `{ visible, config }` a partir de `customizations`.
3. Migração: nenhuma — `customizations` já é `jsonb`.
4. Refator do editor: cada item da lista vira `<SectionRow>` com toggle de visibilidade que persiste em `sections_visibility[key]`; chevron abre um `<SectionEditorDrawer>` que despacha para o painel da seção.

Entrega: lista funcional, toggle do olho liga/desliga a seção na loja (mesmo que os painéis ainda não existam).

## Fase 2 — 9 seções prioritárias (painel + render)

Um componente de painel por seção em `src/components/admin/layout-editor/sections/`, e um componente de render por seção em `src/components/storefront/the-shoes/sections/`. O `TheShoesHomepage.tsx` passa a iterar `sections_order` filtrado por `sections_visibility` e renderiza cada componente com o config dele.

| # | Chave | Painel (campos do prompt) | Render |
|---|---|---|---|
| 1 | banners_rotativos | lista de itens (upload desktop 1920×600, mobile 750×1000, link), intervalo, autoplay | Embla carousel responsivo |
| 2 | produtos_destaque | título, limit (4/8/12), botão ver mais | query `products.featured_sections @> '{destaque}'` ou `is_featured` |
| 3 | boas_vindas_marquee | texto, cor fundo, cor texto, velocidade | marquee horizontal |
| 4 | produtos_novos | título, categoria, limit | join `product_categories` |
| 5 | frete_pagamento | até 4 itens (ícone Lucide, título, descrição), cores | barra de ícones |
| 6 | anuncios_marquee | igual ao 3, independente | marquee |
| 7 | banners_categorias | lista (categoria, desktop 600×400, mobile 360×240) | grid de cards |
| 8 | instagram | título, @, até 12 fotos | grid 3-4 col, esconde se `photos.length===0` |
| 9 | faq | título, subtítulo, lista pergunta/resposta | Accordion shadcn, fundo `#dfdac8` |

Storage: as imagens vão para o bucket `banners` (já existe, público) sob `homepage/<storeId>/<section>/...`.

## Fase 3 — Demais seções

Para `produto_principal`, `marcas`, `newsletter`, `categorias_principais`, `video`, `depoimentos`, `imagem_texto`, `institucional`, `banners_promocionais`, `banners_novidades`: criar painel mínimo (toggle + título quando aplicável; placeholder "sem configurações adicionais" quando não). Garantir que todas aparecem na lista com toggle funcional.

## Fase 4 — Marca / tipografia / cabeçalho / logo

Auditar e corrigir o que estiver quebrado:
- Logo: `stores.logo_url` → header lê (já funciona em `StorefrontHeader`, confirmar no `TheShoesHeader`).
- Cores: `customizations.colors` já é aplicado em `StorefrontCustomizer`. Confirmar que `TheShoesHomepage` usa `var(--store-accent)` em vez de `ACCENT = "#111111"`.
- Tipografia: idem `StorefrontCustomizer` já injeta Google Fonts; verificar uso.
- Cabeçalho: `customizations.header` → `TheShoesHeader` precisa consumir.

Esta fase é majoritariamente verificação + pequenos ajustes, não reescrita.

## Fase 5 — Teste E2E em `/loja/themini`

Script Playwright (headless) que para cada uma das 13 seções: faz login no admin (precisa de credenciais de teste — vou pedir), abre o editor, altera 1 valor, publica, abre `/loja/themini`, captura screenshot e compara. Gera a tabela final pedida.

## Risco / tamanho

- Volume de código: ~25 novos arquivos, ~3000 linhas. Faseado para você revisar cada fase.
- Sem migrações de DB. Sem mudança de RLS. Sem mexer em checkout, feed, webhook, ou nas configurações atuais da The Shoes (que continuam via `the_shoes_theme_settings` como fallback).

## Pré-requisitos para começar

1. **Confirma a divisão em fases?** Posso entregar Fase 1 + Fase 2 (9 seções prioritárias) num primeiro turno (é o grosso do valor), e Fases 3-5 num segundo turno. Ou prefere tudo de uma vez (resposta muito longa, maior chance de bug)?
2. **Credenciais de teste da themini** (`TEST_USER` / `TEST_PASS` ou similar) para a Fase 5 — sem isso valido só renderização lendo direto do DB, sem fluxo de publicar pela UI.
3. **Tema Mio como única fonte**: posso assumir que toda loja que ativa Mio passa a ler de `customizations.homepage` e `the_shoes_theme_settings` vira apenas fallback legado read-only da The Shoes? (Confirma o que você já indicou no prompt anterior.)
