import type { ImovelPublic, TenantPublic } from '@/app/_templates/types';

export function formatPriceBRL(v: number, op?: string) {
  const value = v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
  if (op && op.toUpperCase() === 'ALUGUEL') return `${value}/mês`;
  return value;
}

export function imovelHref(slug: string, codigo: string) {
  return `/s/${slug}/imovel/${codigo}`;
}

export function pickFeaturedImovel(imoveis: ImovelPublic[]): ImovelPublic | null {
  if (imoveis.length === 0) return null;
  const featured = imoveis.find((i) => i.destaque);
  return featured ?? imoveis[0];
}

export type ThemeProps = {
  tenant: TenantPublic;
  imoveis: ImovelPublic[];
};

const FALLBACK_HERO_IMG =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80';
const FALLBACK_CARD_IMG =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';

export function imageUrl(url: string | null | undefined, fallback = FALLBACK_CARD_IMG) {
  if (!url || url.trim() === '') return fallback;
  return url;
}

export function heroImage(imovel: ImovelPublic | null) {
  return imageUrl(imovel?.capaUrl ?? imovel?.imagens[0], FALLBACK_HERO_IMG);
}
