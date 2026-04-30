/**
 * Tipos compartilhados pelos templates de Posts (Media Kit estilo Lano).
 *
 * Cada template é um componente React que renderiza um <div> 1080×1080 (post)
 * ou 1080×1920 (story). Esse div pode ser convertido pra PNG via html2canvas.
 *
 * O brand kit (cor primária, secundária, logo, fonte) é puxado direto da
 * `ConfigMarca` do tenant — não tem customização local nessa tela.
 * Cliente quer mudar marca? Vai em /configuracoes.
 */

export type PostFormato = 'POST_QUADRADO' | 'POST_VERTICAL' | 'STORY';

export const FORMATO_LABELS: Record<PostFormato, string> = {
  POST_QUADRADO: 'Post Instagram (quadrado)',
  POST_VERTICAL: 'Post Instagram (vertical)',
  STORY: 'Story / Reels',
};

export const FORMATO_DIMENSOES: Record<PostFormato, { w: number; h: number; aspect: string }> = {
  POST_QUADRADO: { w: 1080, h: 1080, aspect: '1:1' },
  POST_VERTICAL: { w: 1080, h: 1350, aspect: '4:5' },
  STORY: { w: 1080, h: 1920, aspect: '9:16' },
};

export type ImovelParaPost = {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  operacao: string;
  preco: number;
  bairro: string | null;
  cidade: string;
  estado: string;
  capaUrl: string | null;
  imagens: string[];
  areaM2: number | null;
  quartos: number;
  banheiros: number;
  vagas: number;
  amenidades: string[];
};

export type MarcaParaPost = {
  nomeEmpresa: string | null;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  whatsapp: string | null;
  instagram: string | null;
};

export type PostTemplateProps = {
  imovel: ImovelParaPost;
  marca: MarcaParaPost;
  formato: PostFormato;
};

export type PostTemplate = {
  id: string;
  nome: string;
  descricao: string;
  vibe: string; // texto curto: "Clean · Direto", "Boutique · Com borda", etc
  Component: React.ComponentType<PostTemplateProps>;
};

/* ---------- Helpers de formatação ---------- */

export function formatPrecoCompacto(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `R$ ${m.toFixed(m % 1 === 0 ? 0 : 1).replace('.', ',')} milhão`;
  }
  if (v >= 1_000) {
    const k = v / 1_000;
    return `R$ ${k.toFixed(0)} mil`;
  }
  return `R$ ${v}`;
}

export function formatPrecoCompleto(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function operacaoLabel(op: string): string {
  if (op === 'VENDA') return 'À venda';
  if (op === 'ALUGUEL') return 'Aluguel';
  if (op === 'TEMPORADA') return 'Temporada';
  return op;
}

/**
 * Gera texto pronto pra copiar (legenda + hashtags) sem IA.
 * Usa template fixo com dados do imóvel — economiza processamento e custo.
 */
export function gerarLegenda(imovel: ImovelParaPost, marca: MarcaParaPost): string {
  const op = operacaoLabel(imovel.operacao).toLowerCase();
  const bairroCidade = [imovel.bairro, imovel.cidade].filter(Boolean).join(', ');
  const specs = [
    imovel.areaM2 ? `${imovel.areaM2} m²` : null,
    imovel.quartos > 0 ? `${imovel.quartos} ${imovel.quartos === 1 ? 'quarto' : 'quartos'}` : null,
    imovel.banheiros > 0
      ? `${imovel.banheiros} ${imovel.banheiros === 1 ? 'banheiro' : 'banheiros'}`
      : null,
    imovel.vagas > 0 ? `${imovel.vagas} ${imovel.vagas === 1 ? 'vaga' : 'vagas'}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const tagsBase = [
    `#${imovel.tipo.charAt(0) + imovel.tipo.slice(1).toLowerCase()}${op === 'à venda' ? 'AVenda' : 'ParaAlugar'}`,
    imovel.bairro
      ? `#${imovel.bairro.replace(/[^A-Za-z0-9]/g, '')}`
      : null,
    `#${imovel.cidade.replace(/[^A-Za-z0-9]/g, '')}`,
    '#ImobiliariaDigital',
    '#ImovelIdeal',
  ].filter(Boolean) as string[];

  return [
    `✨ ${imovel.titulo}`,
    bairroCidade ? `📍 ${bairroCidade}` : null,
    specs,
    `💰 ${formatPrecoCompleto(imovel.preco)}`,
    '',
    marca.whatsapp
      ? `📞 Agende sua visita: wa.me/${marca.whatsapp.replace(/\D/g, '')}`
      : null,
    '',
    tagsBase.join(' '),
  ]
    .filter((l) => l !== null)
    .join('\n');
}
