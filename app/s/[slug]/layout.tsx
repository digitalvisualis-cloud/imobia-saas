import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura';
}

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });
  if (!tenant) return { title: 'Página não encontrada' };

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny?.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny?.templateId) ? siteAny.templateId : 'brisa';
  const isMultiTheme =
    rawConfig && typeof rawConfig === 'object' && ('brisa' in rawConfig || 'aura' in rawConfig);
  const config = mergeCustomization(
    themeId,
    isMultiTheme ? rawConfig[themeId] : rawConfig,
  );

  const nome = config.header.brandName || tenant.marca?.nomeEmpresa || titleCase(slug);
  return {
    title: config.seo.title || nome,
    description: config.seo.description || tenant.marca?.descricao || tenant.marca?.slogan || '',
    icons: { icon: tenant.marca?.faviconUrl || '/favicon.ico' },
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, site: { select: { publicado: true } } },
  });
  if (!tenant) notFound();
  return <>{children}</>;
}
