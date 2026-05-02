import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LeadsInboxClient from './LeadsInboxClient';

export const dynamic = 'force-dynamic';

export default async function LeadsInboxPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  // Leads dos últimos 30 dias, ordenados pelo mais novo
  const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: { tenantId, createdAt: { gte: trintaDias } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      imovel: { select: { id: true, codigo: true, titulo: true } },
    },
  });

  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
    select: { nome: true, ativo: true, objetivo: true },
  });

  return (
    <LeadsInboxClient
      leads={leads.map((l) => ({
        id: l.id,
        nome: l.nome,
        whatsapp: l.whatsapp,
        email: l.email,
        etapa: l.etapa as unknown as string,
        temperatura: l.temperatura as unknown as string,
        interesse: l.interesse,
        bairroDesejado: l.bairroDesejado,
        orcamento: l.orcamento ? Number(l.orcamento) : null,
        resumoConversa: l.resumoConversa,
        dataVisita: l.dataVisita?.toISOString() ?? null,
        origem: l.origem,
        notas: l.notas,
        imovel: l.imovel,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }))}
      agente={agente ?? null}
    />
  );
}
