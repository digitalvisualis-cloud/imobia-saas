import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/atendimento/conversas/[id]/mensagens
 *
 * Retorna mensagens de uma conversa (do tenant logado) em ordem cronologica.
 * Query params:
 *   limit: numero (default 200)
 *   before?: ISO date (paginacao por createdAt desc)
 */
export async function GET(
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
  const conversa = await prisma.conversa.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      clienteWa: true,
      clienteNome: true,
      status: true,
      providerType: true,
      iniciadaEm: true,
      ultimaMsgEm: true,
      fechadaEm: true,
      resumoLLM: true,
      imovel: {
        select: {
          id: true,
          codigo: true,
          titulo: true,
          tipo: true,
          operacao: true,
          preco: true,
          bairro: true,
          cidade: true,
          estado: true,
          capaUrl: true,
          areaM2: true,
          quartos: true,
          banheiros: true,
          vagas: true,
        },
      },
      lead: {
        select: {
          id: true,
          nome: true,
          etapa: true,
          temperatura: true,
        },
      },
    },
  });
  if (!conversa) {
    return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200', 10) || 200, 500);
  const before = url.searchParams.get('before');

  const where: any = { conversaId: id, tenantId };
  if (before) where.createdAt = { lt: new Date(before) };

  const mensagens = await prisma.mensagem.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  return NextResponse.json({
    conversa: {
      ...conversa,
      imovel: conversa.imovel
        ? { ...conversa.imovel, preco: Number(conversa.imovel.preco), areaM2: conversa.imovel.areaM2 ? Number(conversa.imovel.areaM2) : null }
        : null,
    },
    mensagens,
  });
}
