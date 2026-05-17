import type { PostTemplate } from './types';
import { CleanTemplate } from './Clean';
import { BordaTemplate } from './Borda';
import { PremiumTemplate } from './Premium';
import {
  T01_BarraTecnicaClean,
  T02_ListingGlassPremium,
  T03_DiagonalModernHome,
  T04_BolhasLuxuryTour,
  T05_DisponivelDark,
  T06_ContatoSoftBlur,
  T07_EntradaZeroImpacto,
  T08_FaixaAmarelaVertical,
  T09_MinimalLiving,
  T10_DreamHomesLuxury,
  T11_FichaCremeHorizontal,
  T12_PainelVidroAltoPadrao,
  T13_GaleriaLateral,
  T14_GoldLabelTour,
  T15_PrecoCentral,
  T16_BuscaContato,
  T17_ChamadaForteLaranja,
  T18_CardAmareloTecnico,
  T19_MinimalEditorial,
  T20_CapaCarrosselPremium,
} from './lab-templates';

/**
 * Registry dos templates de post.
 *
 * Os 20 templates `p1..p20` vem do visual-lab aprovado pelo cliente
 * (IMOBIA_VISUAL_HANDOFF_CLAUDE/visual-lab/styles.css). Cada um eh um
 * wrapper fino do PostShell — o CSS .pN em lab-posts.css define a
 * personalidade visual.
 *
 * Templates legados (Clean/Borda/Premium) mantidos pra compatibilidade
 * com posts ja gerados no banco.
 */
export const POST_TEMPLATES: PostTemplate[] = [
  // === 20 templates do visual-lab (CATALOGO_TEMPLATES_POSTS.md) ===
  {
    id: 'p1',
    nome: 'Barra Técnica Clean',
    descricao: 'Foto full bleed com barra creme inferior',
    vibe: 'Clean · Técnico',
    Component: T01_BarraTecnicaClean,
  },
  {
    id: 'p2',
    nome: 'Listing Glass Premium',
    descricao: 'Painel glass com preço e localização',
    vibe: 'Premium · Editorial',
    Component: T02_ListingGlassPremium,
  },
  {
    id: 'p3',
    nome: 'Diagonal Modern Home',
    descricao: 'Diagonal clara com mini galeria',
    vibe: 'Moderno · Galeria',
    Component: T03_DiagonalModernHome,
  },
  {
    id: 'p4',
    nome: 'Bolhas Luxury Tour',
    descricao: 'Fotos circulares + CTA gold',
    vibe: 'Luxury · Tour',
    Component: T04_BolhasLuxuryTour,
  },
  {
    id: 'p5',
    nome: 'Disponível Dark',
    descricao: 'Foto + bloco preto premium',
    vibe: 'Premium · Dark',
    Component: T05_DisponivelDark,
  },
  {
    id: 'p6',
    nome: 'Contato Soft Blur',
    descricao: 'Fundo blur para captação',
    vibe: 'Contato · Captação',
    Component: T06_ContatoSoftBlur,
  },
  {
    id: 'p7',
    nome: 'Entrada Zero Impacto',
    descricao: 'Headline laranja grande',
    vibe: 'Urgência · Oferta',
    Component: T07_EntradaZeroImpacto,
  },
  {
    id: 'p8',
    nome: 'Faixa Amarela Vertical',
    descricao: 'Faixa técnica amarela vertical',
    vibe: 'Oportunidade · Técnico',
    Component: T08_FaixaAmarelaVertical,
  },
  {
    id: 'p9',
    nome: 'Minimal Living',
    descricao: 'Editorial com muito respiro',
    vibe: 'Minimal · Editorial',
    Component: T09_MinimalLiving,
  },
  {
    id: 'p10',
    nome: 'Dream Homes Luxury',
    descricao: 'Black/gold com mini galeria',
    vibe: 'Luxury · Black/Gold',
    Component: T10_DreamHomesLuxury,
  },
  {
    id: 'p11',
    nome: 'Ficha Creme Horizontal',
    descricao: 'Variação creme técnica',
    vibe: 'Técnico · Creme',
    Component: T11_FichaCremeHorizontal,
  },
  {
    id: 'p12',
    nome: 'Painel Vidro Alto Padrão',
    descricao: 'Glass alto padrão',
    vibe: 'Alto padrão · Premium',
    Component: T12_PainelVidroAltoPadrao,
  },
  {
    id: 'p13',
    nome: 'Galeria Lateral',
    descricao: 'Mini galeria lateral + headline',
    vibe: 'Galeria · Editorial',
    Component: T13_GaleriaLateral,
  },
  {
    id: 'p14',
    nome: 'Gold Label Tour',
    descricao: 'CTA pill com painel escuro',
    vibe: 'Luxury · Tour',
    Component: T14_GoldLabelTour,
  },
  {
    id: 'p15',
    nome: 'Preço Central',
    descricao: 'Preço como foco principal',
    vibe: 'Preço · Foco',
    Component: T15_PrecoCentral,
  },
  {
    id: 'p16',
    nome: 'Busca Contato',
    descricao: 'Lead/contato blur',
    vibe: 'Captação · Contato',
    Component: T16_BuscaContato,
  },
  {
    id: 'p17',
    nome: 'Chamada Forte Laranja',
    descricao: 'Urgência laranja',
    vibe: 'Urgência · Forte',
    Component: T17_ChamadaForteLaranja,
  },
  {
    id: 'p18',
    nome: 'Card Amarelo Técnico',
    descricao: 'Specs em faixa amarela',
    vibe: 'Técnico · Amarelo',
    Component: T18_CardAmareloTecnico,
  },
  {
    id: 'p19',
    nome: 'Minimal Editorial',
    descricao: 'Editorial leve',
    vibe: 'Editorial · Leve',
    Component: T19_MinimalEditorial,
  },
  {
    id: 'p20',
    nome: 'Capa Carrossel Premium',
    descricao: 'Capa black/gold pra carrossel',
    vibe: 'Carrossel · Premium',
    Component: T20_CapaCarrosselPremium,
  },

  // === Legados (compat com posts antigos no banco) ===
  {
    id: 'clean',
    nome: 'Clean',
    descricao: 'Foto cheia + barra inferior com preço',
    vibe: 'Direto · Moderno',
    Component: CleanTemplate,
  },
  {
    id: 'borda',
    nome: 'Borda',
    descricao: 'Fundo branco com moldura colorida da marca',
    vibe: 'Boutique · Sofisticado',
    Component: BordaTemplate,
  },
  {
    id: 'premium',
    nome: 'Premium',
    descricao: 'Header colorido + foto + bloco escuro com preço',
    vibe: 'Lançamento · Alto padrão',
    Component: PremiumTemplate,
  },
];

export function getTemplate(id: string): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.id === id);
}
