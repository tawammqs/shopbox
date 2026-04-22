

## Substituir a logo da ShopBox

Vou trocar o arquivo `src/assets/shopbox-logo.png` pela nova logo que você enviou (`ChatGPT_Image_22_de_abr._de_2026_07_23_36.png`).

### O que muda

- **`src/assets/shopbox-logo.png`** — sobrescrito com a nova imagem.

### Onde a nova logo aparece automaticamente (sem alterar código)

A logo já é importada em 4 lugares através do mesmo path `@/assets/shopbox-logo.png`, então a troca propaga sozinha:

1. **Home / landing page** (`src/routes/index.tsx`) — header e footer
2. **Header de marketing** (`src/components/marketing/MarketingHeader.tsx`) — usado em `/precos`, `/funcionalidades`, etc.
3. **Footer de marketing** (`src/components/marketing/MarketingFooter.tsx`)
4. **Painel admin** (`src/routes/admin.tsx`) — sidebar do lojista

### Observação sobre a imagem

A nova logo enviada tem **fundo branco** e o texto "shopbox" em **contorno branco/cinza muito claro** (preenchimento transparente, só o ícone do balão verde tem cor sólida). Isso significa que:

- Em fundos **claros/brancos** (footer da home, painel admin), o texto vai ficar quase invisível — só o ícone verde aparece bem.
- Em fundos **escuros** (header escuro da home atual), o contorno branco do texto fica legível.

Se você quiser que o texto "shopbox" fique sempre visível em qualquer fundo, me avisa que eu posso:
- (a) usar essa logo só onde o fundo é escuro e manter a anterior nos fundos claros, ou
- (b) você me envia uma versão com o texto preenchido (sólido preto ou verde) para usar em fundos claros.

Por padrão vou só substituir o arquivo como pedido — me confirma se quer seguir assim ou ajustar.

