import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeImovel } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const MAP_TIPO: Record<string, string> = {
  Casa: 'CASA',
  Apartamento: 'APARTAMENTO',
  Cobertura: 'COBERTURA',
  Studio: 'STUDIO',
  Terreno: 'TERRENO',
  'Sala Comercial': 'SALA_COMERCIAL',
  Loja: 'LOJA',
  Galpão: 'GALPAO',
  Chácara: 'CHACARA',
  Sítio: 'SITIO',
};

const MAP_OPERACAO: Record<string, string> = {
  Venda: 'VENDA',
  Aluguel: 'ALUGUEL',
  Temporada: 'TEMPORADA',
};

/**
 * GET /api/imoveis/[id]  → retorna dados do imóvel (pra editar)
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await ctx.params;

  const imovel = await prisma.imovel.findFirst({
    where: { id, tenantId },
  });
  if (!imovel) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
  }

  return NextResponse.json(serializeImovel(imovel));
}

/**
 * PATCH /api/imoveis/[id]  → atualiza dados do imóvel
 *
 * Aceita JSON com qualquer subconjunto dos campos do form de cadastro.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await ctx.params;

  // Garante ownership
  const existente = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  // Mapeia campos string PT-BR → enums do Prisma quando vier
  const data: any = {};
  if (typeof body.tipo === 'string') {
    data.tipo = MAP_TIPO[body.tipo] ?? body.tipo;
  }
  if (typeof body.operacao === 'string') {
    data.operacao = MAP_OPERACAO[body.operacao] ?? body.operacao;
  }
  if (typeof body.titulo === 'string') data.titulo = body.titulo;
  if (typeof body.descricao === 'string') data.descricao = body.descricao;
  if (typeof body.cep === 'string') data.cep = body.cep || null;
  if (typeof body.endereco === 'string') data.endereco = body.endereco || null;
  if (typeof body.bairro === 'string') data.bairro = body.bairro || null;
  if (typeof body.cidade === 'string') data.cidade = body.cidade;
  if (typeof body.estado === 'string') data.estado = body.estado;
  if (body.preco != null) data.preco = Number(body.preco);
  if (body.quartos != null) data.quartos = Number(body.quartos);
  if (body.suites != null) data.suites = Number(body.suites);
  if (body.banheiros != null) data.banheiros = Number(body.banheiros);
  if (body.vagas != null) data.vagas = Number(body.vagas);
  if (body.areaM2 != null) data.areaM2 = Number(body.areaM2);
  if (body.areaTotal != null) data.areaTotal = Number(body.areaTotal);
  if (Array.isArray(body.amenidades)) data.amenidades = body.amenidades;
  if (typeof body.videoUrl === 'string') data.videoUrl = body.videoUrl || null;
  if (typeof body.status === 'string') data.status = body.status;
  if (typeof body.publicado === 'boolean') data.publicado = body.publicado;
  if (typeof body.destaque === 'boolean') data.destaque = body.destaque;

  const updated = await prisma.imovel.update({
    where: { id },
    data,
  });

  return NextResponse.json(serializeImovel(updated));
}

/**
 * DELETE /api/imoveis/[id]  → remove o imóvel
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await ctx.params;

  const existente = await prisma.imovel.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
  }

  await prisma.imovel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
