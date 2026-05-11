import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/atendimento/conversas
 *
 * Lista conversas do tenant ordenadas por ultimaMsgEm desc.
 * Query params:
 *   status: 'IA' | 'HUMANO' | 'FECHADA' | 'ATIVAS' (default ATIVAS = IA + HUMANO)
 *   limit: numero (default 50)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status') ?? 'ATIVAS';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);

  const where: any = { tenantId };
  if (statusParam === 'ATIVAS') {
    where.status = { in: ['IA', 'HUMANO'] };
  } else if (['IA', 'HUMANO', 'FECHADA'].includes(statusParam)) {
    where.status = statusParam;
  }

  const conversas = await prisma.conversa.findMany({
    where,
    orderBy: { ultimaMsgEm: 'desc' },
    take: limit,
    select: {
      id: true,
      clienteWa: true,
      clienteNome: true,
      status: true,
      providerType: true,
      iniciadaEm: true,
      ultimaMsgEm: true,
      imovel: {
        select: {
          id: true,
          codigo: true,
          titulo: true,
          capaUrl: true,
        },
      },
      // Ultima mensagem como preview
      mensagens: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          direcao: true,
          autorTipo: true,
          tipo: true,
          conteudo: true,
          createdAt: true,
        },
      },
      _count: { select: { mensagens: true } },
    },
  });

  return NextResponse.json({ conversas });
}
