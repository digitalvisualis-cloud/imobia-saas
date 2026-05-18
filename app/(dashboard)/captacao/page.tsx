import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CaptacaoClient from './CaptacaoClient';

export const dynamic = 'force-dynamic';

/**
 * /captacao — captacao de imoveis (lado proprietario). Diferente do Funil
 * de Vendas (compradores), aqui o foco eh:
 *   - de onde o proprietario veio (site, indicacao, prospeccao, portal)
 *   - dados do imovel a captar (endereco, tipo, preco pretendido)
 *   - proxima acao (agendar avaliacao, refazer contato, fechar contrato)
 *
 * Reusa o model Lead com tipoLead='VENDEDOR' mas a UI eh otimizada pro
 * fluxo de captacao — nao reusa o Kanban de compradores.
 */
export default async function CaptacaoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  const leads = await prisma.lead.findMany({
    where: { tenantId, tipoLead: 'VENDEDOR' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <CaptacaoClient
      initialLeads={leads.map((l) => ({
        id: l.id,
        nome: l.nome,
        whatsapp: l.whatsapp,
        email: l.email,
        etapa: l.etapa,
        origem: l.origem,
        interesse: l.interesse,
        bairroDesejado: l.bairroDesejado,
        orcamento: l.orcamento ? Number(l.orcamento) : null,
        notas: l.notas,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }))}
    />
  );
}
