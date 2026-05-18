import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ComissoesClient from './ComissoesClient';

export const dynamic = 'force-dynamic';

/**
 * /comissoes — F3. Split de comissoes por contrato.
 * Lista todos os splits (corretor / captador / imobiliaria / parceiros)
 * com KPIs de a-receber, pago, pendentes. Tambem carrega contratos ATIVOS
 * pro picker do modal "Novo split".
 */
export default async function ComissoesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [splits, contratos] = await Promise.all([
    (prisma as any).comissaoSplit.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        contrato: {
          select: {
            id: true,
            cliente: true,
            tipo: true,
            valor: true,
            comissaoPct: true,
            imovel: { select: { codigo: true, titulo: true } },
          },
        },
      },
    }),
    (prisma as any).contrato.findMany({
      where: { tenantId, status: { in: ['ATIVO', 'PENDENTE'] } },
      orderBy: { dataInicio: 'desc' },
      select: {
        id: true,
        cliente: true,
        tipo: true,
        valor: true,
        comissaoPct: true,
        imovel: { select: { codigo: true, titulo: true } },
      },
      take: 200,
    }),
  ]);

  return (
    <ComissoesClient
      initialSplits={splits.map((s: any) => ({
        id: s.id,
        contratoId: s.contratoId,
        contrato: s.contrato
          ? {
              id: s.contrato.id,
              cliente: s.contrato.cliente,
              tipo: s.contrato.tipo,
              valor: Number(s.contrato.valor),
              comissaoPct: Number(s.contrato.comissaoPct),
              imovelCodigo: s.contrato.imovel?.codigo ?? null,
              imovelTitulo: s.contrato.imovel?.titulo ?? null,
            }
          : null,
        beneficiario: s.beneficiario,
        beneficiarioContato: s.beneficiarioContato,
        papel: s.papel as string,
        percentual: s.percentual != null ? Number(s.percentual) : null,
        valorFixo: s.valorFixo != null ? Number(s.valorFixo) : null,
        status: s.status as string,
        pagoEm: s.pagoEm?.toISOString() ?? null,
        observacao: s.observacao,
        createdAt: s.createdAt.toISOString(),
      }))}
      contratos={contratos.map((c: any) => ({
        id: c.id,
        cliente: c.cliente,
        tipo: c.tipo as string,
        valor: Number(c.valor),
        comissaoPct: Number(c.comissaoPct),
        imovelCodigo: c.imovel?.codigo ?? null,
        imovelTitulo: c.imovel?.titulo ?? null,
      }))}
    />
  );
}
