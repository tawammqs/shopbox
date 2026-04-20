

## Aplicar toggle Mensal/Anual na seção #precos da landing page (home `/`)

### O que está acontecendo
As alterações anteriores foram feitas em `src/components/marketing/PricingCards.tsx`, que **só é usado na rota `/precos`**. A landing principal (`/`) tem sua própria seção de planos em `src/routes/index.tsx` (linhas 512-526) usando um componente interno `PricingCard` (tema dark `.pdark`) que **não foi tocado**.

### O que será feito (apenas em `src/routes/index.tsx`, seção `#precos`)

**1. Adicionar state de billing no componente da página**
- `useState<"monthly" | "yearly">("monthly")` no topo do componente da home.

**2. Adicionar toggle visual acima do grid de planos**
Posicionado entre o subtítulo e a `.pricing-grid` (após linha 518):
- Label "Mensal" + switch + label "Anual" + badge **"2 meses grátis"**
- Track verde `#25D366` quando ativo, cinza `#e5e7eb` quando inativo, thumb branco
- Transição suave de 0.2s
- Badge: fundo `#f0fdf4`, texto `#27500A`, formato pill arredondado

**3. Atualizar o componente interno `PricingCard`**
- Receber novas props: `isYearly`, `yearlyMonthly`, `yearlyTotal`, `savings`, `slug`
- Quando `isYearly=true`: exibir `yearlyMonthly` no preço grande e linha secundária `R$XXX/ano · economize R$XXX` em verde escuro `#3B6D11` 12px
- Linha de economia com transição suave (max-height + opacity)
- CTA condicional: para `slug="premium"` + `isYearly=true` → "Falar com consultor" linkando para WhatsApp; demais casos mantém "Testar grátis por 7 dias" linkando para `/cadastro`

**4. Valores anuais (em centavos como mensal equivalente)**
| Plano | Mensal | Anual exibido | Total anual | Economia |
|---|---|---|---|---|
| Inicial | R$47 | R$38/mês | R$456/ano | R$108 |
| Profissional | R$97 | R$78/mês | R$936/ano | R$228 |
| Premium | R$197 | R$158/mês | R$1.896/ano | R$468 |

**5. Atualizar nota de rodapé `.p-note` (linha 524)**
- Modo Mensal: `7 dias grátis em todos os planos · sem cartão de crédito · cancele quando quiser` (atual)
- Modo Anual: `Cobrança anual antecipada · sem cartão de crédito · reembolso em até 7 dias`

**6. Adicionar CSS no bloco `STYLES` (próximo à linha 196)**
Novas classes seguindo o padrão `.pdark`:
- `.pdark .billing-toggle` — wrapper flex centralizado
- `.pdark .billing-switch` — track + thumb com transição
- `.pdark .billing-badge` — pill verde claro
- `.pdark .p-savings` — linha de economia verde escuro com transição

### O que NÃO será alterado
- Header, hero, features, depoimentos, FAQ, footer da landing
- Componente `PricingCards.tsx` (rota `/precos`) — já está correto
- Nenhum outro arquivo do projeto
- Cores, fontes e layout existentes da seção (apenas adições)

### Arquivo afetado
- `src/routes/index.tsx` — adicionar state, toggle, CSS, atualizar `PricingCard` e a chamada dos 3 cards

