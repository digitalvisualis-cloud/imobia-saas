import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import PortaisClient from './PortaisClient';

export const dynamic = 'force-dynamic';

export default async function PortaisPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const tenant = (await (prisma as any).tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, feedToken: true },
  })) as { id: string; slug: string; feedToken: string | null } | null;
  if (!tenant) redirect('/login');

  // Auto-gera feedToken se ainda não tiver
  let feedToken = tenant.feedToken;
  if (!feedToken) {
    feedToken = randomBytes(16).toString('hex');
    await (prisma as any).tenant.update({
      where: { id: tenantId },
      data: { feedToken },
    });
  }

  const imoveisCount = await prisma.imovel.count({
    where: { tenantId, publicado: true, status: 'DISPONIVEL' },
  });

  return (
    <PortaisClient
      slug={tenant.slug}
      feedToken={feedToken}
      imoveisCount={imoveisCount}
    />
  );
}
