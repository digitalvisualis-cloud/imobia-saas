/**
 * Tipos compartilhados entre todos os templates de site público.
 * Cada template (Elegance, Cosmic, Boutique...) recebe os mesmos props.
 */

export type BrandKit = {
  nomeEmpresa: string | null;
  slogan: string | null;
  descricao: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  whatsapp: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
};

export type TenantPublic = {
  slug: string;
  nome: string; // fallback bonito (title case do slug se não tiver nomeEmpresa)
  marca: BrandKit | null;
};

export type ImovelPublic = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  operacao: string;
  preco: number;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaM2: number | null;
  areaTotal: number | null;
  imagens: string[];
  capaUrl: string | null;
  videoUrl: string | null;
  amenidades: string[];
  destaque: boolean;
};

/** Labels em PT-BR pros enums do Prisma. */
export const TIPO_LABELS: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  CHACARA: 'Chácara',
  SITIO: 'Sítio',
};

export const FINALIDADE_LABELS: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  TEMPORADA: 'Temporada',
};

export function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

/**
 * @deprecated Usar `buildWhatsappLink` de `@/lib/whatsapp-link`. Mantido pra
 * compatibilidade com templates legados.
 */
export function buildWhatsAppLink(
  num: string,
  msg = 'Olá! Vim pelo site e gostaria de mais informações.',
  imovel?: { codigo: string; titulo: string; bairro?: string | null; cidade?: string | null },
) {
  const cleaned = num.replace(/\D/g, '');
  const withCountry =
    cleaned.length === 11 || cleaned.length === 10 ? `55${cleaned}` : cleaned;

  // Se imóvel veio, prioriza mensagem com [CÓDIGO] pro agente IA reconhecer
  let text = msg;
  if (imovel) {
    const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(', ');
    text = `Olá! Tenho interesse no imóvel [${imovel.codigo}] - ${imovel.titulo}${local ? ` (${local})` : ''}. Pode me passar mais informações?`;
  }

  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}
