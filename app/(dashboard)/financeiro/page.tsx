import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FinanceiroClient from './FinanceiroClient';

export const dynamic = 'force-dynamic';

/**
 * /financeiro — F7. Pipeline agregador read-only. Cruza:
 * - Contratos (MRR de aluguel/admin, valor em venda, comissao estimada)
 * - Comissoes splits (a-receber, pago)
 * - Repasses (a-repassar, repassado)
 * - Cobrancas (em aberto, atrasado, recebido)
 * - Performance por beneficiario/papel
 *
 * Acoes operacionais ficam nas paginas dedicadas (/contratos,
 * /comissoes, /repasses, /inadimplencia). Aqui so leitura agregada.
 */
export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [contratos, splits, repasses, cobrancas] = await Promise.all([
    (prisma as any).contrato.findMany({
      where: { tenantId },
      select: { id: true, tipo: true, status: true, valor: true, comissaoPct: true, dataInicio: true, dataFim: true },
    }),
    (prisma as any).comissaoSplit.findMany({
      where: { tenantId },
      select: {
        id: true,
        beneficiario: true,
        papel: true,
        percentual: true,
        valorFixo: true,
        status: true,
        pagoEm: true,
        createdAt: true,
        contrato: { select: { valor: true, comissaoPct: true, tipo: true } },
      },
    }),
    (prisma as any).repasse.findMany({
      where: { tenantId },
      select: {
        id: true,
        mesReferencia: true,
        valorBruto: true,
        valorLiquido: true,
        outrosDescontos: true,
        status: true,
        pagoEm: true,
      },
    }),
    (prisma as any).cobranca.findMany({
      where: { tenantId },
      select: {
        id: true,
        valorOriginal: true,
        valorPago: true,
        status: true,
        vencimento: true,
        pagoEm: true,
        multaPct: true,
        jurosDiariosPct: true,
      },
    }),
  ]);

  return (
    <FinanceiroClient
      contratos={contratos.map((c: any) => ({
        id: c.id,
        tipo: c.tipo as string,
        status: c.status as string,
        valor: Number(c.valor),
        comissaoPct: Number(c.comissaoPct),
        dataInicio: c.dataInicio.toISOString(),
        dataFim: c.dataFim?.toISOString() ?? null,
      }))}
      splits={splits.map((s: any) => ({
        id: s.id,
        beneficiario: s.beneficiario,
        papel: s.papel as string,
        percentual: s.percentual != null ? Number(s.percentual) : null,
        valorFixo: s.valorFixo != null ? Number(s.valorFixo) : null,
        status: s.status as string,
        pagoEm: s.pagoEm?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        contratoValor: s.contrato ? Number(s.contrato.valor) : 0,
        contratoComissaoPct: s.contrato ? Number(s.contrato.comissaoPct) : 0,
        contratoTipo: s.contrato?.tipo ?? null,
      }))}
      repasses={repasses.map((r: any) => ({
        id: r.id,
        mesReferencia: r.mesReferencia,
        valorBruto: Number(r.valorBruto),
        valorLiquido: Number(r.valorLiquido),
        outrosDescontos: Number(r.outrosDescontos),
        status: r.status as string,
        pagoEm: r.pagoEm?.toISOString() ?? null,
      }))}
      cobrancas={cobrancas.map((c: any) => ({
        id: c.id,
        valorOriginal: Number(c.valorOriginal),
        valorPago: c.valorPago != null ? Number(c.valorPago) : null,
        status: c.status as string,
        vencimento: c.vencimento.toISOString(),
        pagoEm: c.pagoEm?.toISOString() ?? null,
        multaPct: c.multaPct != null ? Number(c.multaPct) : null,
        jurosDiariosPct: c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
      }))}
    />
  );
}
