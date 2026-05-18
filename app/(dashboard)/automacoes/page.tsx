import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { REGRAS_DEFAULT, EVENTOS_LIST } from '@/lib/automacoes-defaults';
import AutomacoesClient from './AutomacoesClient';

export const dynamic = 'force-dynamic';

/**
 * /automacoes — Configuracao da regua de mensagens automaticas.
 * Foco em quem manda (inquilinos cadastrados ja tem whats/email) e
 * em quando (offsets relativos ao evento). Endpoint cron consumido
 * pelo n8n eh interno; user nao precisa ver URL nem secret.
 */
export default async function AutomacoesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;

  // Carrega regras persistidas (se nao existir, page usa defaults).
  const existing = await (prisma as any).regraAutomacao.findMany({
    where: { tenantId },
  });
  const map = new Map(existing.map((r: any) => [r.evento, r]));

  const regras = EVENTOS_LIST.map((evento) => {
    const def = REGRAS_DEFAULT[evento];
    const row = map.get(evento) as any;
    return {
      evento,
      titulo: def.titulo,
      descricao: def.descricao,
      origem: def.origem,
      ativo: row ? row.ativo : false,
      canais: row?.canais?.length ? row.canais : def.defaultCanais,
      offsetsDias: row?.offsetsDias?.length ? row.offsetsDias : def.defaultOffsets,
      mensagemWpp: row?.mensagemWpp ?? def.defaultWpp,
      mensagemEmail: row?.mensagemEmail ?? def.defaultEmail,
    };
  });

  // Lista de inquilinos ativos (contratos ALUGUEL/ADMINISTRACAO em andamento).
  // Filtra so quem tem WhatsApp ou e-mail cadastrado.
  const contratos = await (prisma as any).contrato.findMany({
    where: {
      tenantId,
      tipo: { in: ['ALUGUEL', 'ADMINISTRACAO'] },
      status: { in: ['ATIVO', 'PENDENTE'] },
    },
    orderBy: { dataInicio: 'desc' },
    include: { imovel: { select: { codigo: true, titulo: true } } },
  });

  const inquilinos = contratos.map((c: any) => {
    const contato = c.clienteContato ?? '';
    const digits = contato.replace(/\D/g, '');
    const isEmail = /@/.test(contato);
    return {
      id: c.id,
      nome: c.cliente,
      contato,
      temWpp: digits.length >= 10,
      temEmail: isEmail,
      imovelCodigo: c.imovel?.codigo ?? null,
      imovelTitulo: c.imovel?.titulo ?? null,
      tipo: c.tipo as string,
      valor: Number(c.valor),
      dataFim: c.dataFim?.toISOString().slice(0, 10) ?? null,
    };
  });

  return <AutomacoesClient regras={regras} inquilinos={inquilinos} />;
}
