/**
 * Sincronizacao do RAG de imoveis.
 *
 * Pega todos os imoveis publicados de um tenant, formata em texto
 * estruturado, gera embeddings e faz upsert em `embeddings_imoveis`
 * via Supabase Admin client (pgvector).
 *
 * Estrategia: 1 chunk por imovel (descricao ja eh concisa o suficiente
 * pra caber em ~8k tokens do text-embedding-3-small). Se descricao
 * ficar grande, dividir em N chunks por imovel — mas pra MVP, 1 chunk
 * eh adequado.
 */
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { embedMany } from '@/lib/openai/embeddings';

/** Cliente Supabase admin local — evita side-effect do anon client global. */
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY obrigatorios');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const TIPO_LABEL: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COBERTURA: 'Cobertura',
  STUDIO: 'Studio',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala Comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpao',
  CHACARA: 'Chacara',
  SITIO: 'Sitio',
};

const OP_LABEL: Record<string, string> = {
  VENDA: 'Venda',
  ALUGUEL: 'Aluguel',
  TEMPORADA: 'Temporada',
};

interface SyncResult {
  inseridos: number;
  atualizados: number;
  removidos: number;
  total: number;
}

/** Texto canonico que vira embedding pra cada imovel. */
function buildImovelText(imv: {
  codigo: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  operacao: string;
  preco: number | { toString(): string };
  bairro: string | null;
  cidade: string;
  estado: string;
  quartos: number;
  banheiros: number;
  suites: number;
  vagas: number;
  areaM2: { toString(): string } | null;
  amenidades: string[];
}): string {
  const tipo = TIPO_LABEL[imv.tipo] ?? imv.tipo;
  const op = OP_LABEL[imv.operacao] ?? imv.operacao;
  const precoBRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(imv.preco));
  const area = imv.areaM2 ? `${imv.areaM2.toString()} m²` : 'area nao informada';
  const local = [imv.bairro, imv.cidade, imv.estado].filter(Boolean).join(' / ');
  const amen = imv.amenidades.length > 0 ? imv.amenidades.join(', ') : 'sem amenidades cadastradas';

  return [
    `Codigo: ${imv.codigo}`,
    `Tipo: ${tipo}`,
    `Operacao: ${op}`,
    `Titulo: ${imv.titulo}`,
    `Localizacao: ${local}`,
    `Preco: ${precoBRL}`,
    `Quartos: ${imv.quartos} (sendo ${imv.suites} suites)`,
    `Banheiros: ${imv.banheiros}`,
    `Vagas: ${imv.vagas}`,
    `Area: ${area}`,
    `Amenidades: ${amen}`,
    imv.descricao ? `Descricao: ${imv.descricao}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Resincroniza TODOS os imoveis publicados de um tenant.
 *
 * Estrategia: substitui completamente (delete + insert) os embeddings
 * do tenant. Simples e correto pra MVP. Pra escala futura, fazer diff
 * por updatedAt.
 */
export async function sincronizarImoveis(tenantId: string): Promise<SyncResult> {
  const imoveis = await prisma.imovel.findMany({
    where: { tenantId, publicado: true },
    select: {
      id: true,
      codigo: true,
      titulo: true,
      descricao: true,
      tipo: true,
      operacao: true,
      preco: true,
      bairro: true,
      cidade: true,
      estado: true,
      quartos: true,
      banheiros: true,
      suites: true,
      vagas: true,
      areaM2: true,
      amenidades: true,
      updatedAt: true,
    },
  });

  const sb = supabaseAdmin();

  // 1. Apaga embeddings existentes do tenant
  const { error: delErr } = await sb
    .from('embeddings_imoveis')
    .delete()
    .eq('tenant_id', tenantId);
  if (delErr) throw new Error(`Falha apagando embeddings antigos: ${delErr.message}`);

  if (imoveis.length === 0) {
    return { inseridos: 0, atualizados: 0, removidos: 0, total: 0 };
  }

  // 2. Gera textos + embeddings em batch
  const textos = imoveis.map(buildImovelText);
  const vetores = await embedMany(textos);

  // 3. Insere
  const rows = imoveis.map((imv, i) => ({
    tenant_id: tenantId,
    imovel_id: imv.id,
    chunk_index: 0,
    content: textos[i],
    embedding: vetores[i],
    metadata: {
      codigo: imv.codigo,
      tipo: imv.tipo,
      operacao: imv.operacao,
      preco: Number(imv.preco),
      cidade: imv.cidade,
      bairro: imv.bairro,
      updatedAt: imv.updatedAt.toISOString(),
    },
  }));

  const { error: insErr } = await sb.from('embeddings_imoveis').insert(rows);
  if (insErr) throw new Error(`Falha inserindo embeddings: ${insErr.message}`);

  return {
    inseridos: rows.length,
    atualizados: 0,
    removidos: 0,
    total: rows.length,
  };
}

/** Busca top N imoveis mais similares a uma query pra um tenant. */
export async function buscarRag(
  tenantId: string,
  query: string,
  count: number = 5,
  scope: 'all' | 'imoveis' | 'documentos' = 'all',
): Promise<
  Array<{
    id: string;
    source: 'imovel' | 'doc';
    source_id: string;
    content: string;
    similarity: number;
  }>
> {
  const { embedOne } = await import('@/lib/openai/embeddings');
  const queryVec = await embedOne(query);

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc('match_imobia', {
    query_embedding: queryVec,
    match_tenant_id: tenantId,
    match_count: count,
    scope,
  });

  if (error) throw new Error(`Falha busca RAG: ${error.message}`);
  return (data ?? []) as Array<{
    id: string;
    source: 'imovel' | 'doc';
    source_id: string;
    content: string;
    similarity: number;
  }>;
}
