import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildImoveisPublic, buildTenantPublic } from '@/lib/build-tenant-public';
import SiteEditorClient from './SiteEditorClient';

export const dynamic = 'force-dynamic';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura';
}

export default async function SitesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [tenant, imoveis] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { marca: true, site: true },
    }),
    prisma.imovel.findMany({
      where: { tenantId, publicado: true },
      orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    }),
  ]);

  if (!tenant) redirect('/login');

  // Garante um Site row pra esse tenant
  let site = tenant.site;
  if (!site) {
    site = await prisma.site.create({
      data: {
        tenantId,
        slug: tenant.slug,
        publicado: false,
        templateId: 'brisa',
      },
    });
  }

  const siteAny = site as any;
  const rawConfig = (siteAny.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny.templateId) ? siteAny.templateId : 'brisa';

  // Formato no DB:
  //   { brisa: {...}, aura: {...} }  ← novo (multi-tema)
  //   { ...customization }           ← legacy: aplica ao tema ativo
  const isMultiTheme =
    rawConfig &&
    typeof rawConfig === 'object' &&
    ('brisa' in rawConfig || 'aura' in rawConfig);

  const configBrisa = mergeCustomization(
    'brisa',
    isMultiTheme ? rawConfig.brisa : themeId === 'brisa' ? rawConfig : null,
  );
  const configAura = mergeCustomization(
    'aura',
    isMultiTheme ? rawConfig.aura : themeId === 'aura' ? rawConfig : null,
  );

  const tenantPublic = buildTenantPublic(tenant);
  const imoveisPublic = buildImoveisPublic(imoveis);

  return (
    <SiteEditorClient
      site={{
        publicado: site.publicado,
        slug: site.slug,
        dominio: site.dominio,
        themeId,
        configBrisa,
        configAura,
      }}
      tenant={tenantPublic}
      imoveis={imoveisPublic}
    />
  );
}
