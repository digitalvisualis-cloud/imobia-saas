import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Calcula valor atualizado de uma cobranca:
 * valorOriginal + multa + juros diarios (se atrasada).
 */
function calcValorAtualizado(opts: {
  valorOriginal: number;
  vencimento: Date;
  multaPct?: number | null;
  jurosDiariosPct?: number | null;
  hoje?: Date;
}) {
  const original = Number(opts.valorOriginal) || 0;
  const hoje = opts.hoje ?? new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(opts.vencimento);
  venc.setHours(0, 0, 0, 0);
  const diasAtraso = Math.max(0, Math.round((hoje.getTime() - venc.getTime()) / 86_400_000));
  if (diasAtraso === 0) return { atualizado: original, diasAtraso: 0, multa: 0, juros: 0 };
  const multa = opts.multaPct != null ? (original * Number(opts.multaPct)) / 100 : 0;
  const juros =
    opts.jurosDiariosPct != null
      ? (original * Number(opts.jurosDiariosPct) * diasAtraso) / 100
      : 0;
  return { atualizado: original + multa + juros, diasAtraso, multa, juros };
}

/** GET /api/cobrancas?status=ABERTO|PAGO|NEGOCIADO|CANCELADO&apenasAtrasadas=1 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const status = req.nextUrl.searchParams.get('status');
  const apenasAtrasadas = req.nextUrl.searchParams.get('apenasAtrasadas') === '1';

  const where: any = { tenantId };
  if (status && ['ABERTO', 'PAGO', 'NEGOCIADO', 'CANCELADO'].includes(status))
    where.status = status;
  if (apenasAtrasadas) {
    where.status = 'ABERTO';
    where.vencimento = { lt: new Date() };
  }

  const data = await (prisma as any).cobranca.findMany({
    where,
    orderBy: [{ status: 'asc' }, { vencimento: 'asc' }],
    include: {
      contrato: { select: { id: true, cliente: true, tipo: true } },
      repasse: { select: { id: true, mesReferencia: true } },
    },
  });

  return NextResponse.json({
    data: data.map((c: any) => {
      const calc = calcValorAtualizado({
        valorOriginal: Number(c.valorOriginal),
        vencimento: c.vencimento,
        multaPct: c.multaPct != null ? Number(c.multaPct) : null,
        jurosDiariosPct: c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
      });
      return {
        ...c,
        valorOriginal: Number(c.valorOriginal),
        multaPct: c.multaPct != null ? Number(c.multaPct) : null,
        jurosDiariosPct: c.jurosDiariosPct != null ? Number(c.jurosDiariosPct) : null,
        valorPago: c.valorPago != null ? Number(c.valorPago) : null,
        vencimento: c.vencimento.toISOString(),
        pagoEm: c.pagoEm?.toISOString() ?? null,
        ultimaCobrancaEm: c.ultimaCobrancaEm?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        valorAtualizado: calc.atualizado,
        diasAtraso: calc.diasAtraso,
        multaCalc: calc.multa,
        jurosCalc: calc.juros,
      };
    }),
  });
}

/** POST /api/cobrancas */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'body invalido' }, { status: 400 });

  const {
    contratoId,
    repasseId,
    devedorNome,
    devedorContato,
    devedorCpfCnpj,
    descricao,
    valorOriginal,
    multaPct,
    jurosDiariosPct,
    vencimento,
    observacao,
  } = body;

  if (!devedorNome?.trim() || !descricao?.trim() || valorOriginal == null || !vencimento) {
    return NextResponse.json(
      { error: 'devedorNome, descricao, valorOriginal e vencimento obrigatorios' },
      { status: 400 },
    );
  }
  const venc = new Date(vencimento);
  if (Number.isNaN(venc.getTime())) {
    return NextResponse.json({ error: 'vencimento invalido' }, { status: 400 });
  }

  // Ownership guard nos links opcionais
  if (contratoId) {
    const ok = await (prisma as any).contrato.findFirst({
      where: { id: contratoId, tenantId },
      select: { id: true },
    });
    if (!ok) return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 });
  }
  if (repasseId) {
    const ok = await (prisma as any).repasse.findFirst({
      where: { id: repasseId, tenantId },
      select: { id: true },
    });
    if (!ok) return NextResponse.json({ error: 'Repasse nao encontrado' }, { status: 404 });
  }

  const nova = await (prisma as any).cobranca.create({
    data: {
      tenantId,
      contratoId: contratoId || null,
      repasseId: repasseId || null,
      devedorNome: String(devedorNome).slice(0, 200),
      devedorContato: devedorContato?.trim() || null,
      devedorCpfCnpj: devedorCpfCnpj?.trim() || null,
      descricao: String(descricao).slice(0, 500),
      valorOriginal: Number(valorOriginal),
      multaPct: multaPct != null ? Number(multaPct) : null,
      jurosDiariosPct: jurosDiariosPct != null ? Number(jurosDiariosPct) : null,
      vencimento: venc,
      observacao: observacao?.trim() || null,
    },
  });

  return NextResponse.json(
    {
      ...nova,
      valorOriginal: Number(nova.valorOriginal),
      multaPct: nova.multaPct != null ? Number(nova.multaPct) : null,
      jurosDiariosPct: nova.jurosDiariosPct != null ? Number(nova.jurosDiariosPct) : null,
      valorPago: nova.valorPago != null ? Number(nova.valorPago) : null,
      vencimento: nova.vencimento.toISOString(),
      pagoEm: nova.pagoEm?.toISOString() ?? null,
      ultimaCobrancaEm: nova.ultimaCobrancaEm?.toISOString() ?? null,
      createdAt: nova.createdAt.toISOString(),
      updatedAt: nova.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}

/** PATCH /api/cobrancas?id=X */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).cobranca.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  // Transicao de status
  if (body.status === 'PAGO' && existing.status !== 'PAGO') {
    data.status = 'PAGO';
    data.pagoEm = body.pagoEm ? new Date(body.pagoEm) : new Date();
    if (body.valorPago != null) data.valorPago = Number(body.valorPago);
    else {
      // se nao informou, assume valor atualizado
      const calc = calcValorAtualizado({
        valorOriginal: Number(existing.valorOriginal),
        vencimento: existing.vencimento,
        multaPct: existing.multaPct != null ? Number(existing.multaPct) : null,
        jurosDiariosPct: existing.jurosDiariosPct != null ? Number(existing.jurosDiariosPct) : null,
      });
      data.valorPago = calc.atualizado;
    }
    if (body.formaPagamento) data.formaPagamento = String(body.formaPagamento).slice(0, 100);
  } else if (body.status === 'ABERTO') {
    data.status = 'ABERTO';
    if (existing.status === 'PAGO') {
      data.pagoEm = null;
      data.valorPago = null;
    }
  } else if (body.status === 'NEGOCIADO') {
    data.status = 'NEGOCIADO';
  } else if (body.status === 'CANCELADO') {
    data.status = 'CANCELADO';
  }

  // Campos editaveis
  if (typeof body.devedorNome === 'string') data.devedorNome = body.devedorNome.trim();
  if (body.devedorContato !== undefined) data.devedorContato = body.devedorContato?.trim() || null;
  if (body.devedorCpfCnpj !== undefined) data.devedorCpfCnpj = body.devedorCpfCnpj?.trim() || null;
  if (typeof body.descricao === 'string') data.descricao = body.descricao.trim();
  if (body.valorOriginal != null) data.valorOriginal = Number(body.valorOriginal);
  if (body.multaPct !== undefined)
    data.multaPct = body.multaPct == null ? null : Number(body.multaPct);
  if (body.jurosDiariosPct !== undefined)
    data.jurosDiariosPct = body.jurosDiariosPct == null ? null : Number(body.jurosDiariosPct);
  if (body.vencimento) {
    const d = new Date(body.vencimento);
    if (!Number.isNaN(d.getTime())) data.vencimento = d;
  }
  if (body.observacao !== undefined) data.observacao = body.observacao?.trim() || null;
  if (body.formaPagamento !== undefined)
    data.formaPagamento = body.formaPagamento?.trim() || null;

  // Adicionar entrada no historico de cobranca (canal manual, log de tentativa)
  if (body.adicionarHistorico) {
    const h = body.adicionarHistorico;
    const novoHist = Array.isArray(existing.historicoCobranca) ? existing.historicoCobranca : [];
    novoHist.push({
      data: new Date().toISOString(),
      canal: h.canal ?? 'manual',
      status: h.status ?? 'enviado',
      conteudo: h.conteudo ?? null,
    });
    data.historicoCobranca = novoHist;
    data.ultimaCobrancaEm = new Date();
    data.eventoCobrancaEmitido = true; // flag pra n8n nao duplicar no mesmo dia
  }

  if (typeof body.eventoCobrancaEmitido === 'boolean')
    data.eventoCobrancaEmitido = body.eventoCobrancaEmitido;

  const updated = await (prisma as any).cobranca.update({ where: { id }, data });

  const calc = calcValorAtualizado({
    valorOriginal: Number(updated.valorOriginal),
    vencimento: updated.vencimento,
    multaPct: updated.multaPct != null ? Number(updated.multaPct) : null,
    jurosDiariosPct: updated.jurosDiariosPct != null ? Number(updated.jurosDiariosPct) : null,
  });

  return NextResponse.json({
    ...updated,
    valorOriginal: Number(updated.valorOriginal),
    multaPct: updated.multaPct != null ? Number(updated.multaPct) : null,
    jurosDiariosPct: updated.jurosDiariosPct != null ? Number(updated.jurosDiariosPct) : null,
    valorPago: updated.valorPago != null ? Number(updated.valorPago) : null,
    vencimento: updated.vencimento.toISOString(),
    pagoEm: updated.pagoEm?.toISOString() ?? null,
    ultimaCobrancaEm: updated.ultimaCobrancaEm?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    valorAtualizado: calc.atualizado,
    diasAtraso: calc.diasAtraso,
    multaCalc: calc.multa,
    jurosCalc: calc.juros,
  });
}

/** DELETE /api/cobrancas?id=X */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).cobranca.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 });

  await (prisma as any).cobranca.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
