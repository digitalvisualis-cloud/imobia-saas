/**
 * Configuração do site público de cada tenant.
 *
 * Salvo no campo `Site.config` (Json). Define quais PÁGINAS e SEÇÕES estão
 * ativas no site público. O editor `/sites` lê e escreve esse JSON.
 *
 * Quando uma página/seção está `enabled: false`, ela não é renderizada no
 * site público (`/s/[slug]`).
 *
 * Schema versionado: se a gente adicionar novas seções no template, basta
 * fazer merge com o default — seções novas começam ligadas ou desligadas
 * conforme `defaultEnabled`.
 */

export const SITE_CONFIG_VERSION = 1;

export type SectionId =
  | 'hero'
  | 'busca'
  | 'destaques'
  | 'categorias'
  | 'todos-imoveis'
  | 'calculadora'
  | 'depoimentos'
  | 'bio-corretor'
  | 'avaliacao-cta'
  | 'contato-cta';

export type PageId = 'inicio' | 'busca' | 'sobre' | 'avaliacao' | 'contato';

export type SectionConfig = {
  id: SectionId;
  enabled: boolean;
};

export type PageConfig = {
  id: PageId;
  enabled: boolean;
  sections: SectionConfig[];
};

export type SiteConfig = {
  version: number;
  templateId: string; // 'elegance' por enquanto
  pages: PageConfig[];
};

/* ---------- Catálogo (metadata pra UI) ---------- */

export const PAGE_CATALOG: Array<{
  id: PageId;
  label: string;
  description: string;
  icon: string;
  fixed?: boolean; // Início é obrigatória
}> = [
  {
    id: 'inicio',
    label: 'Início',
    description: 'Página principal — vitrine, destaques e busca',
    icon: '🏠',
    fixed: true,
  },
  {
    id: 'busca',
    label: 'Busca de imóveis',
    description: 'Listagem completa com filtros',
    icon: '🔍',
  },
  {
    id: 'sobre',
    label: 'Sobre nós',
    description: 'História da imobiliária + bio dos corretores',
    icon: '👤',
  },
  {
    id: 'avaliacao',
    label: 'Avalie seu imóvel',
    description: 'Formulário pra captar imóveis pra vender',
    icon: '✨',
  },
  {
    id: 'contato',
    label: 'Contato',
    description: 'Formulário + endereço + redes sociais',
    icon: '✉️',
  },
];

export const SECTION_CATALOG: Record<
  SectionId,
  { label: string; description: string; defaultEnabled: boolean; pageHint: PageId[] }
> = {
  hero: {
    label: 'Hero / Vitrine',
    description: 'Capa com imagem, slogan e busca rápida',
    defaultEnabled: true,
    pageHint: ['inicio'],
  },
  busca: {
    label: 'Barra de busca',
    description: 'Filtros visíveis pra qualquer página',
    defaultEnabled: false,
    pageHint: ['inicio', 'busca'],
  },
  destaques: {
    label: 'Imóveis em destaque',
    description: 'Grid dos imóveis marcados como "destaque"',
    defaultEnabled: true,
    pageHint: ['inicio'],
  },
  categorias: {
    label: 'Categorias de imóveis',
    description: 'Cards por tipo (Casa · Apartamento · Cobertura...)',
    defaultEnabled: false,
    pageHint: ['inicio'],
  },
  'todos-imoveis': {
    label: 'Todos os imóveis',
    description: 'Listagem completa paginada',
    defaultEnabled: true,
    pageHint: ['inicio', 'busca'],
  },
  calculadora: {
    label: 'Calculadora de financiamento',
    description: 'Simulador básico de prestações',
    defaultEnabled: false,
    pageHint: ['inicio', 'sobre'],
  },
  depoimentos: {
    label: 'Depoimentos',
    description: 'Carrossel com avaliações de clientes',
    defaultEnabled: false,
    pageHint: ['inicio', 'sobre'],
  },
  'bio-corretor': {
    label: 'Bio do corretor',
    description: 'Foto, nome, CRECI e WhatsApp do corretor',
    defaultEnabled: false,
    pageHint: ['inicio', 'sobre'],
  },
  'avaliacao-cta': {
    label: 'CTA — Avalie seu imóvel',
    description: 'Banner chamando pra cadastrar imóvel pra venda',
    defaultEnabled: false,
    pageHint: ['inicio'],
  },
  'contato-cta': {
    label: 'CTA — Fale conosco',
    description: 'Banner com WhatsApp e endereço',
    defaultEnabled: true,
    pageHint: ['inicio', 'contato'],
  },
};

/* ---------- Default ---------- */

export function getDefaultSiteConfig(): SiteConfig {
  return {
    version: SITE_CONFIG_VERSION,
    templateId: 'elegance',
    pages: [
      {
        id: 'inicio',
        enabled: true,
        sections: [
          { id: 'hero', enabled: true },
          { id: 'destaques', enabled: true },
          { id: 'todos-imoveis', enabled: true },
          { id: 'categorias', enabled: false },
          { id: 'calculadora', enabled: false },
          { id: 'depoimentos', enabled: false },
          { id: 'bio-corretor', enabled: false },
          { id: 'avaliacao-cta', enabled: false },
          { id: 'contato-cta', enabled: true },
        ],
      },
      {
        id: 'busca',
        enabled: true,
        sections: [
          { id: 'busca', enabled: true },
          { id: 'todos-imoveis', enabled: true },
        ],
      },
      {
        id: 'sobre',
        enabled: false,
        sections: [
          { id: 'bio-corretor', enabled: true },
          { id: 'depoimentos', enabled: true },
          { id: 'contato-cta', enabled: true },
        ],
      },
      {
        id: 'avaliacao',
        enabled: false,
        sections: [{ id: 'avaliacao-cta', enabled: true }],
      },
      {
        id: 'contato',
        enabled: false,
        sections: [{ id: 'contato-cta', enabled: true }],
      },
    ],
  };
}

/* ---------- Merge config existente com defaults ---------- */

/**
 * Faz merge de uma config salva no banco com o default — garante que páginas
 * e seções novas (adicionadas em deploys posteriores) apareçam, sem perder
 * o que o cliente já configurou.
 */
export function mergeSiteConfig(saved: unknown): SiteConfig {
  const def = getDefaultSiteConfig();
  if (!saved || typeof saved !== 'object') return def;

  const s = saved as Partial<SiteConfig>;
  const pagesById = new Map(
    (s.pages ?? []).map((p) => [p.id, p] as const),
  );

  return {
    version: SITE_CONFIG_VERSION,
    templateId: s.templateId ?? def.templateId,
    pages: def.pages.map((defPage) => {
      const saved = pagesById.get(defPage.id);
      if (!saved) return defPage;

      const savedSecsById = new Map(
        (saved.sections ?? []).map((sec) => [sec.id, sec] as const),
      );
      const merged: PageConfig = {
        id: defPage.id,
        enabled: typeof saved.enabled === 'boolean' ? saved.enabled : defPage.enabled,
        sections: defPage.sections.map((defSec) => {
          const sv = savedSecsById.get(defSec.id);
          return sv && typeof sv.enabled === 'boolean'
            ? { id: defSec.id, enabled: sv.enabled }
            : defSec;
        }),
      };
      return merged;
    }),
  };
}

/* ---------- Helpers ---------- */

export function pageMeta(id: PageId) {
  return PAGE_CATALOG.find((p) => p.id === id);
}

export function sectionMeta(id: SectionId) {
  return SECTION_CATALOG[id];
}
