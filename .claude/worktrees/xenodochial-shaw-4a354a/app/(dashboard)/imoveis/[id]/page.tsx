import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeImovel } from '@/lib/serialize';
import ImovelDetailsClient from './ImovelDetailsClient';

export default async function ImovelDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const tenantId = (session.user as any).tenantId as string;

  const [imovel, site] = await Promise.all([
    prisma.imovel.findUnique({ where: { id } }),
    prisma.site.findUnique({ where: { tenantId }, select: { slug: true } }),
  ]);

  if (!imovel || imovel.tenantId !== tenantId) notFound();

  return <ImovelDetailsClient imovel={serializeImovel(imovel)} siteSlug={site?.slug} />;
}
