# Ajustes completos da landing ShopBox

## Objetivo
Corrigir, em uma única atualização, o layout desktop e mobile das seções públicas da landing, sem alterar painel, checkout, dados ou lojas existentes.

## Alterações
- Reorganizar o comparativo em duas colunas no desktop, com chamada fixa à esquerda e conteúdo interativo à direita; preservar a composição em coluna no celular.
- Transformar Funcionalidades em uma faixa verde com cinco cards brancos em carrossel, três visíveis no desktop e um com prévia do próximo no celular, incluindo setas funcionais.
- Manter a chamada de Como funciona fixa no desktop e fazer os quatro cards se empilharem durante a rolagem; no celular, usar fluxo vertical normal.
- Manter as três abas simples em Planos; exibir três planos lado a lado no desktop e corrigir o carrossel com prévia do próximo no celular.
- Centralizar o título e os cards de Depoimentos e manter as setas visíveis e funcionais também no celular.
- Remover integralmente o bloco de garantia do FAQ.
- Reorganizar o rodapé em cinco colunas, com marca e descrição alinhadas à esquerda, redes sociais circulares com ícones, e nova coluna Blog apontando para `/blog` sem criar a página agora.

## Detalhes técnicos
- Concentrar as mudanças em `src/routes/index.tsx`, reaproveitando os estados e dados atuais.
- Usar CSS responsivo e scroll snap; as setas dos carrosséis rolarão seus respectivos contêineres.
- Preservar a identidade atual: Garet, títulos 600, corpo 400 e botões 700.
- Validar a landing em desktop e celular, incluindo ausência de rolagem horizontal indevida, navegação dos carrosséis, abas e accordion.
