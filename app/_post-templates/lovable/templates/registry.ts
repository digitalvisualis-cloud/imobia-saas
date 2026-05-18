import type { PostTemplateMeta } from '../lib/types';
import { CleanBar } from './CleanBar';
import { BoldOffer } from './BoldOffer';
import { EditorialFrame } from './EditorialFrame';
import { GlassPremium } from './GlassPremium';
import { VerticalSplit } from './VerticalSplit';
import { MagazineCover } from './MagazineCover';
import { SwissGrid } from './SwissGrid';
import { BannerStripe } from './BannerStripe';
import { PolaroidStack } from './PolaroidStack';
import { DarkLuxe } from './DarkLuxe';
import { ColorBlock } from './ColorBlock';
import { TapeStrip } from './TapeStrip';
import { SoftPastel } from './SoftPastel';
import { StampSeal } from './StampSeal';

const allFormats: PostTemplateMeta['formatosSuportados'] = ['SQUARE', 'VERTICAL', 'STORY', 'CARROSSEL'];

export const TEMPLATES: PostTemplateMeta[] = [
  { id: 'clean-bar', nome: 'Location Hero', vibe: '📍 LOCALIZAÇÃO em destaque · IDBrokers', formatosSuportados: allFormats, Component: CleanBar },
  { id: 'bold-offer', nome: 'Price Protagonist', vibe: '💰 PREÇO gigante · Disponível Dark', formatosSuportados: allFormats, Component: BoldOffer },
  { id: 'editorial-frame', nome: 'Title Giant', vibe: '✨ TÍTULO gigante + thumbs · Diagonal Modern', formatosSuportados: allFormats, Component: EditorialFrame },
  { id: 'glass-premium', nome: 'Gallery Luxury', vibe: '🎯 Galeria circular · Bolhas Luxury', formatosSuportados: allFormats, Component: GlassPremium },
  { id: 'vertical-split', nome: 'Specs Hero', vibe: '🏠 SPECS em pills grandes', formatosSuportados: allFormats, Component: VerticalSplit },
  { id: 'magazine-cover', nome: 'Magazine Cover', vibe: '📰 Estilo capa de revista · masthead + serif', formatosSuportados: allFormats, Component: MagazineCover },
  { id: 'swiss-grid', nome: 'Swiss Grid', vibe: '◾ Minimal suíço · grid + linhas finas', formatosSuportados: allFormats, Component: SwissGrid },
  { id: 'banner-stripe', nome: 'Banner Stripe', vibe: '🎗️ Faixa diagonal vibrante atravessando', formatosSuportados: allFormats, Component: BannerStripe },
  { id: 'polaroid-stack', nome: 'Polaroid Stack', vibe: '📸 Polaroids empilhadas · playful', formatosSuportados: allFormats, Component: PolaroidStack },
  
  { id: 'dark-luxe', nome: 'Dark Luxe', vibe: '🌑 Full dark + moldura dourada · alto luxo', formatosSuportados: allFormats, Component: DarkLuxe },
  { id: 'color-block', nome: 'Color Block', vibe: '🟦 Mondrian · blocos de cor', formatosSuportados: allFormats, Component: ColorBlock },
  { id: 'tape-strip', nome: 'Tape Strip', vibe: '🎞️ Faixa de fotos tipo filme', formatosSuportados: allFormats, Component: TapeStrip },
  { id: 'soft-pastel', nome: 'Soft Pastel', vibe: '☁️ Curvas suaves · bolha de preço · lifestyle', formatosSuportados: allFormats, Component: SoftPastel },
  { id: 'stamp-seal', nome: 'Stamp Seal', vibe: '🏷️ Carimbo circular EXCLUSIVO sobreposto', formatosSuportados: allFormats, Component: StampSeal },
];
