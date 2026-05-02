import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ThemeRenderer } from '@/components/themes/ThemeRenderer';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildImoveisPublic, buildTenantPublic } from '@/lib/build-tenant-public';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura';
}

export default async function SiteHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });

  if (!tenant) notFound();
  if (!tenant.site?.publicado) notFound();

  const imoveis = await prisma.imovel.findMany({
    where: { tenantId: tenant.id, publicado: true },
    orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  });

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny.templateId) ? siteAny.templateId : 'brisa';

  const isMultiTheme =
    rawConfig &&
    typeof rawConfig === 'object' &&
    ('brisa' in rawConfig || 'aura' in rawConfig);

  const config = mergeCustomization(
    themeId,
    isMultiTheme ? rawConfig[themeId] : rawConfig,
  );

  const tenantPublic = buildTenantPublic(tenant);
  const imoveisPublic = buildImoveisPublic(imoveis);

  return (
    <ThemeRenderer
      theme={themeId}
      config={config}
      tenant={tenantPublic}
      imoveis={imoveisPublic}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { site: true, marca: true },
  });
  if (!tenant) return {};

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny?.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny?.templateId) ? siteAny.templateId : 'brisa';
  const isMultiTheme =
    rawConfig && typeof rawConfig === 'object' && ('brisa' in rawConfig || 'aura' in rawConfig);
  const config = mergeCustomization(
    themeId,
    isMultiTheme ? rawConfig[themeId] : rawConfig,
  );

  return {
    title: config.seo.title || tenant.marca?.nomeEmpresa || tenant.slug,
    description: config.seo.description,
    icons: tenant.marca?.faviconUrl ? { icon: tenant.marca.faviconUrl } : undefined,
  };
}
