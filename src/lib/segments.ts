// Grouped segment list for store signup dropdown
export const SEGMENT_GROUPS: Array<{ label: string; items: string[] }> = [
  {
    label: "Moda e Vestuário",
    items: [
      "Moda Feminina", "Moda Masculina", "Moda Infantil / Kids",
      "Moda Íntima e Lingerie", "Moda Praia / Beachwear", "Moda Plus Size",
      "Moda Fitness / Esportiva", "Moda Evangélica", "Moda Sustentável",
      "Roupas em Geral",
    ],
  },
  {
    label: "Calçados e Acessórios",
    items: [
      "Calçados Femininos", "Calçados Masculinos", "Calçados Infantis",
      "Bolsas e Carteiras", "Cintos e Acessórios de Couro",
      "Bijuterias e Semijoias", "Joias e Relógios", "Óculos e Acessórios",
    ],
  },
  {
    label: "Beleza e Cuidados Pessoais",
    items: [
      "Cosméticos e Maquiagem", "Perfumaria", "Cuidados com o Cabelo",
      "Cuidados com a Pele", "Produtos Naturais e Orgânicos",
      "Higiene Pessoal", "Nail Art e Unhas", "Barbearia",
    ],
  },
  {
    label: "Casa e Decoração",
    items: [
      "Decoração de Interiores", "Móveis e Utilidades", "Cama, Mesa e Banho",
      "Organização e Armazenamento", "Iluminação", "Plantas e Jardim",
      "Arte e Quadros", "Itens Religiosos e Esotéricos",
    ],
  },
  {
    label: "Alimentação e Bebidas",
    items: [
      "Alimentos Artesanais", "Doces e Confeitaria", "Bolos e Tortas",
      "Chocolates e Guloseimas", "Bebidas", "Produtos Diet e Fit",
      "Temperos e Condimentos", "Orgânicos e Naturais",
    ],
  },
  {
    label: "Tecnologia e Eletrônicos",
    items: [
      "Smartphones e Acessórios", "Informática", "Games e Consoles",
      "Eletrônicos em Geral", "Smartwatches e Wearables",
      "Fotografia e Filmagem",
    ],
  },
  {
    label: "Esportes e Lazer",
    items: [
      "Artigos Esportivos", "Suplementos e Nutrição Esportiva",
      "Outdoor e Aventura", "Camping e Pesca", "Yoga e Meditação",
      "Ciclismo", "Natação e Aquático",
    ],
  },
  {
    label: "Saúde e Bem-estar",
    items: [
      "Suplementos e Vitaminas", "Produtos para Gestantes",
      "Produtos para Bebês", "Equipamentos para Saúde",
      "Aromaterapia e Óleos Essenciais",
    ],
  },
  {
    label: "Pet Shop",
    items: [
      "Ração e Petiscos", "Acessórios para Pets", "Roupas para Pets",
      "Produtos de Higiene para Pets", "Brinquedos para Pets",
    ],
  },
  {
    label: "Infantil e Brinquedos",
    items: [
      "Brinquedos Educativos", "Brinquedos em Geral", "Artigos para Bebês",
      "Enxoval de Bebê", "Papelaria Infantil", "Fantasias e Adereços",
    ],
  },
  {
    label: "Papelaria e Arte",
    items: [
      "Papelaria Personalizada", "Material Escolar", "Arte e Artesanato",
      "Produtos para Scrapbook", "Carimbos e Stickers",
    ],
  },
  {
    label: "Automotivo",
    items: [
      "Acessórios para Carros", "Moto e Acessórios",
      "Cuidados Automotivos", "GPS e Rastreadores",
    ],
  },
  {
    label: "Serviços e Produtos Digitais",
    items: [
      "Cursos Online", "E-books", "Templates e Artes",
      "Consultorias", "Infoprodutos", "Assinaturas",
    ],
  },
  {
    label: "Artesanato e Produtos Handmade",
    items: [
      "Crochê e Tricô", "Bordado e Costura", "Madeira e Marcenaria",
      "Cerâmica e Argila", "Produtos Personalizados",
      "Presentes Corporativos",
    ],
  },
  {
    label: "Noivas e Festas",
    items: [
      "Artigos para Festas", "Lembrancinhas", "Decoração de Festas",
      "Artigos para Noivas", "Convites e Papelaria de Festas",
    ],
  },
  {
    label: "Outros",
    items: ["Loja Multimarcas", "Loja Geral", "Outro segmento"],
  },
];

export const ALL_SEGMENTS: string[] = SEGMENT_GROUPS.flatMap((g) => g.items);
