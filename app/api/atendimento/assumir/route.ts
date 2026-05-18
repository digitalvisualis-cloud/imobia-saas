import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/assumir
 *
 * Altera o status de uma conversa.
 * - acao='assumir'   → status passa pra HUMANO (corretor assume, IA pausa)
 * - acao='devolver'  → status volta pra IA
 * - acao='fechar'    → status FECHADA + fechadaEm + fechadaPor
 *
 * Body: { conversaId, acao }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;
  const userId = (session.user as any).id as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body invalido' }, { status: 400 });

  const { conversaId, acao } = body as Record<string, any>;
  if (!conversaId || !['assumir', 'devolver', 'fechar'].includes(acao)) {
    return NextResponse.json(
      { error: 'conversaId e acao obrigatorios (assumir|devolver|fechar)' },
      { status: 400 },
    );
  }

  const conversa = await prisma.conversa.findFirst({
    where: { id: conversaId, tenantId },
  });
  if (!conversa) {
    return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 });
  }

  const next =
    acao === 'assumir'
      ? { status: 'HUMANO' as const }
      : acao === 'devolver'
        ? { status: 'IA' as const }
        : {
            status: 'FECHADA' as const,
            fechadaEm: new Date(),
            fechadaPor: userId,
          };

  const updated = await prisma.conversa.update({
    where: { id: conversaId },
    data: next,
  });

  return NextResponse.json({
    conversaId: updated.id,
    status: updated.status,
  });
}
