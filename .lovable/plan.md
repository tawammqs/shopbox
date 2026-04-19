

## Objetivo
1. Adicionar a logomarca `shopbox` (PNG enviado) no header da landing e no admin
2. Trocar fontes globais para **Geist Sans** (texto) + **Geist Mono** (mono/acentos)

## Análise rápida
- Logo enviada: `user-uploads://SHOPBOX_4-2.png` — wordmark "shopbox" preto, sans-serif geométrica, lowercase
- Fontes atuais: Plus Jakarta Sans + Inter + DM Sans + Playfair (definidas em `src/styles.css`)
- Header atual (`MarketingHeader.tsx`): usa texto "ShopBox" com `font-display`
- Footer (`MarketingFooter.tsx`): também texto "ShopBox"
- Admin (`src/routes/admin.tsx`): tem header próprio — precisa verificar onde fica o logo

## Plano de execução

### 1. Adicionar a logo ao projeto
- `lov-copy user-uploads://SHOPBOX_4-2.png src/assets/shopbox-logo.png`
- Importar como ES module nos componentes que usam

### 2. Trocar fontes globais para Geist
**`src/styles.css`** — atualizar `@theme inline`:
```
--font-sans: "Geist", system-ui, sans-serif;
--font-mono: "Geist Mono", ui-monospace, monospace;
--font-display: "Geist", system-ui, sans-serif;     /* remover Playfair */
--font-marketing: "Geist", system-ui, sans-serif;   /* remover Plus Jakarta */
--font-marketing-body: "Geist", system-ui, sans-serif; /* remover Inter */
```
Resultado: tudo (landing + admin + storefront) passa a usar Geist automaticamente via tokens existentes.

### 3. Carregar Geist do Google Fonts
**`src/routes/__root.tsx`** — adicionar no `head()`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
```
E remover (ou deixar — não atrapalha) os `<link>` de Plus Jakarta/Inter se existirem.

### 4. Trocar texto "ShopBox" pela logo PNG
**`src/components/marketing/MarketingHeader.tsx`**:
```tsx
import shopboxLogo from "@/assets/shopbox-logo.png";
// ...
<Link to="/" className="flex items-center">
  <img src={shopboxLogo} alt="shopbox" className="h-7 w-auto" />
</Link>
```

**`src/components/marketing/MarketingFooter.tsx`**: mesma troca, mas com filtro CSS `invert` pra ficar branco no fundo escuro:
```tsx
<img src={shopboxLogo} alt="shopbox" className="h-7 w-auto invert brightness-0" 
     style={{ filter: "invert(1) brightness(2)" }} />
```

**Admin** (`src/routes/admin.tsx`): se houver logo/título no sidebar/topo, trocar pela mesma imagem.

### 5. Verificações
- Storefront (`/loja/$slug`) — fontes herdam de `--font-sans`, então automaticamente vira Geist (OK, não é o logo do shopbox lá, é o logo da loja do cliente)
- `/preview-dark` — já usa Geist no escopo `.pdark`; passa a estar consistente com o resto
- Headings na landing (`font-display`) — antes Playfair (serifa), agora Geist (sans). Visual mudará: títulos ficam mais limpos/modernos, alinhado com a vibe minimalista da logo

## Arquivos a alterar
```text
src/assets/shopbox-logo.png            ← NOVO (lov-copy)
src/styles.css                         ← font tokens → Geist
src/routes/__root.tsx                  ← <link> Google Fonts Geist
src/components/marketing/MarketingHeader.tsx   ← logo PNG
src/components/marketing/MarketingFooter.tsx   ← logo PNG (filtro invert)
src/routes/admin.tsx                   ← logo PNG no header (se houver)
```

## Riscos
- **Headings com serifa (Playfair) somem** — design muda. Quem aprovou a vibe NuvemShop pode estranhar. Mas a logo enviada é claramente sans → coerente trocar.
- **Geist pode não carregar instantaneamente** → fallback `system-ui` evita flash.
- **Logo PNG em fundo escuro do footer** → uso `filter: invert(1) brightness(2)` pra deixar branca sem precisar de versão alternativa.

