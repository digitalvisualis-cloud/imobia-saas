import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** POST /api/sites/publish — toggle publicado do site. Body: { publicado: boolean } */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const body = await req.json().catch(() => null);
    if (typeof body?.publicado !== 'boolean') {
      return NextResponse.json({ error: 'publicado é obrigatório.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, site: { select: { id: true } } },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
    }

    if (tenant.site) {
      await prisma.site.update({
        where: { tenantId },
        data: { publicado: body.publicado },
      });
    } else {
      await prisma.site.create({
        data: {
          tenantId,
          slug: tenant.slug,
          publicado: body.publicado,
          templateId: 'brisa',
        },
      });
    }

    return NextResponse.json({ success: true, publicado: body.publicado });
  } catch (e: any) {
    console.error('[POST /api/sites/publish]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
