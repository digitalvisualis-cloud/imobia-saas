import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BlogClient from './BlogClient';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [artigos, tenant] = await Promise.all([
    prisma.artigoBlog.findMany({
      where: { tenantId },
      orderBy: [{ publicado: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, imoveis: { select: { cidade: true }, distinct: ['cidade'], take: 10 } },
    }),
  ]);

  return (
    <BlogClient
      initialArtigos={artigos.map((a) => ({
        ...a,
        publicadoEm: a.publicadoEm?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))}
      slug={tenant?.slug ?? ''}
      cidades={(tenant?.imoveis ?? []).map((i) => i.cidade).filter(Boolean)}
    />
  );
}
