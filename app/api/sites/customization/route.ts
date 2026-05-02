import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';

export const dynamic = 'force-dynamic';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura';
}

/**
 * POST /api/sites/customization — salva a customização do site.
 *
 * Body: { themeId: 'brisa'|'aura', configBrisa: Customization, configAura: Customization }
 *
 * Persiste em Site.config no formato { brisa: {...}, aura: {...} } e atualiza
 * Site.templateId pra o themeId ativo.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const body = await req.json().catch(() => null);
    if (!body || !isThemeId(body.themeId)) {
      return NextResponse.json({ error: 'themeId inválido.' }, { status: 400 });
    }

    // Valida e normaliza os dois configs (merge com defaults — protege contra payload mal formado)
    const configBrisa = mergeCustomization('brisa', body.configBrisa);
    const configAura = mergeCustomization('aura', body.configAura);

    const config = { brisa: configBrisa, aura: configAura };

    // Garante que existe um Site row
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
        data: {
          templateId: body.themeId,
          config: config as any,
        },
      });
    } else {
      await prisma.site.create({
        data: {
          tenantId,
          slug: tenant.slug,
          publicado: false,
          templateId: body.themeId,
          config: config as any,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[POST /api/sites/customization]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
