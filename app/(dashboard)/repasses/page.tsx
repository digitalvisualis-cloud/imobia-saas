import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RepassesClient from './RepassesClient';

export const dynamic = 'force-dynamic';

/**
 * /repasses — F5. Locacao administrada: cada mes/contrato vira 1
 * linha. Bruto recebido do inquilino → menos taxa de adm → menos
 * descontos avulsos → liquido a repassar pro proprietario.
 */
export default async function RepassesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [repasses, contratos] = await Promise.all([
    (prisma as any).repasse.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { mesReferencia: 'desc' }],
      include: {
        contrato: {
          select: {
            id: true,
            cliente: true,
            tipo: true,
            valor: true,
            imovel: { select: { codigo: true, titulo: true } },
          },
        },
      },
    }),
    (prisma as any).contrato.findMany({
      where: {
        tenantId,
        tipo: { in: ['ADMINISTRACAO', 'ALUGUEL'] },
        status: { in: ['ATIVO', 'PENDENTE'] },
      },
      orderBy: { dataInicio: 'desc' },
      select: {
        id: true,
        cliente: true,
        tipo: true,
        valor: true,
        imovel: { select: { codigo: true, titulo: true } },
      },
      take: 200,
    }),
  ]);

  return (
    <RepassesClient
      initialRepasses={repasses.map((r: any) => ({
        id: r.id,
        contratoId: r.contratoId,
        contrato: r.contrato
          ? {
              id: r.contrato.id,
              cliente: r.contrato.cliente,
              tipo: r.contrato.tipo as string,
              valor: Number(r.contrato.valor),
              imovelCodigo: r.contrato.imovel?.codigo ?? null,
              imovelTitulo: r.contrato.imovel?.titulo ?? null,
            }
          : null,
        proprietarioNome: r.proprietarioNome,
        proprietarioContato: r.proprietarioContato,
        proprietarioConta: r.proprietarioConta,
        mesReferencia: r.mesReferencia,
        valorBruto: Number(r.valorBruto),
        taxaAdmPct: r.taxaAdmPct != null ? Number(r.taxaAdmPct) : null,
        taxaAdmFixa: r.taxaAdmFixa != null ? Number(r.taxaAdmFixa) : null,
        outrosDescontos: Number(r.outrosDescontos),
        descontosNotas: r.descontosNotas,
        valorLiquido: Number(r.valorLiquido),
        status: r.status as string,
        pagoEm: r.pagoEm?.toISOString() ?? null,
        comprovanteUrl: r.comprovanteUrl,
        observacao: r.observacao,
      }))}
      contratos={contratos.map((c: any) => ({
        id: c.id,
        cliente: c.cliente,
        tipo: c.tipo as string,
        valor: Number(c.valor),
        imovelCodigo: c.imovel?.codigo ?? null,
        imovelTitulo: c.imovel?.titulo ?? null,
      }))}
    />
  );
}
