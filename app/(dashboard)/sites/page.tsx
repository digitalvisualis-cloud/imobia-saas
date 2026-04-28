import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { mergeSiteConfig } from '@/lib/site-config';
import SitesClient from './SitesClient';

export const dynamic = 'force-dynamic';

export default async function SitesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [site, marca, totalImoveis] = await Promise.all([
    prisma.site.findUnique({ where: { tenantId } }),
    prisma.configMarca.findUnique({ where: { tenantId } }),
    prisma.imovel.count({ where: { tenantId, publicado: true } }),
  ]);

  // Casts em (site as any) porque o Prisma client precisa ser regenerado
  // depois de adicionar `templateId` e `config` no schema. Rodar:
  //   npx prisma generate
  const siteAny = site as any;

  return (
    <SitesClient
      site={
        site
          ? {
              slug: site.slug,
              publicado: site.publicado,
              titulo: site.titulo,
              dominio: site.dominio,
              templateId: siteAny.templateId ?? 'elegance',
              config: mergeSiteConfig(siteAny.config),
            }
          : null
      }
      marca={{
        nomeEmpresa: marca?.nomeEmpresa ?? null,
        slogan: marca?.slogan ?? null,
        descricao: marca?.descricao ?? null,
        logoUrl: marca?.logoUrl ?? null,
        corPrimaria: marca?.corPrimaria ?? '#c5a64f',
        corSecundaria: marca?.corSecundaria ?? '#1a2e1a',
      }}
      totalImoveis={totalImoveis}
    />
  );
}
