import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeImoveis } from '@/lib/serialize';
import ImoveisClient from './ImoveisClient';

export default async function ImoveisPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const tenantId = (session.user as any).tenantId as string;

  const imoveis = await prisma.imovel.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return <ImoveisClient imoveis={serializeImoveis(imoveis)} />;
}
