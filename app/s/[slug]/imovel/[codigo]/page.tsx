import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ImovelDetail } from '@/components/themes/ImovelDetail';
import { mergeCustomization, type ThemeId } from '@/types/site-customization';
import { buildImoveisPublic, buildTenantPublic } from '@/lib/build-tenant-public';

export const dynamic = 'force-dynamic';

function isThemeId(v: unknown): v is ThemeId {
  return v === 'brisa' || v === 'aura';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; codigo: string }>;
}) {
  const { slug, codigo } = await params;
  const imovel = await prisma.imovel.findFirst({
    where: { codigo, tenant: { slug } },
  });
  if (!imovel) return { title: 'Imóvel não encontrado' };
  return {
    title: `${imovel.titulo} · ${imovel.codigo}`,
    description:
      imovel.descricao?.substring(0, 160) ||
      `Imóvel à ${(imovel.operacao as string).toLowerCase()} em ${imovel.cidade ?? ''}.`,
    openGraph: { images: imovel.capaUrl ? [imovel.capaUrl] : [] },
  };
}

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ slug: string; codigo: string }>;
}) {
  const { slug, codigo } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { marca: true, site: true },
  });
  if (!tenant) notFound();

  const imovel = await prisma.imovel.findFirst({
    where: { codigo, tenantId: tenant.id, publicado: true },
  });
  if (!imovel) notFound();

  // Incrementa visualizações silenciosamente
  prisma.imovel
    .update({
      where: { id: imovel.id },
      data: { visualizacoes: { increment: 1 } },
    })
    .catch(() => {});

  const siteAny = tenant.site as any;
  const rawConfig = (siteAny?.config ?? {}) as Record<string, unknown>;
  const themeId: ThemeId = isThemeId(siteAny?.templateId) ? siteAny.templateId : 'brisa';
  const isMultiTheme =
    rawConfig && typeof rawConfig === 'object' && ('brisa' in rawConfig || 'aura' in rawConfig);
  const config = mergeCustomization(
    themeId,
    isMultiTheme ? rawConfig[themeId] : rawConfig,
  );

  const tenantPublic = buildTenantPublic(tenant);
  const [imovelPublic] = buildImoveisPublic([imovel]);

  return (
    <ImovelDetail
      theme={themeId}
      config={config}
      tenant={tenantPublic}
      imovel={imovelPublic}
    />
  );
}
