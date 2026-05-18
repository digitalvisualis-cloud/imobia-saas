import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sessionName, stopSession } from '@/lib/whatsapp/waha';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/whatsapp/desconectar
 * Para a sessao WAHA e marca como desconectada.
 * Nao deleta — preserva config pra reconectar depois.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const cfg = await prisma.configWhatsApp.findUnique({ where: { tenantId } });
  if (!cfg) {
    return NextResponse.json({ ok: true, status: 'DISCONNECTED' });
  }

  const name = cfg.instanceName ?? sessionName(tenantId);
  try {
    await stopSession(name);
  } catch (err) {
    // Se ja estava parada o WAHA retorna 4xx — segue marcando DISCONNECTED
    console.warn('[waha-desconectar] stop falhou:', err);
  }

  await prisma.configWhatsApp.update({
    where: { tenantId },
    data: {
      status: 'DISCONNECTED',
      desconectadoEm: new Date(),
    },
  });

  return NextResponse.json({ ok: true, status: 'DISCONNECTED' });
}
