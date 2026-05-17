import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InadimplenciaClient from './InadimplenciaClient';

export const dynamic = 'force-dynamic';

function calc(orig: number, vencISO: string, multaPct: number | null, jurosPct: number | null) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencISO);
  venc.setHours(0, 0, 0, 0);
  const dias = Math.max(0, Math.round((hoje.getTime() - venc.getTime()) / 86_400_000));
  if (dias === 0) return { atualizado: orig, dias: 0, multa: 0, juros: 0 };
  const multa = multaPct != null ? (orig * multaPct) / 100 : 0;
  const juros = jurosPct != null ? (orig * jurosPct * dias) / 100 : 0;
  return { atualizado: orig + multa + juros, dias, multa, juros };
}

/**
 * /inadimplencia — F6. Lista cobrancas em aberto, atrasadas, pagas,
 * negociadas. Hook n8n via campo eventoCobrancaEmitido pra cron
 * rodar lembretes automatizados no upsell.
 */
export default async function InadimplenciaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const [cobrancas, contratos] = await Promise.all([
    (prisma as any).cobranca.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { vencimento: 'asc' }],
      include: {
        contrato: { select: { id: true, cliente: true, tipo: true } },
      },
    }),
    (prisma as any).contrato.findMany({
      where: {
        tenantId,
        tipo: { in: ['ALUGUEL', 'ADMINISTRACAO'] },
        status: { in: ['ATIVO', 'PENDENTE'] },
      },
      orderBy: { dataInicio: 'desc' },
      select: {
        id: true,
        cliente: true,
        clienteContato: true,
        clienteCpfCnpj: true,
        valor: true,
        tipo: true,
        imovel: { select: { codigo: true, titulo: true } },
      },
      take: 200,
    }),
  ]);

  return (
    <InadimplenciaClient
      initialCobrancas={cobrancas.map((c: any) => {
        const vencIso = c.vencimento.toISOString();
        const calced = calc(
          Number(c.valorOriginal),
          vencIso,
          c.multaPct != null ? Number(c.multaPct) : null,
          c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
        );
        return {
          id: c.id,
          contratoId: c.contratoId,
          repasseId: c.repasseId,
          contratoCliente: c.contrato?.cliente ?? null,
          devedorNome: c.devedorNome,
          devedorContato: c.devedorContato,
          devedorCpfCnpj: c.devedorCpfCnpj,
          descricao: c.descricao,
          valorOriginal: Number(c.valorOriginal),
          multaPct: c.multaPct != null ? Number(c.multaPct) : null,
          jurosDiariosPct: c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
          vencimento: vencIso.slice(0, 10),
          status: c.status as string,
          pagoEm: c.pagoEm?.toISOString() ?? null,
          valorPago: c.valorPago != null ? Number(c.valorPago) : null,
          formaPagamento: c.formaPagamento,
          historicoCobranca: Array.isArray(c.historicoCobranca)
            ? (c.historicoCobranca as any[])
            : [],
          observacao: c.observacao,
          ultimaCobrancaEm: c.ultimaCobrancaEm?.toISOString() ?? null,
          valorAtualizado: calced.atualizado,
          diasAtraso: calced.dias,
        };
      })}
      contratos={contratos.map((c: any) => ({
        id: c.id,
        cliente: c.cliente,
        clienteContato: c.clienteContato,
        clienteCpfCnpj: c.clienteCpfCnpj,
        valor: Number(c.valor),
        tipo: c.tipo as string,
        imovelCodigo: c.imovel?.codigo ?? null,
        imovelTitulo: c.imovel?.titulo ?? null,
      }))}
    />
  );
}
