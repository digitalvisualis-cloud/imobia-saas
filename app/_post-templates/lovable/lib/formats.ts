import type { FormatoConfig, FormatoPost } from './types';

export const FORMATOS: Record<FormatoPost, FormatoConfig> = {
  SQUARE: {
    id: 'SQUARE',
    label: 'Quadrado',
    description: '1080 × 1080 · Feed Instagram & Facebook',
    width: 1080,
    height: 1080,
    slides: 1,
  },
  VERTICAL: {
    id: 'VERTICAL',
    label: 'Vertical',
    description: '1080 × 1350 · Novo feed Instagram',
    width: 1080,
    height: 1350,
    slides: 1,
  },
  STORY: {
    id: 'STORY',
    label: 'Story',
    description: '1080 × 1920 · Stories & Reels',
    width: 1080,
    height: 1920,
    slides: 1,
  },
  CARROSSEL: {
    id: 'CARROSSEL',
    label: 'Carrossel',
    description: '4 × 1080 × 1350 · Carrossel Instagram (vertical)',
    width: 1080,
    height: 1350,
    slides: 4,
  },
};

export const FORMATO_LIST: FormatoConfig[] = [
  FORMATOS.SQUARE,
  FORMATOS.VERTICAL,
  FORMATOS.STORY,
  FORMATOS.CARROSSEL,
];

export function formatPreco(preco: number, operacao: 'VENDA' | 'ALUGUEL'): string {
  const v = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(preco);
  return operacao === 'ALUGUEL' ? `${v}/mês` : v;
}

export function formatPrecoShort(preco: number): string {
  if (preco >= 1_000_000) {
    return `R$ ${(preco / 1_000_000).toFixed(preco % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (preco >= 1000) {
    return `R$ ${(preco / 1000).toFixed(0)}K`;
  }
  return `R$ ${preco}`;
}
