import type { ColorPalette, FontPair } from '../lib/types';

export const PALETTES: ColorPalette[] = [
  { id: 'noir-gold', label: 'Noir & Gold', primary: '#0d0d0d', secondary: '#d4a84c', surface: '#f5f0e0', ink: '#0d0d0d' },
  { id: 'navy-trust', label: 'Navy Trust', primary: '#0f1b3d', secondary: '#3b6fa0', surface: '#e8edf3', ink: '#0f1b3d' },
  { id: 'ember-warm', label: 'Ember Warm', primary: '#1a1a1a', secondary: '#e85d3a', surface: '#faf6f1', ink: '#1a1a1a' },
  { id: 'forest-cream', label: 'Forest Cream', primary: '#1f3d2e', secondary: '#b48a3a', surface: '#f5f0e8', ink: '#1f3d2e' },
  { id: 'mono-black', label: 'Mono Black', primary: '#000000', secondary: '#ffffff', surface: '#ffffff', ink: '#000000' },
];

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'bebas-inter',
    label: 'Bebas + Inter',
    display: 'Bebas Neue',
    body: 'Inter',
    cssDisplay: "'Bebas Neue', sans-serif",
    cssBody: "'Inter', sans-serif",
  },
  {
    id: 'playfair-inter',
    label: 'Playfair + Inter',
    display: 'Playfair Display',
    body: 'Inter',
    cssDisplay: "'Playfair Display', serif",
    cssBody: "'Inter', sans-serif",
  },
  {
    id: 'anton-dm',
    label: 'Anton + DM Sans',
    display: 'Anton',
    body: 'DM Sans',
    cssDisplay: "'Anton', sans-serif",
    cssBody: "'DM Sans', sans-serif",
  },
  {
    id: 'cormorant-jakarta',
    label: 'Cormorant + Jakarta',
    display: 'Cormorant Garamond',
    body: 'Plus Jakarta Sans',
    cssDisplay: "'Cormorant Garamond', serif",
    cssBody: "'Plus Jakarta Sans', sans-serif",
  },
  {
    id: 'oswald-figtree',
    label: 'Oswald + Figtree',
    display: 'Oswald',
    body: 'Figtree',
    cssDisplay: "'Oswald', sans-serif",
    cssBody: "'Figtree', sans-serif",
  },
  {
    id: 'archivo-hind',
    label: 'Archivo Black + Hind',
    display: 'Archivo Black',
    body: 'Hind',
    cssDisplay: "'Archivo Black', sans-serif",
    cssBody: "'Hind', sans-serif",
  },
];

export const DEFAULT_PALETTE = PALETTES[0];
export const DEFAULT_FONT_PAIR = FONT_PAIRS[0];
