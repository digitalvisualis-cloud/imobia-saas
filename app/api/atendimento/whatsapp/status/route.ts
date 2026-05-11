import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQR, getSession, sessionName } from '@/lib/whatsapp/waha';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/atendimento/whatsapp/status
 * Retorna estado atual da sessao WAHA do tenant + QR se em scan.
 * Polling-friendly: dashboard chama a cada 2-3s enquanto status=CONNECTING.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const cfg = await prisma.configWhatsApp.findUnique({ where: { tenantId } });
  if (!cfg) {
    return NextResponse.json({ status: 'DISCONNECTED', qr: null });
  }

  const name = cfg.instanceName ?? sessionName(tenantId);

  let wahaStatus: string | null = null;
  let qr: string | null = null;
  let numero: string | null = null;
  try {
    const sess = await getSession(name);
    wahaStatus = sess?.status ?? null;
    numero = sess?.me?.id?.replace(/@c\.us$/, '') ?? null;
    if (sess?.status === 'SCAN_QR_CODE') {
      qr = await getQR(name);
    }
  } catch (err) {
    return NextResponse.json(
      {
        status: cfg.status,
        qr: null,
        error: err instanceof Error ? err.message : 'erro WAHA',
      },
      { status: 200 },
    );
  }

  // Sync status do DB com WAHA
  const dbStatus = mapWahaStatus(wahaStatus, cfg.status);
  if (dbStatus !== cfg.status || (numero && numero !== cfg.numeroConectado)) {
    await prisma.configWhatsApp.update({
      where: { tenantId },
      data: {
        status: dbStatus,
        numeroConectado: numero ?? cfg.numeroConectado,
        conectadoEm: dbStatus === 'CONNECTED' && cfg.status !== 'CONNECTED' ? new Date() : cfg.conectadoEm,
      },
    });
  }

  return NextResponse.json({
    status: dbStatus,
    qr,
    numero: numero ?? cfg.numeroConectado,
    providerType: cfg.providerType,
  });
}

function mapWahaStatus(
  wahaStatus: string | null,
  current: string,
): 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'BANNED' | 'ERROR' {
  if (!wahaStatus) return 'DISCONNECTED';
  switch (wahaStatus) {
    case 'WORKING':
      return 'CONNECTED';
    case 'SCAN_QR_CODE':
    case 'STARTING':
      return 'CONNECTING';
    case 'FAILED':
      return 'ERROR';
    case 'STOPPED':
      return 'DISCONNECTED';
    default:
      return (current as any) ?? 'DISCONNECTED';
  }
}
