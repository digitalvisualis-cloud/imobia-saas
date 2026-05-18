import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ControleChavesClient from './ControleChavesClient';

export const dynamic = 'force-dynamic';

/**
 * /controle-chaves — listagem e gestao das chaves dos imoveis.
 * Server-side: carrega retiradas + imoveis disponiveis (pra picker no
 * modal "+ Nova retirada"). Cliente faz CRUD via /api/chaves.
 */
export default async function ControleChavesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [retiradas, imoveis] = await Promise.all([
    prisma.chaveRetirada.findMany({
      where: { tenantId },
      include: { imovel: { select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true } } },
      orderBy: [{ status: 'asc' }, { retiradaEm: 'desc' }],
      take: 200,
    }),
    prisma.imovel.findMany({
      where: { tenantId },
      select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true },
      orderBy: { codigo: 'asc' },
    }),
  ]);

  return (
    <ControleChavesClient
      initialRetiradas={retiradas.map((r) => ({
        ...r,
        retiradaEm: r.retiradaEm.toISOString(),
        prazoDevolucao: r.prazoDevolucao?.toISOString() ?? null,
        devolvidaEm: r.devolvidaEm?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
      imoveis={imoveis}
    />
  );
}
