import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FinanceiroClient from './FinanceiroClient';

export const dynamic = 'force-dynamic';

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [contratos, imoveis] = await Promise.all([
    (prisma as any).contrato.findMany({
      where: { tenantId },
      orderBy: { dataInicio: 'desc' },
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        lead: { select: { id: true, nome: true } },
      },
    }),
    prisma.imovel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, codigo: true, titulo: true },
    }),
  ]);

  return (
    <FinanceiroClient
      contratosIniciais={contratos.map((c: any) => ({
        id: c.id,
        cliente: c.cliente,
        clienteCpfCnpj: c.clienteCpfCnpj,
        clienteContato: c.clienteContato,
        imovelId: c.imovelId,
        imovelCodigo: c.imovel?.codigo ?? null,
        imovelTitulo: c.imovel?.titulo ?? null,
        leadId: c.leadId,
        leadNome: c.lead?.nome ?? null,
        tipo: c.tipo as unknown as string,
        status: c.status as unknown as string,
        valor: Number(c.valor),
        comissaoPct: Number(c.comissaoPct),
        dataInicio: c.dataInicio.toISOString().slice(0, 10),
        dataFim: c.dataFim?.toISOString().slice(0, 10) ?? null,
        pdfUrl: c.pdfUrl,
        pdfNome: c.pdfNome,
        observacoes: c.observacoes,
      }))}
      imoveis={imoveis.map((i) => ({
        id: i.id,
        codigo: i.codigo,
        titulo: i.titulo,
      }))}
    />
  );
}
