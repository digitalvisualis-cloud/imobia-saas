import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { mergeSiteConfig, type SiteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sites/config — devolve a config atual (com merge nos defaults).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const site = await prisma.site.findUnique({ where: { tenantId } });
    if (!site) {
      return NextResponse.json({ error: 'Site não encontrado.' }, { status: 404 });
    }

    // cast porque Prisma client ainda precisa ser regenerado (`npx prisma generate`)
    const siteAny = site as any;
    const config = mergeSiteConfig(siteAny.config);
    return NextResponse.json({ config, templateId: siteAny.templateId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/sites/config — salva a config.
 *
 * Body: { config: SiteConfig, templateId?: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const body = await req.json().catch(() => null);
    if (!body?.config) {
      return NextResponse.json({ error: 'config é obrigatório.' }, { status: 400 });
    }

    // valida e normaliza com merge nos defaults
    const config: SiteConfig = mergeSiteConfig(body.config);

    const updateData: any = { config };
    if (typeof body.templateId === 'string') updateData.templateId = body.templateId;

    const createData: any = {
      tenantId,
      slug: 'novo-site',
      publicado: false,
      config,
      templateId: body.templateId ?? 'elegance',
    };

    const updated = await prisma.site.upsert({
      where: { tenantId },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({ success: true, site: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
