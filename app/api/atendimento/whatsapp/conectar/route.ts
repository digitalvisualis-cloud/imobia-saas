import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sessionName, startSession } from '@/lib/whatsapp/waha';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/whatsapp/conectar
 * Cria/inicia uma sessao WAHA pro tenant atual e prepara webhook
 * apontando pro n8n com tenantId+secret na query.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  // Webhook secret pra validar payloads no n8n
  const existing = await prisma.configWhatsApp.findUnique({ where: { tenantId } });
  const webhookSecret = existing?.webhookSecret ?? randomBytes(32).toString('hex');

  // Reaproveita N8N_BASE_URL que ja existe (mesma var usada por lib/n8n-client.ts)
  const n8nBase = process.env.N8N_BASE_URL?.replace(/\/$/, '');
  if (!n8nBase) {
    return NextResponse.json(
      { error: 'N8N_BASE_URL nao configurado' },
      { status: 500 },
    );
  }
  const webhookUrl = `${n8nBase}/webhook/imobia/in?tenantId=${tenantId}&provider=waha&secret=${webhookSecret}`;
  const name = sessionName(tenantId);

  try {
    const sess = await startSession({ name, webhookUrl, webhookSecret });

    await prisma.configWhatsApp.upsert({
      where: { tenantId },
      create: {
        tenantId,
        providerType: 'WAHA',
        instanceName: name,
        baseUrl: process.env.WAHA_BASE_URL,
        webhookSecret,
        status: sess.status === 'WORKING' ? 'CONNECTED' : 'CONNECTING',
      },
      update: {
        instanceName: name,
        webhookSecret,
        status: sess.status === 'WORKING' ? 'CONNECTED' : 'CONNECTING',
        ultimoErro: null,
      },
    });

    return NextResponse.json({
      status: sess.status,
      sessionName: name,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    await prisma.configWhatsApp.upsert({
      where: { tenantId },
      create: {
        tenantId,
        providerType: 'WAHA',
        instanceName: name,
        baseUrl: process.env.WAHA_BASE_URL,
        webhookSecret,
        status: 'ERROR',
        ultimoErro: msg,
      },
      update: { status: 'ERROR', ultimoErro: msg },
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
