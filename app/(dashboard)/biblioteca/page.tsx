import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BibliotecaClient from './BibliotecaClient';

export const dynamic = 'force-dynamic';

/**
 * /biblioteca — artes salvas pelo editor /conteudo. Agrupa por imovel.
 */
export default async function BibliotecaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const items = await (prisma as any).postGeradoLib.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <BibliotecaClient
      items={items.map((i: any) => ({
        id: i.id,
        imovelId: i.imovelId,
        imovelTitulo: i.imovelTitulo,
        imovelLocal: i.imovelLocal,
        templateId: i.templateId,
        templateNome: i.templateNome,
        formato: i.formato,
        formatoLabel: i.formatoLabel,
        thumbUrl: i.thumbUrl,
        copy: i.copy,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
