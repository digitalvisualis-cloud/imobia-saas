// Mapeia tipos do Prisma (Imovel + ConfigMarca) pro shape esperado
// pelos templates do post-magic-builder (ImovelData + MarcaData).
//
// Schema do imobia-saas usa areaM2 e camelCase; Lovable usa area e
// snake_case. Adapter cobre o gap.

import type { ImovelData, MarcaData } from './lib/types';

// Subset minimo do Imovel Prisma que precisamos. Definido como type
// estrutural pra evitar import direto do @prisma/client em components
// e manter o adapter usavel em qualquer caminho (server / RSC / API).
export type PrismaImovelLike = {
  id: string;
  titulo: string;
  operacao: string;
  preco: any; // Decimal
  cidade: string;
  bairro: string | null;
  endereco: string | null;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaM2: any | null; // Decimal
  codigo: string;
  descricao: string | null;
  imagens: string[];
  capaUrl?: string | null;
};

export type PrismaMarcaLike = {
  id: string;
  nomeEmpresa: string | null;
  whatsapp: string | null;
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string | null;
} | null;

export function prismaImovelToLovable(i: PrismaImovelLike): ImovelData {
  // Ordena: capa primeiro se existir (e ainda nao estiver na lista)
  let imagens = Array.isArray(i.imagens) ? [...i.imagens] : [];
  if (i.capaUrl && !imagens.includes(i.capaUrl)) {
    imagens = [i.capaUrl, ...imagens];
  }
  return {
    id: i.id,
    titulo: i.titulo,
    operacao: (i.operacao === 'VENDA' ? 'VENDA' : 'ALUGUEL') as 'VENDA' | 'ALUGUEL',
    preco: Number(i.preco) || 0,
    cidade: i.cidade,
    bairro: i.bairro,
    endereco: i.endereco,
    quartos: i.quartos ?? 0,
    suites: i.suites ?? 0,
    banheiros: i.banheiros ?? 0,
    vagas: i.vagas ?? 0,
    area: i.areaM2 != null ? Number(i.areaM2) : null,
    codigo: i.codigo,
    descricao: i.descricao,
    imagens,
  };
}

/** Marca: usa ConfigMarca do tenant; se null/incompleta, aplica defaults da marca. */
export function prismaMarcaToLovable(m: PrismaMarcaLike, fallbackId: string): MarcaData {
  return {
    id: m?.id ?? fallbackId,
    nome_empresa: m?.nomeEmpresa ?? 'Sua imobiliária',
    whatsapp: m?.whatsapp ?? null,
    site: null,
    cor_primaria: m?.corPrimaria ?? '#0f172a',
    cor_secundaria: m?.corSecundaria ?? '#f59e0b',
    logo_url: m?.logoUrl ?? null,
  };
}
