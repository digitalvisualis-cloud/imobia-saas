// Tipos compartilhados pelos componentes de Criador de Posts.
// Adaptados da arquitetura do lovable mas com a shape do nosso Prisma.

// Os 20 IDs novos (p1..p20) vem do visual-lab; os legados (ia, clean,
// minimal, etc) ficam pra compat com posts ja gerados.
export type TemplateVariant =
  // Legados
  | 'ia'
  | 'clean'
  | 'borda'
  | 'premium'
  | 'minimal'
  | 'magazine'
  | 'split'
  | 'dark'
  | 'tag'
  | 'polaroid'
  | 'listing'
  | 'luxegold'
  | 'showcase'
  // Lab v2 — 20 templates do CATALOGO_TEMPLATES_POSTS.md
  | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  | 'p6' | 'p7' | 'p8' | 'p9' | 'p10'
  | 'p11' | 'p12' | 'p13' | 'p14' | 'p15'
  | 'p16' | 'p17' | 'p18' | 'p19' | 'p20';

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
  // 20 templates do visual-lab (CATALOGO_TEMPLATES_POSTS.md) — primeiro
  // na lista pra serem a opcao default no picker.
  { id: 'p1', nome: 'Barra Técnica Clean', descricao: 'Foto full bleed com barra creme inferior' },
  { id: 'p2', nome: 'Listing Glass Premium', descricao: 'Painel glass com preço e localização' },
  { id: 'p3', nome: 'Diagonal Modern Home', descricao: 'Diagonal clara com mini galeria' },
  { id: 'p4', nome: 'Bolhas Luxury Tour', descricao: 'Fotos circulares + CTA gold' },
  { id: 'p5', nome: 'Disponível Dark', descricao: 'Foto + bloco preto premium' },
  { id: 'p6', nome: 'Contato Soft Blur', descricao: 'Fundo blur para captação' },
  { id: 'p7', nome: 'Entrada Zero Impacto', descricao: 'Headline laranja grande' },
  { id: 'p8', nome: 'Faixa Amarela Vertical', descricao: 'Faixa técnica amarela vertical' },
  { id: 'p9', nome: 'Minimal Living', descricao: 'Editorial com muito respiro' },
  { id: 'p10', nome: 'Dream Homes Luxury', descricao: 'Black/gold com mini galeria' },
  { id: 'p11', nome: 'Ficha Creme Horizontal', descricao: 'Variação creme técnica' },
  { id: 'p12', nome: 'Painel Vidro Alto Padrão', descricao: 'Glass alto padrão' },
  { id: 'p13', nome: 'Galeria Lateral', descricao: 'Mini galeria lateral + headline' },
  { id: 'p14', nome: 'Gold Label Tour', descricao: 'CTA pill com painel escuro' },
  { id: 'p15', nome: 'Preço Central', descricao: 'Preço como foco principal' },
  { id: 'p16', nome: 'Busca Contato', descricao: 'Lead/contato blur' },
  { id: 'p17', nome: 'Chamada Forte Laranja', descricao: 'Urgência laranja' },
  { id: 'p18', nome: 'Card Amarelo Técnico', descricao: 'Specs em faixa amarela' },
  { id: 'p19', nome: 'Minimal Editorial', descricao: 'Editorial leve' },
  { id: 'p20', nome: 'Capa Carrossel Premium', descricao: 'Capa black/gold pra carrossel' },
  // Legados (compat — posts antigos ainda usam estes IDs)
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
  { id: 'listing', nome: 'New Listing', descricao: 'Card translucido com endereco + preco' },
  { id: 'luxegold', nome: 'Luxe Gold', descricao: 'Card escuro dourado + selo NEW LISTING' },
  { id: 'showcase', nome: 'Showcase', descricao: 'Card branco bottom estilo flyer' },
];

export const FORMATOS = [
  // Novo formato padrao do Instagram (4:5) — substitui o antigo 1:1 que perdeu prioridade no feed.
  // Mantemos o id 'feed-square' por compatibilidade com posts ja salvos.
  { id: 'feed-square', nome: 'Post do Instagram', dim: '1080x1350', tipo: 'INSTAGRAM_FEED', carrossel: false, ratio: '4/5' as const },
  { id: 'story', nome: 'Story do Instagram', dim: '1080x1920', tipo: 'INSTAGRAM_STORIES', carrossel: false, ratio: '9/16' as const },
  { id: 'feed-carrossel', nome: 'Carrossel do Instagram', dim: '1080x1350', tipo: 'INSTAGRAM_FEED', carrossel: true, ratio: '4/5' as const, hint: 'multiplos cards' },
  { id: 'story-carrossel', nome: 'Carrossel de Stories', dim: '1080x1920', tipo: 'INSTAGRAM_STORIES', carrossel: true, ratio: '9/16' as const, hint: 'multiplos cards' },
  // Quadrado serve tanto pro Facebook quanto pro Instagram (compat. legado).
  { id: 'facebook-square', nome: 'Post quadrado (FB / IG)', dim: '1080x1080', tipo: 'INSTAGRAM_FEED', carrossel: false, ratio: '1/1' as const },
];

/** Resolve o ratio do PostPreview a partir do id do formato salvo no banco. */
export function ratioFromFormato(formato: string | undefined | null): '1/1' | '4/5' | '9/16' {
  if (!formato) return '4/5';
  const f = FORMATOS.find((x) => x.id === formato);
  return f?.ratio ?? (formato.includes('story') ? '9/16' : '4/5');
}

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
