import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TemplateImovel } from '@/app/_templates/elegance/TemplateImovel';
import type { TenantPublic, ImovelPublic } from '@/app/_templates/types';

export const dynamic = 'force-dynamic';

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
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
      `Imóvel à ${(imovel.operacao as string).toLowerCase()} em ${imovel.cidade}.`,
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
    include: { marca: true },
  });

  if (!tenant) notFound();

  const imovel = await prisma.imovel.findFirst({
    where: { codigo, tenantId: tenant.id, publicado: true },
  });

  if (!imovel) notFound();

  // Incrementa visualizações silenciosamente (não bloqueia)
  prisma.imovel
    .update({
      where: { id: imovel.id },
      data: { visualizacoes: { increment: 1 } },
    })
    .catch(() => {});

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

  const imovelData: ImovelPublic = {
    id: imovel.id,
    codigo: imovel.codigo,
    titulo: imovel.titulo,
    descricao: imovel.descricao,
    tipo: imovel.tipo as unknown as string,
    operacao: imovel.operacao as unknown as string,
    preco: Number(imovel.preco),
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    estado: imovel.estado,
    endereco: imovel.endereco,
    quartos: imovel.quartos,
    suites: imovel.suites,
    banheiros: imovel.banheiros,
    vagas: imovel.vagas,
    areaM2: imovel.areaM2 != null ? Number(imovel.areaM2) : null,
    areaTotal: imovel.areaTotal != null ? Number(imovel.areaTotal) : null,
    imagens: imovel.imagens ?? [],
    capaUrl: imovel.capaUrl,
    videoUrl: imovel.videoUrl,
    amenidades: imovel.amenidades ?? [],
    destaque: imovel.destaque,
  };

  return <TemplateImovel tenant={tenantCtx} imovel={imovelData} />;
}
