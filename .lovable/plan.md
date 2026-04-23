

## Plano: Carrossel de vídeos shoppable na home (4–5 vídeos)

A imagem de referência mostra **vários vídeos verticais** lado a lado, em formato carrossel, cada um com um card de produto sobreposto. Vou aplicar isso à seção "Descubra em vídeo".

### 1. Banco de dados (migração)

A estrutura atual permite **apenas um vídeo por loja** (`UNIQUE (store_id)` em `home_video_sections`) — preciso permitir múltiplos.

- Remover o `UNIQUE` em `home_video_sections.store_id`.
- Adicionar `position int not null default 0` em `home_video_sections` para ordenar o carrossel.
- Adicionar `aspect text default 'vertical'` (`vertical | horizontal`) — vídeos do carrossel são preferencialmente verticais (9:16), conforme a imagem.
- Índice `(store_id, position)` para ordenação.
- Policies já estão corretas (não dependem do unique) — manter.

### 2. Storefront — `HomeVideoSection.tsx`

Reescrever para buscar **todos** os vídeos ativos da loja e renderizar um carrossel:

- Query: `home_video_sections` filtrado por `store_id` + `is_active=true`, ordenado por `position`. Trazer junto `home_video_tags` (já exposto pela RLS pública) e produtos referenciados.
- Layout: usar `embla-carousel-react` (já instalado e usado em `BannerCarousel.tsx` e `carousel.tsx`).
  - Container `max-w-7xl`, título centralizado.
  - Cada slide: vídeo vertical (aspect 9:16) com largura ~280–320px, bordas arredondadas, sombra, e card de produto flutuante na parte inferior (estilo igual à imagem: mini-thumb + nome + preço + preço cortado).
  - Em desktop mostra 4–5 slides; em mobile, 1.5–2 com snap.
  - Setas de navegação (prev/next) e suporte a arrastar.
  - Autoplay opcional dos vídeos: o vídeo central no viewport entra em play (via IntersectionObserver), demais ficam pausados/silenciados — evita 5 vídeos tocando juntos.
- Card de produto sobreposto: usa a **primeira tag** do vídeo como produto destaque (formato da imagem mostra um único card por vídeo). As demais tags continuam interativas como pulsantes (mantendo o `ShoppableVideo` existente em modo `view`).
- Remover o `max-w-5xl` central — agora o conteúdo é o carrossel inteiro.

### 3. Admin — `admin.home-video.tsx`

Refatorar para gerenciar **lista de vídeos**:

- Trocar o estado único (`sectionId`, `videoUrl`, …) por uma **lista de seções** (`sections: Section[]`).
- UI:
  - Lista vertical de cards, cada um representando um vídeo, com:
    - Thumbnail/preview pequeno
    - Switch "Ativo"
    - Título editável (ex: "Vídeo 1")
    - Botão "Editar tags" (abre o editor `ShoppableVideo` em modo `edit` no card, igual hoje)
    - Botão "Excluir"
    - Setas ↑↓ para reordenar (atualiza `position`)
  - Botão "Adicionar vídeo" no topo, limitado a **5 vídeos** (com aviso visual quando atingir o limite). Acima do limite, botão fica desabilitado com tooltip "Limite máximo: 5 vídeos".
- Salvamento: um único botão "Salvar todos" que faz upsert em batch — para cada seção, cria/atualiza o registro e substitui as tags. Posições recalculadas pela ordem na lista.
- Cabeçalho da página atualizado: "Vídeos da home (até 5)" em vez de "Vídeo da home".

### 4. Detalhes técnicos

- **Embla**: usar opções `{ align: "start", containScroll: "trimSnaps", dragFree: false }` para snap natural; plugin `WheelGesturesPlugin` não é necessário.
- **Vídeos verticais**: `aspect-[9/16]` no container do slide, `object-cover` no `<video>`. Em vídeos horizontais (caso o lojista escolha), cair para `aspect-video`.
- **Performance**: cada `<video>` com `preload="metadata"` e `muted playsInline`. IntersectionObserver dispara `play()` no slide visível e pausa nos demais.
- **Card de produto sobreposto**: posicionado `absolute bottom-3 left-3 right-3`, fundo `bg-card/90 backdrop-blur`, contém thumb 40×40, título 2 linhas, preço atual em destaque + preço original riscado se houver promo.
- **Edge case**: se um vídeo ativo não tiver tags, a seção ainda renderiza o vídeo no carrossel (sem card sobreposto), garantindo flexibilidade.
- **YouTube no carrossel**: continua funcionando, mas IntersectionObserver não controla play (limitação documentada). Em vídeos vertical-aspect, iframe é exibido via `aspect-[9/16]` com `object-fit` simulado por `transform scale`.

### Resultado

- Lojista cadastra de 1 a 5 vídeos verticais com tags shoppable, gerencia ordem e ativação.
- Cliente vê na home um carrossel horizontal com snap, vídeos verticais autoplay-on-view, card de produto sobreposto, navegação por setas/arrasto — igual à referência enviada.

