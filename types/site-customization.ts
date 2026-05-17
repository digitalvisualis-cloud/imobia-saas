/**
 * Sistema de customização de site (tema + conteúdo + estilo).
 *
 * Salvo em `Site.config` (JSON). O editor lê e escreve esse formato.
 * Renderizado em `/s/[slug]` (público) e `/dashboard/sites` (editor com preview).
 */

export type ThemeId = 'brisa' | 'aura' | 'onyx';

export type SectionId =
  | 'hero'
  | 'destaques'
  | 'categorias'
  | 'sobre'
  | 'depoimentos'
  | 'faq'
  | 'cta'
  | 'blog'
  | 'contato';

export interface SectionConfig {
  id: SectionId;
  label: string;
  visible: boolean;
}

export interface FontPair {
  heading: string;
  body: string;
}

export interface NavLink {
  label: string;
  to: string;
}

export interface HeaderConfig {
  brandName: string;
  links: NavLink[];
  ctaLabel: string;
  ctaHref: string;
}

export interface HeroConfig {
  /** URL da imagem de fundo do hero. Vazio = usa a foto do primeiro imóvel
   * em destaque (fallback que vinha sendo padrão). */
  imageUrl: string;
}

export interface SocialConfig {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}

export interface SeoConfig {
  title: string;
  description: string;
}

export interface Customization {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
  fonts: FontPair;
  sections: SectionConfig[];
  header: HeaderConfig;
  hero: HeroConfig;
  social: SocialConfig;
  seo: SeoConfig;
}

export const FONT_OPTIONS = [
  { name: 'Inter', stack: '"Inter", system-ui, sans-serif' },
  { name: 'Manrope', stack: '"Manrope", system-ui, sans-serif' },
  { name: 'Poppins', stack: '"Poppins", system-ui, sans-serif' },
  { name: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif' },
  { name: 'Playfair Display', stack: '"Playfair Display", Georgia, serif' },
  { name: 'Cormorant Garamond', stack: '"Cormorant Garamond", Georgia, serif' },
  { name: 'DM Serif Display', stack: '"DM Serif Display", Georgia, serif' },
  { name: 'Fraunces', stack: '"Fraunces", Georgia, serif' },
] as const;

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Banner — Busca de imóveis', visible: true },
  { id: 'destaques', label: 'Vitrine — Imóveis em destaque', visible: true },
  { id: 'categorias', label: 'Bairros / Regiões', visible: true },
  { id: 'sobre', label: 'Bio do corretor', visible: true },
  { id: 'depoimentos', label: 'Depoimentos de clientes', visible: true },
  { id: 'faq', label: 'Perguntas frequentes', visible: false },
  { id: 'cta', label: 'Chamada — Anuncie seu imóvel', visible: true },
  { id: 'blog', label: 'Blog — Artigos recentes', visible: true },
  { id: 'contato', label: 'Newsletter / Contato', visible: true },
];

const COMMON_HEADER: HeaderConfig = {
  brandName: 'Sua Imobiliária',
  links: [
    { label: 'Início', to: '/' },
    { label: 'Comprar', to: '/?op=venda' },
    { label: 'Alugar', to: '/?op=aluguel' },
    { label: 'Anuncie seu imóvel', to: '/#anuncie' },
    { label: 'Sobre', to: '/#sobre' },
  ],
  ctaLabel: 'Fale conosco',
  ctaHref: '#contato',
};

const COMMON_SOCIAL: SocialConfig = {
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: '',
};

const COMMON_HERO: HeroConfig = {
  imageUrl: '',
};

