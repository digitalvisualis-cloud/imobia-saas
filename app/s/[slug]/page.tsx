import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ThemeRenderer } from '@/components/themes/ThemeRenderer';
import { SearchResultsView } from '@/components/themes/SearchResultsView';
import { SearchFlashMessage } from '@/components/themes/SearchFlashMessage';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildImoveisPublic, buildTenantPublic } from '@/lib/build-tenant-public';
import {
  applyFilters,
  filtersSummary,
  hasFilters,
  parseFilters,
} from '@/lib/imovel-filter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura' || v === 'onyx';
}

export default async function SiteHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });

  if (!tenant) notFound();
  if (!tenant.site?.publicado) notFound();

  // Quando há filtros, busca todos os imóveis publicados (sem take/limit) pra
  // poder filtrar todos. Em produção, pode-se trocar por filtro no banco.
  const filters = parseFilters(sp);
  const isSearching = hasFilters(filters);

  const imoveis = await prisma.imovel.findMany({
    where: { tenantId: tenant.id, publicado: true },
    orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
    take: isSearching ? 200 : 30,
  });

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny.templateId) ? siteAny.templateId : 'brisa';

  const isMultiTheme =
    rawConfig &&
    typeof rawConfig === 'object' &&
    ('brisa' in rawConfig || 'aura' in rawConfig || 'onyx' in rawConfig);

  const config = mergeCustomization(
    themeId,
    isMultiTheme ? rawConfig[themeId] : rawConfig,
  );

  const tenantPublic = buildTenantPublic(tenant);
  const imoveisPublic = buildImoveisPublic(imoveis);

  if (isSearching) {
    const filtered = applyFilters(imoveisPublic, filters);
    if (filtered.length === 0) {
      // Sem resultados → mostra a home normal com um flash message no topo
      return (
        <>
          <SearchFlashMessage
            filters={filtersSummary(filters)}
            cleanHref={`/s/${slug}`}
          />
          <ThemeRenderer
            theme={themeId}
            config={config}
            tenant={tenantPublic}
            imoveis={imoveisPublic}
          />
        </>
      );
    }
    return (
      <SearchResultsView
        theme={themeId}
        config={config}
        tenant={tenantPublic}
        results={filtered}
        filtersLabels={filtersSummary(filters)}
      />
    );
  }

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
    rawConfig && typeof rawConfig === 'object' && ('brisa' in rawConfig || 'aura' in rawConfig || 'onyx' in rawConfig);
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
