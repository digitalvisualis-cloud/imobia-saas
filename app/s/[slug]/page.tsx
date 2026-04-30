import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TemplateHome } from '@/app/_templates/elegance/TemplateHome';
import type { TenantPublic, ImovelPublic } from '@/app/_templates/types';
import { mergeSiteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
// Iframe do editor faz cache-bust com ?t=... e revalida — força re-render
export const revalidate = 0;

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
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

  const imoveis = await prisma.imovel.findMany({
    where: { tenantId: tenant.id, publicado: true },
    orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  });

  // Lê config do site (páginas e seções habilitadas)
  // Se nunca foi salvo, usa default
  const siteConfig = mergeSiteConfig((tenant.site as any)?.config);
  const inicio = siteConfig.pages.find((p) => p.id === 'inicio');
  const enabledSections = inicio
    ? inicio.sections.filter((s) => s.enabled).map((s) => s.id as any)
    : undefined;

  const tenantCtx: TenantPublic = {
    slug: tenant.slug,
    nome: tenant.marca?.nomeEmpresa || titleCase(slug),
    marca: tenant.marca
      ? {
          nomeEmpresa: tenant.marca.nomeEmpresa,
          slogan: tenant.marca.slogan,
          descricao: tenant.marca.descricao,
          logoUrl: tenant.marca.logoUrl,
          faviconUrl: tenant.marca.faviconUrl,
          corPrimaria: tenant.marca.corPrimaria,
          corSecundaria: tenant.marca.corSecundaria,
          whatsapp: tenant.marca.whatsapp,
          email: tenant.marca.email,
          telefone: tenant.marca.telefone,
          endereco: tenant.marca.endereco,
          instagram: tenant.marca.instagram,
          facebook: tenant.marca.facebook,
          youtube: tenant.marca.youtube,
          linkedin: tenant.marca.linkedin,
          tiktok: tenant.marca.tiktok,
        }
      : null,
  };

  // Serializa Decimal → number antes de passar pro client component
  const imoveisData: ImovelPublic[] = imoveis.map((i) => ({
    id: i.id,
    codigo: i.codigo,
    titulo: i.titulo,
    descricao: i.descricao,
    tipo: i.tipo as unknown as string,
    operacao: i.operacao as unknown as string,
    preco: Number(i.preco),
    bairro: i.bairro,
    cidade: i.cidade,
    estado: i.estado,
    endereco: i.endereco,
    quartos: i.quartos,
    suites: i.suites,
    banheiros: i.banheiros,
    vagas: i.vagas,
    areaM2: i.areaM2 != null ? Number(i.areaM2) : null,
    areaTotal: i.areaTotal != null ? Number(i.areaTotal) : null,
    imagens: i.imagens ?? [],
    capaUrl: i.capaUrl,
    videoUrl: i.videoUrl,
    amenidades: i.amenidades ?? [],
    destaque: i.destaque,
  }));

  return (
    <TemplateHome
      tenant={tenantCtx}
      imoveis={imoveisData}
      enabledSections={enabledSections}
    />
  );
}
