import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/eventos-pendentes?tenantId=X
 * Header: X-Cron-Secret: <env.CRON_SECRET>
 *
 * Endpoint consumido pelo n8n a cada N minutos. Retorna lista de
 * eventos prontos pra disparar (cobrancas atrasadas, contratos
 * vencendo, reajustes proximos, chaves atrasadas, repasses a fazer).
 * Cada evento traz `eventoTipo` + ids e dados necessarios pra o n8n
 * montar a mensagem. Apos disparar, n8n deve POST em
 * /api/cron/marcar-emitido pra setar evento*Emitido=true e nao
 * duplicar.
 *
 * Retornar `eventoTipo` permite o n8n rotear pra branches diferentes:
 * - cobranca_atrasada (regua D+1, D+3, D+7)
 * - contrato_vencendo (30/15/5 dias)
 * - reajuste_proximo (60/30/15 dias antes do aniversario)
 * - chave_atrasada (passou prazoDevolucao)
 * - repasse_aluguel_pendente (passou do dia 5 e nao virou A_REPASSAR)
 *
 * MVP: filtra apenas evento*Emitido=false. n8n marca como emitido
 * apos disparar com sucesso.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId obrigatorio' }, { status: 400 });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em30 = new Date(hoje);
  em30.setDate(em30.getDate() + 30);
  const em60 = new Date(hoje);
  em60.setDate(em60.getDate() + 60);

  // 1. Cobrancas atrasadas (ABERTO, vencimento < hoje, evento nao emitido hoje)
  const cobrancasAtrasadas = await (prisma as any).cobranca.findMany({
    where: {
      tenantId,
      status: 'ABERTO',
      vencimento: { lt: hoje },
      eventoCobrancaEmitido: false,
    },
    select: {
      id: true,
      devedorNome: true,
      devedorContato: true,
      descricao: true,
      valorOriginal: true,
      multaPct: true,
      jurosDiariosPct: true,
      vencimento: true,
      ultimaCobrancaEm: true,
    },
  });

  // 2. Contratos vencendo nos proximos 30d
  const contratosVencendo = await (prisma as any).contrato.findMany({
    where: {
      tenantId,
      status: 'ATIVO',
      dataFim: { gte: hoje, lte: em30 },
      eventoVencimentoEmitido: false,
    },
    select: {
      id: true,
      cliente: true,
      clienteContato: true,
      tipo: true,
      valor: true,
      dataFim: true,
    },
  });

  // 3. Reajustes proximos (60d antes do aniversario)
  // calculo: (ultimoReajusteEm OR dataInicio) + 12m em janela 60d
  const contratosAtivos = await (prisma as any).contrato.findMany({
    where: {
      tenantId,
      status: 'ATIVO',
      tipo: { in: ['ALUGUEL', 'ADMINISTRACAO'] },
      eventoReajusteEmitido: false,
    },
    select: {
      id: true,
      cliente: true,
      clienteContato: true,
      valor: true,
      dataInicio: true,
      ultimoReajusteEm: true,
      indexadorReajuste: true,
    },
  });
  const reajustesProximos = contratosAtivos
    .map((c: any) => {
      const base = c.ultimoReajusteEm ?? c.dataInicio;
      const prox = new Date(base);
      prox.setFullYear(prox.getFullYear() + 1);
      return { contrato: c, proxReajuste: prox };
    })
    .filter((x: any) => x.proxReajuste >= hoje && x.proxReajuste <= em60);

  // 4. Chaves atrasadas (prazoDevolucao < hoje, status RETIRADA, nao emitido)
  const chavesAtrasadas = await (prisma as any).chaveRetirada.findMany({
    where: {
      tenantId,
      status: 'RETIRADA',
      prazoDevolucao: { lt: hoje, not: null },
      eventoAtrasoEmitido: false,
    },
    select: {
      id: true,
      pessoaNome: true,
      pessoaContato: true,
      pessoaTipo: true,
      prazoDevolucao: true,
      imovel: { select: { codigo: true, titulo: true } },
    },
  });

  // 5. Repasses A_REPASSAR ha mais de 5 dias (proprietario esperando)
  const cincoDiasAtras = new Date(hoje);
  cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);
  const repassesPendentes = await (prisma as any).repasse.findMany({
    where: {
      tenantId,
      status: 'A_REPASSAR',
      updatedAt: { lt: cincoDiasAtras },
      eventoCobrancaEmitido: false,
    },
    select: {
      id: true,
      proprietarioNome: true,
      proprietarioContato: true,
      mesReferencia: true,
      valorLiquido: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    tenantId,
    geradoEm: new Date().toISOString(),
    eventos: [
      ...cobrancasAtrasadas.map((c: any) => ({
        eventoTipo: 'cobranca_atrasada',
        recursoTipo: 'cobranca',
        recursoId: c.id,
        destinatarioNome: c.devedorNome,
        destinatarioContato: c.devedorContato,
        dados: {
          descricao: c.descricao,
          valorOriginal: Number(c.valorOriginal),
          multaPct: c.multaPct != null ? Number(c.multaPct) : null,
          jurosDiariosPct: c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
          vencimento: c.vencimento.toISOString(),
          diasAtraso: Math.round(
            (hoje.getTime() - new Date(c.vencimento).setHours(0, 0, 0, 0)) / 86_400_000,
          ),
          ultimaCobrancaEm: c.ultimaCobrancaEm?.toISOString() ?? null,
        },
      })),
      ...contratosVencendo.map((c: any) => ({
        eventoTipo: 'contrato_vencendo',
        recursoTipo: 'contrato',
        recursoId: c.id,
        destinatarioNome: c.cliente,
        destinatarioContato: c.clienteContato,
        dados: {
          tipo: c.tipo,
          valor: Number(c.valor),
          dataFim: c.dataFim?.toISOString() ?? null,
          diasParaVencimento: Math.round(
            (new Date(c.dataFim).setHours(0, 0, 0, 0) - hoje.getTime()) / 86_400_000,
          ),
        },
      })),
      ...reajustesProximos.map(({ contrato: c, proxReajuste }: any) => ({
        eventoTipo: 'reajuste_proximo',
        recursoTipo: 'contrato',
        recursoId: c.id,
        destinatarioNome: c.cliente,
        destinatarioContato: c.clienteContato,
        dados: {
          valorAtual: Number(c.valor),
          indexadorReajuste: c.indexadorReajuste,
          proximoReajusteEm: proxReajuste.toISOString(),
          diasParaReajuste: Math.round(
            (proxReajuste.getTime() - hoje.getTime()) / 86_400_000,
          ),
        },
      })),
      ...chavesAtrasadas.map((c: any) => ({
        eventoTipo: 'chave_atrasada',
        recursoTipo: 'chaveRetirada',
        recursoId: c.id,
        destinatarioNome: c.pessoaNome,
        destinatarioContato: c.pessoaContato,
        dados: {
          pessoaTipo: c.pessoaTipo,
          imovelCodigo: c.imovel?.codigo ?? null,
          imovelTitulo: c.imovel?.titulo ?? null,
          prazoDevolucao: c.prazoDevolucao?.toISOString() ?? null,
        },
      })),
      ...repassesPendentes.map((r: any) => ({
        eventoTipo: 'repasse_pendente',
        recursoTipo: 'repasse',
        recursoId: r.id,
        destinatarioNome: r.proprietarioNome,
        destinatarioContato: r.proprietarioContato,
        dados: {
          mesReferencia: r.mesReferencia,
          valorLiquido: Number(r.valorLiquido),
          aguardandoDesde: r.updatedAt.toISOString(),
        },
      })),
    ],
  });
}
