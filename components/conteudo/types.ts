// Tipos compartilhados pelos componentes de Criador de Posts.
// Adaptados da arquitetura do lovable mas com a shape do nosso Prisma.

export type TemplateVariant =
  | 'ia'
  | 'clean'
  | 'borda'
  | 'premium'
  | 'minimal'
  | 'magazine'
  | 'split'
  | 'dark'
  | 'tag'
  | 'polaroid';

export interface ImovelLite {
  id: string;
  codigo: string;
  titulo: string;
  capaUrl: string | null;
  imagens: string[];
  cidade: string;
  estado: string;
  bairro: string | null;
  tipo: string;
  operacao: string;
  preco: number;
  areaM2: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  publicado: boolean;
  postsCount: number;
}

export interface Customizacao {
  corPrincipal: string;
  corTexto: string;
  fonte: string;
  logoUrl: string | null;
}

export interface PostLite {
  id: string;
  imovelId: string;
  /** TipoPost do Prisma (INSTAGRAM_FEED, INSTAGRAM_STORIES, WHATSAPP, FICHA_PDF). */
  tipo: string;
  /** Variante visual escolhida ao gerar (ia, clean, premium...). */
  template: TemplateVariant;
  /** ID do formato (feed-square, story, feed-carrossel, story-carrossel, facebook-square). */
  formato: string;
  imageUrl: string | null;
  legenda: string;
  carrossel: boolean;
  createdAt: string;
}

export const TEMPLATES: Array<{
  id: TemplateVariant;
  nome: string;
  descricao: string;
}> = [
  { id: 'ia', nome: 'IA Vibrante', descricao: 'Gradiente colorido sobre foto' },
  { id: 'clean', nome: 'Clean', descricao: 'Card branco minimalista' },
  { id: 'borda', nome: 'Moldura', descricao: 'Borda com faixa de preço' },
  { id: 'premium', nome: 'Premium', descricao: 'Sofisticado e escuro' },
  { id: 'minimal', nome: 'Minimal', descricao: 'Foto cheia + tag preço' },
  { id: 'magazine', nome: 'Magazine', descricao: 'Estilo editorial' },
  { id: 'split', nome: 'Split', descricao: 'Metade foto, metade cor' },
  { id: 'dark', nome: 'Dark Mode', descricao: 'Fundo escuro elegante' },
  { id: 'tag', nome: 'Tag', descricao: 'Etiqueta diagonal sobre foto' },
  { id: 'polaroid', nome: 'Polaroid', descricao: 'Inspirado em polaroide' },
];

export const FORMATOS = [
  // Novo formato padrao do Instagram (4:5) — substitui o antigo 1:1 que perdeu prioridade no feed.
  // Mantemos o id 'feed-square' por compatibilidade com posts ja salvos.
  { id: 'feed-square', nome: 'Post do Instagram', dim: '1080x1350', tipo: 'INSTAGRAM_FEED', carrossel: false, ratio: '4/5' as const },
  { id: 'story', nome: 'Story do Instagram', dim: '1080x1920', tipo: 'INSTAGRAM_STORIES', carrossel: false, ratio: '9/16' as const },
  { id: 'feed-carrossel', nome: 'Carrossel do Instagram', dim: '1080x1350', tipo: 'INSTAGRAM_FEED', carrossel: true, ratio: '4/5' as const, hint: 'multiplos cards' },
  { id: 'story-carrossel', nome: 'Carrossel de Stories', dim: '1080x1920', tipo: 'INSTAGRAM_STORIES', carrossel: true, ratio: '9/16' as const, hint: 'multiplos cards' },
  { id: 'facebook-square', nome: 'Post do Facebook', dim: '1080x1080', tipo: 'INSTAGRAM_FEED', carrossel: false, ratio: '1/1' as const },
];

/** Mapeia tipo enum (CASA, APARTAMENTO...) pra label legível. */
export const TIPO_LABEL: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  CHACARA: 'Chácara',
  SITIO: 'Sítio',
};
