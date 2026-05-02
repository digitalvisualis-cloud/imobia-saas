'use client';

import { create } from 'zustand';
import {
  DEFAULTS,
  type Customization,
  type HeaderConfig,
  type NavLink,
  type SectionConfig,
  type SectionId,
  type SeoConfig,
  type SocialConfig,
  type ThemeId,
} from '@/types/site-customization';

/**
 * Store do editor de site. Mantém o estado por tema (brisa/aura) — o usuário
 * pode editar os dois e só salva quando escolhe um. NÃO persiste no localStorage:
 * a fonte da verdade é o banco; o store é hidratado no mount com o config salvo.
 */
interface State {
  byTheme: Record<ThemeId, Customization>;
  activeTheme: ThemeId;
  panelOpen: boolean;
  dirty: boolean;

  // hidrata do banco
  hydrate: (theme: ThemeId, config: Customization) => void;
  setActiveTheme: (theme: ThemeId) => void;
  markSaved: () => void;

  // estilo
  setColor: (theme: ThemeId, key: keyof Customization['colors'], value: string) => void;
  setFont: (theme: ThemeId, key: 'heading' | 'body', value: string) => void;

  // seções
  toggleSection: (theme: ThemeId, id: SectionId) => void;
  reorderSections: (theme: ThemeId, activeId: SectionId, overId: SectionId) => void;

  // header
  setBrandName: (theme: ThemeId, name: string) => void;
  setCta: (theme: ThemeId, key: keyof Pick<HeaderConfig, 'ctaLabel' | 'ctaHref'>, value: string) => void;
  updateLink: (theme: ThemeId, index: number, link: Partial<NavLink>) => void;
  addLink: (theme: ThemeId) => void;
  removeLink: (theme: ThemeId, index: number) => void;

  // config
  setSocial: (theme: ThemeId, key: keyof SocialConfig, value: string) => void;
  setSeo: (theme: ThemeId, key: keyof SeoConfig, value: string) => void;

  // util
  resetTheme: (theme: ThemeId) => void;
  setPanelOpen: (v: boolean) => void;
}

export const useSiteStore = create<State>()((set) => ({
  byTheme: { brisa: DEFAULTS.brisa, aura: DEFAULTS.aura },
  activeTheme: 'brisa',
  panelOpen: true,
  dirty: false,

  hydrate: (theme, config) =>
    set((s) => ({
      byTheme: { ...s.byTheme, [theme]: config },
      dirty: false,
    })),

  setActiveTheme: (theme) => set({ activeTheme: theme, dirty: true }),
  markSaved: () => set({ dirty: false }),

  setColor: (theme, key, value) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], colors: { ...s.byTheme[theme].colors, [key]: value } },
      },
    })),
  setFont: (theme, key, value) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], fonts: { ...s.byTheme[theme].fonts, [key]: value } },
      },
    })),

  toggleSection: (theme, id) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: {
          ...s.byTheme[theme],
          sections: s.byTheme[theme].sections.map((sec) =>
            sec.id === id ? { ...sec, visible: !sec.visible } : sec,
          ),
        },
      },
    })),
  reorderSections: (theme, activeId, overId) =>
    set((s) => {
      if (activeId === overId) return s;
      const arr: SectionConfig[] = [...s.byTheme[theme].sections];
      const from = arr.findIndex((x) => x.id === activeId);
      const to = arr.findIndex((x) => x.id === overId);
      if (from < 0 || to < 0) return s;
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return {
        dirty: true,
        byTheme: { ...s.byTheme, [theme]: { ...s.byTheme[theme], sections: arr } },
      };
    }),

  setBrandName: (theme, name) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], header: { ...s.byTheme[theme].header, brandName: name } },
      },
    })),
  setCta: (theme, key, value) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], header: { ...s.byTheme[theme].header, [key]: value } },
      },
    })),
  updateLink: (theme, index, link) =>
    set((s) => {
      const links = [...s.byTheme[theme].header.links];
      links[index] = { ...links[index], ...link };
      return {
        dirty: true,
        byTheme: {
          ...s.byTheme,
          [theme]: { ...s.byTheme[theme], header: { ...s.byTheme[theme].header, links } },
        },
      };
    }),
  addLink: (theme) =>
    set((s) => {
      const links = [...s.byTheme[theme].header.links, { label: 'Novo link', to: '/' }];
      return {
        dirty: true,
        byTheme: {
          ...s.byTheme,
          [theme]: { ...s.byTheme[theme], header: { ...s.byTheme[theme].header, links } },
        },
      };
    }),
  removeLink: (theme, index) =>
    set((s) => {
      const links = s.byTheme[theme].header.links.filter((_, i) => i !== index);
      return {
        dirty: true,
        byTheme: {
          ...s.byTheme,
          [theme]: { ...s.byTheme[theme], header: { ...s.byTheme[theme].header, links } },
        },
      };
    }),

  setSocial: (theme, key, value) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], social: { ...s.byTheme[theme].social, [key]: value } },
      },
    })),
  setSeo: (theme, key, value) =>
    set((s) => ({
      dirty: true,
      byTheme: {
        ...s.byTheme,
        [theme]: { ...s.byTheme[theme], seo: { ...s.byTheme[theme].seo, [key]: value } },
      },
    })),

  resetTheme: (theme) =>
    set((s) => ({ dirty: true, byTheme: { ...s.byTheme, [theme]: DEFAULTS[theme] } })),
  setPanelOpen: (v) => set({ panelOpen: v }),
}));

export function useThemeConfig(theme: ThemeId): Customization {
  return useSiteStore((s) => s.byTheme[theme]);
}
