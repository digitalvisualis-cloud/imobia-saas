import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InquilinosClient from './InquilinosClient';

export const dynamic = 'force-dynamic';

/**
 * /inquilinos — F4. Vista derivada de Contratos ALUGUEL+ADMINISTRACAO
 * ATIVOS. Foco no relacionamento com locatario: aluguel mensal,
 * proximo reajuste anual (12m desde ultimoReajusteEm ou dataInicio),
 * renovacao do contrato (dataFim). Acoes: registrar reajuste, renovar
 * contrato, encerrar.
 */
export default async function InquilinosPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const contratos = await (prisma as any).contrato.findMany({
    where: {
      tenantId,
      tipo: { in: ['ALUGUEL', 'ADMINISTRACAO'] },
      status: { in: ['ATIVO', 'PENDENTE'] },
    },
    orderBy: { dataInicio: 'desc' },
    include: {
      imovel: { select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true } },
    },
  });

  return (
    <InquilinosClient
      contratos={contratos.map((c: any) => ({
        id: c.id,
        cliente: c.cliente,
        clienteCpfCnpj: c.clienteCpfCnpj,
        clienteContato: c.clienteContato,
        tipo: c.tipo as string,
        status: c.status as string,
        valor: Number(c.valor),
        dataInicio: c.dataInicio.toISOString().slice(0, 10),
        dataFim: c.dataFim?.toISOString().slice(0, 10) ?? null,
        ultimoReajusteEm: c.ultimoReajusteEm?.toISOString().slice(0, 10) ?? null,
        indexadorReajuste: c.indexadorReajuste ?? null,
        imovel: c.imovel
          ? {
              id: c.imovel.id,
              codigo: c.imovel.codigo,
              titulo: c.imovel.titulo,
              bairro: c.imovel.bairro,
              cidade: c.imovel.cidade,
            }
          : null,
      }))}
    />
  );
}
