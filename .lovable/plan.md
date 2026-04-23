
## Plano: Vídeo no Produto + Seção "Descubra em Vídeo" Shoppable

### 1. Banco de dados (migração)

**Alterar `products`:**
- `video_url text` (nullable)
- `video_type text` (nullable, valida: `upload | mp4 | youtube`)

**Nova tabela `home_video_sections`:**
- `id`, `store_id` (FK stores), `title`, `video_url`, `video_type`, `is_active`, timestamps
- Único por loja (uma seção por store)
- RLS: leitura pública se `is_active=true` e store ativa; lojista gerencia a sua

**Nova tabela `home_video_tags`:**
- `id`, `home_video_section_id` (FK), `product_id` (FK products), `position_x` (0–100), `position_y` (0–100), `timestamp_start` (int seg, nullable), `timestamp_end` (int seg, nullable), `created_at`
- RLS: leitura pública via seção ativa; lojista da loja dona gerencia

**Bucket `product-videos`** (público), com policies:
- SELECT público
- INSERT/UPDATE/DELETE pelo dono da loja (path prefixado por `store_id/`)

### 2. Componente reutilizável `VideoSourcePicker`
Tabs: **Upload | Link MP4 | YouTube**, com preview embutido. Upload faz client-side upload ao `product-videos` (limite 100MB, valida tipo mp4/mov/webm) e devolve `{url, type}`.

Helper `getYoutubeEmbed(url)` para extrair ID e gerar embed.

### 3. Cadastro de produto (`admin.produtos.$id.tsx`)
Adicionar card "Vídeo do produto" usando `VideoSourcePicker`, salvando `video_url` e `video_type` no `products`.

### 4. Página do produto pública (`loja.$slug.produto.$productSlug.tsx`)
Renderizar `VideoPlayer` (componente novo) com o `video_url`/`video_type` do produto numa nova aba/seção, sem alterar o resto.

### 5. Painel admin: `/admin/home-video`
Nova rota `admin.home-video.tsx`:
- Toggle ativar/desativar
- Título configurável
- `VideoSourcePicker` para o vídeo principal
- **TagOverlayEditor**: preview do vídeo + tags posicionadas via drag-and-drop (mouse/touch); seletor de produto, timestamps opcionais; lista lateral com editar/remover.
- Adicionar link no menu lateral do admin

### 6. Home da loja (`loja.$slug.index.tsx`)
Nova seção `<HomeVideoSection />` (componente novo) renderizada quando existe seção ativa para a loja:
- Player responsivo grande
- Tags pulsantes sobrepostas, respeitando `timestamp_start/end` (sincronizadas via `currentTime` do `<video>` ou para YouTube via IFrame API básica — para YouTube as tags ficam visíveis o tempo todo já que controlar timestamps via IFrame requer API extra; documentar)
- Clique na tag abre mini card com foto/nome/preço/CTA "Ver produto"

### 7. Componente `ShoppableVideo` (compartilhado)
Usado tanto no editor admin (modo edição com drag) quanto na home (modo view). Props: `videoUrl`, `videoType`, `tags`, `mode: "edit" | "view"`, `onTagMove`, `onTagClick`, etc.

### Limitações declaradas ao usuário
- Para vídeos **YouTube**, sincronização precisa por timestamp não está disponível sem IFrame API completa — tags YouTube ficam sempre visíveis (sem `timestamp_start/end`).
- Para upload/MP4, sincronização funciona via evento `timeupdate` do `<video>`.

Começo aplicando a migração do banco.
