// Helpers compartilhados entre templates.
// Cada template renderiza em tamanho NATIVO (1080×*). Tipografia usa "u" = altura/100,
// que é declarado via CSS var no root do canvas. Isso elimina o bug de "atravessa ao trocar formato".

import type { ImovelData } from '../lib/types';

export interface Spec {
  value: string;
  unit: string;
  iconKey: SpecIconKey;
}

export type SpecIconKey = 'bed' | 'bath' | 'garage' | 'area' | 'suite';

export function specsFor(imovel: ImovelData): Spec[] {
  const out: Spec[] = [];
  if (imovel.quartos) out.push({ value: String(imovel.quartos), unit: imovel.quartos > 1 ? 'quartos' : 'quarto', iconKey: 'bed' });
  if (imovel.suites) out.push({ value: String(imovel.suites), unit: imovel.suites > 1 ? 'suítes' : 'suíte', iconKey: 'suite' });
  if (imovel.banheiros) out.push({ value: String(imovel.banheiros), unit: imovel.banheiros > 1 ? 'banheiros' : 'banheiro', iconKey: 'bath' });
  if (imovel.vagas) out.push({ value: String(imovel.vagas), unit: imovel.vagas > 1 ? 'vagas' : 'vaga', iconKey: 'garage' });
  if (imovel.area) out.push({ value: String(Math.round(imovel.area)), unit: 'm²', iconKey: 'area' });
  return out;
}

export function shortTitle(t: string, max = 28): string {
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trim() + '…';
}

export function locationOf(i: ImovelData): string {
  return [i.bairro, i.cidade].filter(Boolean).join(' · ');
}

export function operacaoLabel(op: 'VENDA' | 'ALUGUEL'): string {
  return op === 'VENDA' ? 'À venda' : 'Para alugar';
}

// Picker da imagem ativa para um slide do carrossel
export function pickImage(imovel: ImovelData, slideIndex = 0): string {
  return imovel.imagens[slideIndex] ?? imovel.imagens[0] ?? '';
}
