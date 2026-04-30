import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/admin/tenants/[id]/agente
 *
 * Super admin edita campos técnicos do agente IA de qualquer tenant:
 * - textoProvider (CLAUDE | OPENAI)
 * - chaves IA (cifradas)
 * - n8n / ChatWoot / webhook CRM
 *
 * Cliente final NÃO consegue editar isso (bloqueado em /api/agente).
 */
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: tenantId } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  // Confirma que o tenant existe
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  const data: any = {};

  // Provider
  if (['CLAUDE', 'OPENAI'].includes(body.textoProvider)) {
    data.textoProvider = body.textoProvider;
  }

  // n8n + ChatWoot
  for (const k of ['usarN8n', 'usarChatwoot'] as const) {
    if (body[k] !== undefined) data[k] = !!body[k];
  }

  for (const k of [
    'webhookUrl',
    'chatwootUrl',
    'chatwootInboxId',
    'webhookSaidaCrm',
    'elevenLabsVoiceId',
  ] as const) {
    if (body[k] !== undefined) {
      data[k] =
        typeof body[k] === 'string' ? (body[k] as string).slice(0, 2000) : null;
    }
  }

  // Chaves cifradas
  for (const k of [
    'openaiApiKey',
    'anthropicApiKey',
    'elevenLabsApiKey',
    'remotionApiKey',
    'chatwootToken',
    'webhookSecret',
  ] as const) {
    if (
      typeof body[k] === 'string' &&
      body[k].trim().length > 0 &&
      !body[k].startsWith('••')
    ) {
      try {
        data[k] = encrypt(body[k].trim());
      } catch (e) {
        return NextResponse.json(
          {
            error: `Falha ao cifrar ${k}: ${(e as Error).message}. Verifique MASTER_ENCRYPTION_KEY.`,
          },
          { status: 500 },
        );
      }
    } else if (body[k] === null) {
      data[k] = null;
    }
  }

  const agente = await (prisma as any).agenteIA.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });

  return NextResponse.json({ success: true, id: agente.id });
}
