import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/posts-lib?imovelId=X */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const imovelId = req.nextUrl.searchParams.get('imovelId');
  const where: any = { tenantId };
  if (imovelId) where.imovelId = imovelId;

  const items = await (prisma as any).postGeradoLib.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({
    items: items.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  });
}

/** POST /api/posts-lib */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'body invalido' }, { status: 400 });

  const {
    imovelId,
    imovelTitulo,
    imovelLocal,
    templateId,
    templateNome,
    formato,
    formatoLabel,
    thumbUrl,
    thumbPath,
    copy,
    customizacao,
  } = body;

  if (!imovelTitulo?.trim() || !templateId || !formato || !thumbUrl) {
    return NextResponse.json(
      { error: 'imovelTitulo, templateId, formato e thumbUrl obrigatorios' },
      { status: 400 },
    );
  }

  // Ownership guard se vier imovelId
  if (imovelId) {
    const ok = await prisma.imovel.findFirst({
      where: { id: imovelId, tenantId },
      select: { id: true },
    });
    if (!ok) return NextResponse.json({ error: 'Imovel nao encontrado' }, { status: 404 });
  }

  const nova = await (prisma as any).postGeradoLib.create({
    data: {
      tenantId,
      imovelId: imovelId || null,
      imovelTitulo: String(imovelTitulo).slice(0, 300),
      imovelLocal: imovelLocal?.trim() || null,
      templateId,
      templateNome: templateNome || templateId,
      formato,
      formatoLabel: formatoLabel || formato,
      thumbUrl,
      thumbPath: thumbPath || null,
      copy: copy?.trim() || null,
      customizacao: customizacao ?? {},
    },
  });
  return NextResponse.json(
    {
      ...nova,
      createdAt: nova.createdAt.toISOString(),
      updatedAt: nova.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
