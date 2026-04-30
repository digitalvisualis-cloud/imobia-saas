import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AgendaClient from './AgendaClient';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  // Carrega eventos do mês corrente +/- 1 mês (90 dias) — suficiente
  // pra renderizar mês/semana/dia no calendário
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 2, 0, 23, 59, 59);

  const [eventos, imoveis] = await Promise.all([
    (prisma as any).agendaEvento.findMany({
      where: {
        tenantId,
        inicio: { gte: inicio, lte: fim },
      },
      orderBy: { inicio: 'asc' },
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        lead: { select: { id: true, nome: true } },
      },
    }),
    prisma.imovel.findMany({
      where: { tenantId, publicado: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        codigo: true,
        titulo: true,
        bairro: true,
        cidade: true,
      },
    }),
  ]);

  return (
    <AgendaClient
      eventos={eventos.map((e: any) => ({
        id: e.id,
        titulo: e.titulo,
        descricao: e.descricao,
        tipo: e.tipo as unknown as string,
        status: e.status as unknown as string,
        inicio: e.inicio.toISOString(),
        fim: e.fim.toISOString(),
        diaInteiro: e.diaInteiro,
        local: e.local,
        imovelId: e.imovelId,
        leadId: e.leadId,
        imovelCodigo: e.imovel?.codigo ?? null,
        imovelTitulo: e.imovel?.titulo ?? null,
        leadNome: e.lead?.nome ?? null,
      }))}
      imoveis={imoveis.map((i: any) => ({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
        local: [i.bairro, i.cidade].filter(Boolean).join(', '),
      }))}
    />
  );
}
