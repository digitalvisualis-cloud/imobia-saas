/**
 * Sistema de customização de site (tema + conteúdo + estilo).
 *
 * Salvo em `Site.config` (JSON). O editor lê e escreve esse formato.
 * Renderizado em `/s/[slug]` (público) e `/dashboard/sites` (editor com preview).
 */

export type ThemeId = 'brisa' | 'aura';

export type SectionId =
  | 'hero'
  | 'destaques'
  | 'categorias'
  | 'sobre'
  | 'depoimentos'
  | 'faq'
  | 'cta'
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
  { id: 'contato', label: 'Newsletter / Contato', visible: true },
];

const COMMON_HEADER: HeaderConfig = {
  brandName: 'Sua Imobiliária',
  links: [
    { label: 'Início', to: '/' },
    { label: 'Comprar', to: '/comprar' },
    { label: 'Alugar', to: '/alugar' },
    { label: 'Sobre', to: '/sobre' },
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

export const DEFAULTS: Record<ThemeId, Customization> = {
  brisa: {
    colors: {
      primary: '#2F6F4E',
      secondary: '#E8C875',
      background: '#FAF7F2',
      foreground: '#1B2A22',
    },
    fonts: { heading: 'Fraunces', body: 'Inter' },
    sections: DEFAULT_SECTIONS,
    header: { ...COMMON_HEADER },
    social: { ...COMMON_SOCIAL },
    seo: {
      title: 'Encontre seu próximo lar',
      description: 'Imóveis com curadoria e atendimento humano.',
    },
  },
  aura: {
    colors: {
      primary: '#0F1115',
      secondary: '#C8A97E',
      background: '#F5F3EE',
      foreground: '#0F1115',
    },
    fonts: { heading: 'DM Serif Display', body: 'Manrope' },
    sections: DEFAULT_SECTIONS,
    header: { ...COMMON_HEADER, ctaLabel: 'Agendar visita' },
    social: { ...COMMON_SOCIAL },
    seo: {
      title: 'Coleção de propriedades únicas',
      description: 'Curadoria editorial de imóveis de alto padrão.',
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
    social: { ...def.social, ...(s.social ?? {}) },
    seo: { ...def.seo, ...(s.seo ?? {}) },
  };
}
