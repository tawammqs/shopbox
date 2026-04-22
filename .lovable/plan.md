

## Aumentar logo no mobile (header e rodapé)

### Tamanhos atuais no mobile (≤640px)
- **Header**: 52px (32px ao rolar a página — modo "scrolled")
- **Rodapé**: 48px (não tem regra mobile, herda do desktop)

### Tamanhos novos propostos
- **Header mobile**: **72px** (em vez de 52px) — e **56px** quando scrolled (em vez de 42px)
- **Header tablet (≤1024px)**: **88px** (em vez de 78px)
- **Rodapé mobile**: **64px** (nova regra) — desktop continua 48px

Também vou aumentar levemente a altura da barra do header mobile para acomodar a logo maior sem cortar:
- Barra mobile: `72px` → `84px`
- Barra mobile scrolled: `58px` → `68px`
- `max-width` da logo no mobile: `46%` → `52%` (para não espremer demais)

### Arquivo alterado
- `src/routes/index.tsx` — apenas as regras CSS dentro do `<style>` (blocos `.pdark .nav-logo img`, `.pdark .pd-nav-bar`, `.pdark .f-brand img` e os media queries `@media (max-width: 1024px)` e `@media (max-width: 640px)`).

Nenhuma mudança de marcação JSX, apenas valores de altura/largura.

