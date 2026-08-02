export type SobreDiferencial = { icone: string; titulo: string; descricao: string };

export type SobreConfig = {
  titulo: string;
  subtitulo: string;
  historia: string;
  foto_banner: string;
  fotos_galeria: string[];
  fundacao_ano: number | null;
  cidade: string;
  diferenciais: SobreDiferencial[];
  mostrar_equipe: boolean;
};

export const DEFAULT_SOBRE: SobreConfig = {
  titulo: "Nossa história",
  subtitulo: "Conheça mais sobre a nossa loja",
  historia:
    "Conte aqui a história da sua loja, seus valores e o que te motivou a começar.",
  foto_banner: "",
  fotos_galeria: [],
  fundacao_ano: null,
  cidade: "",
  diferenciais: [
    { icone: "✅", titulo: "Qualidade garantida", descricao: "Produtos selecionados com cuidado para você." },
    { icone: "🚚", titulo: "Entrega rápida", descricao: "Enviamos para todo o Brasil." },
    { icone: "💬", titulo: "Atendimento humano", descricao: "Fale diretamente com nossa equipe." },
    { icone: "🔄", titulo: "Troca fácil", descricao: "30 dias para troca sem complicação." },
  ],
  mostrar_equipe: true,
};

export function mergeSobre(raw: unknown): SobreConfig {
  const cfg = (raw ?? {}) as Partial<SobreConfig>;
  return {
    ...DEFAULT_SOBRE,
    ...cfg,
    fotos_galeria: Array.isArray(cfg.fotos_galeria) ? cfg.fotos_galeria.filter(Boolean) : [],
    diferenciais: Array.isArray(cfg.diferenciais) ? cfg.diferenciais : DEFAULT_SOBRE.diferenciais,
  };
}
