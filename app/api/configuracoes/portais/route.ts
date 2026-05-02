import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/configuracoes/portais
 * Retorna feedToken + stats de uso (último acesso, contagem de imóveis publicados,
 * total de hits 7 dias por formato).
 *
 * POST /api/configuracoes/portais { action: 'rotate-token' }
 * Gera novo feedToken (URLs antigas param de funcionar imediatamente).
 */

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const tenant = (await (prisma as any).tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, feedToken: true },
  })) as { id: string; slug: string; feedToken: string | null } | null;
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  // Garante que tem feedToken (caso de tenant antigo sem populate)
  let feedToken = tenant.feedToken;
  if (!feedToken) {
    feedToken = randomBytes(16).toString('hex');
    await (prisma as any).tenant.update({
      where: { id: tenantId },
      data: { feedToken },
    });
  }

  const semanaAtras = new Date(Date.now() - 7 * 86400_000);

  const [imoveisCount, hitsVrsync, hitsChaves, ultimoVrsync, ultimoChaves] =
    await Promise.all([
      prisma.imovel.count({
        where: { tenantId, publicado: true, status: 'DISPONIVEL' },
      }),
      (prisma as any).apiRequestLog
        .count({
          where: {
            tenantId,
            route: '/api/portais/vrsync.xml',
            status: 200,
            createdAt: { gte: semanaAtras },
          },
        })
        .catch(() => 0),
      (prisma as any).apiRequestLog
        .count({
          where: {
            tenantId,
            route: '/api/portais/chavesnamao.xml',
            status: 200,
            createdAt: { gte: semanaAtras },
          },
        })
        .catch(() => 0),
      (prisma as any).apiRequestLog
        .findFirst({
          where: { tenantId, route: '/api/portais/vrsync.xml', status: 200 },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, ip: true },
        })
        .catch(() => null),
      (prisma as any).apiRequestLog
        .findFirst({
          where: { tenantId, route: '/api/portais/chavesnamao.xml', status: 200 },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, ip: true },
        })
        .catch(() => null),
    ]);

  return NextResponse.json({
    feedToken,
    slug: tenant.slug,
    imoveisCount,
    stats: {
      vrsync: {
        hits7d: hitsVrsync,
        ultimoAcesso: ultimoVrsync?.createdAt?.toISOString() ?? null,
        ultimoIp: ultimoVrsync?.ip ?? null,
      },
      chavesnamao: {
        hits7d: hitsChaves,
        ultimoAcesso: ultimoChaves?.createdAt?.toISOString() ?? null,
        ultimoIp: ultimoChaves?.ip ?? null,
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => ({}));
  if (body.action !== 'rotate-token') {
    return NextResponse.json(
      { error: 'Action inválida. Use { action: "rotate-token" }' },
      { status: 400 },
    );
  }

  const newToken = randomBytes(16).toString('hex');
  await (prisma as any).tenant.update({
    where: { id: tenantId },
    data: { feedToken: newToken },
  });

  return NextResponse.json({ success: true, feedToken: newToken });
}
