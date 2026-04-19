

## Objetivo
Permitir você comparar visualmente o design **escuro premium** (HTML enviado) vs a **landing atual** sem alterar nada que está em produção.

## Plano

### 1. Criar rota de preview isolada
- Novo arquivo: `src/routes/preview-dark.tsx`
- Conteúdo: cópia fiel do HTML enviado (`shopbox_landing_1.html`) convertido para JSX/React
- Acessível em `/preview-dark`
- **Não toca** em `/` (landing atual continua intacta)

### 2. Adaptações mínimas para funcionar em React/TanStack
- Tags `<script src="https://cdn.tailwindcss.com">` → remover (Tailwind já está no projeto via `styles.css`)
- Fonts Geist Sans/Mono → adicionar `<link>` no `head()` da própria rota (escopo isolado)
- Substituir `class=` por `className=`, `for=` por `htmlFor=`
- Botões "Testar grátis" → `<Link to="/cadastro">`
- Botão "Entrar" → `<Link to="/login">`
- Animações CSS inline (ticker, glow) → mover para `<style>` no topo do componente

### 3. O que NÃO faço agora
- Não altero `src/routes/index.tsx`
- Não altero `src/styles.css`
- Não altero header/footer atuais
- Não troco fontes globais

## Como você usa
1. Abre `/` → vê a landing atual (clara, verde WhatsApp)
2. Abre `/preview-dark` → vê o design escuro premium do HTML
3. Decide qual prefere e me avisa:
   - "Migra para a escura" → eu substituo `index.tsx`
   - "Fica com a clara" → eu deleto `/preview-dark`
   - "Faz híbrido" → conversamos sobre quais elementos da escura trazer pra clara

## Arquivos
```text
src/routes/
  preview-dark.tsx    ← NOVO (rota temporária de comparação)
```

Apenas 1 arquivo novo. Zero risco para a landing atual.

