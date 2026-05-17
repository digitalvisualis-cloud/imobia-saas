// Tipos compartilhados do gerador de posts.

export type FormatoPost = 'SQUARE' | 'VERTICAL' | 'STORY' | 'CARROSSEL';

export interface FormatoConfig {
  id: FormatoPost;
  label: string;
  description: string;
  width: number;
  height: number;
  slides: number; // carrossel = 4
}

export interface ImovelData {
  id: string;
  titulo: string;
  operacao: 'VENDA' | 'ALUGUEL';
  preco: number;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  codigo: string | null;
  descricao: string | null;
  imagens: string[];
}

export interface MarcaData {
  id: string;
  nome_empresa: string;
  whatsapp: string | null;
  site: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  logo_url: string | null;
}

export interface FontPair {
  id: string;
  label: string;
  display: string;
  body: string;
  cssDisplay: string;
  cssBody: string;
}

export interface ColorPalette {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  surface: string;
  ink: string;
}

export interface Customizacao {
  paletteId: string;
  fontPairId: string;
  primary: string;
  secondary: string;
  surface: string;
  ink: string;
  ctaText: string;
  headlineOverride?: string;
  showLogo: boolean;
  showTitle: boolean;
  showPrice: boolean;
  showSpecs: boolean;
  showCTA: boolean;
  showContact: boolean;
}

export interface TemplateProps {
  imovel: ImovelData;
  marca: MarcaData;
  formato: FormatoConfig;
  customizacao: Customizacao;
  slideIndex?: number; // pra carrossel
}

export interface PostTemplateMeta {
  id: string;
  nome: string;
  vibe: string;
  formatosSuportados: FormatoPost[];
  Component: React.ComponentType<TemplateProps>;
}