// Palettes derivadas do visual-lab aprovado:
// IMOBIA_VISUAL_HANDOFF_CLAUDE/visual-lab/styles.css (linhas 512-647)
export const DEFAULTS: Record<ThemeId, Customization> = {
  brisa: {
    colors: {
      primary: '#187a57',       // forest green (theme-accent)
      secondary: '#d9f0e3',     // soft mint (theme-band)
      background: '#f7faf8',    // off-white quase-mint
      foreground: '#143226',    // dark forest
    },
    fonts: { heading: 'Fraunces', body: 'Inter' },
    sections: DEFAULT_SECTIONS,
    header: { ...COMMON_HEADER },
    hero: { ...COMMON_HERO },
    social: { ...COMMON_SOCIAL },
    seo: {
      title: 'Encontre seu próximo lar',
      description: 'Imóveis com curadoria e atendimento humano.',
    },
  },
  aura: {
    colors: {
      primary: '#aa7c42',       // warm gold/brown
      secondary: '#111318',     // deep dark (theme-band)
      background: '#fbfbf8',    // bege off-white
      foreground: '#101114',    // near black
    },
    fonts: { heading: 'DM Serif Display', body: 'Manrope' },
    sections: DEFAULT_SECTIONS,
    header: { ...COMMON_HEADER, ctaLabel: 'Agendar visita' },
    hero: { ...COMMON_HERO },
    social: { ...COMMON_SOCIAL },
    seo: {
      title: 'Coleção de propriedades únicas',
      description: 'Curadoria editorial de imóveis de alto padrão.',
    },
  },
  onyx: {
    colors: {
      primary: '#d7ae5e',       // warm gold (lab) — antes era #FCB828
      secondary: '#0f1115',     // band dark
      background: '#ffffff',
      foreground: '#0f1115',
    },
    fonts: { heading: 'Playfair Display', body: 'Inter' },
    sections: DEFAULT_SECTIONS,
    header: { ...COMMON_HEADER, ctaLabel: 'Área do Cliente' },
    hero: { ...COMMON_HERO },
    social: { ...COMMON_SOCIAL },
    seo: {
      title: 'Imóveis de alto luxo',
      description: 'Excelência em curadoria de imóveis premium.',
    },
  },
};

export const THEME_META: Record<
  ThemeId,
  { id: ThemeId; nome: string; descricao: string; vibe: string; preview: string }
> = {
  brisa: {
    id: 'brisa',
    nome: 'Brisa',
    descricao: 'Warm, residencial, acolhedor. Tipografia serif suave + cores naturais.',
    vibe: 'Imobiliária boutique · Famílias',
    preview: 'linear-gradient(135deg, #2F6F4E 0%, #E8C875 100%)',
  },
  aura: {
    id: 'aura',
    nome: 'Aura',
    descricao: 'Editorial, premium, off-market. Tipografia editorial + paleta noir.',
    vibe: 'Alto padrão · Off-market',
    preview: 'linear-gradient(135deg, #0F1115 0%, #C8A97E 100%)',
  },
  onyx: {
    id: 'onyx',
    nome: 'Onyx',
    descricao: 'Denso, premium, alto luxo. Tipografia serif + paleta preto/dourado. Search compacto.',
    vibe: 'Imóveis de alto luxo · Boutique',
    preview: 'linear-gradient(135deg, #0A0A0A 0%, #D4A45E 100%)',
  },
};

export function mergeCustomization(
  theme: ThemeId,
  saved: unknown,
): Customization {
  const def = DEFAULTS[theme];
  if (!saved || typeof saved !== 'object') return def;
  const s = saved as Partial<Customization>;

  // Merge das seções: preserva a ordem salva, adiciona seções novas no final
  const savedSections = Array.isArray(s.sections) ? s.sections : [];
  const sectionMap = new Map(savedSections.map((sec) => [sec.id, sec]));
  const merged: SectionConfig[] = [];
  // Primeiro, na ordem salva
  for (const sec of savedSections) {
    const defSec = def.sections.find((d) => d.id === sec.id);
    if (defSec) merged.push({ ...defSec, ...sec });
  }
  // Depois, seções novas que não estavam salvas
  for (const defSec of def.sections) {
    if (!sectionMap.has(defSec.id)) merged.push(defSec);
  }

  return {
    colors: { ...def.colors, ...(s.colors ?? {}) },
    fonts: { ...def.fonts, ...(s.fonts ?? {}) },
    sections: merged.length > 0 ? merged : def.sections,
    header: { ...def.header, ...(s.header ?? {}) },
    hero: { ...def.hero, ...(s.hero ?? {}) },
    social: { ...def.social, ...(s.social ?? {}) },
    seo: { ...def.seo, ...(s.seo ?? {}) },
  };
}
