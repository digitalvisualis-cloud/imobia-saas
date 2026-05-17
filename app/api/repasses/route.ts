import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Calcula valor liquido a partir de bruto + taxa adm + descontos.
 * Taxa adm pode ser % do bruto OU valor fixo (% tem prioridade se vier).
 */
function calcLiquido(opts: {
  valorBruto: number;
  taxaAdmPct?: number | null;
  taxaAdmFixa?: number | null;
  outrosDescontos?: number;
}) {
  const bruto = Number(opts.valorBruto) || 0;
  const pct = opts.taxaAdmPct != null ? Number(opts.taxaAdmPct) : null;
  const fixa = opts.taxaAdmFixa != null ? Number(opts.taxaAdmFixa) : null;
  const outros = Number(opts.outrosDescontos ?? 0);
  const taxa = pct != null ? (bruto * pct) / 100 : (fixa ?? 0);
  return Math.max(0, bruto - taxa - outros);
}

/**
 * GET /api/repasses?status=A_REPASSAR&mesReferencia=2026-05&contratoId=X
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const status = req.nextUrl.searchParams.get('status');
  const mes = req.nextUrl.searchParams.get('mesReferencia');
  const contratoId = req.nextUrl.searchParams.get('contratoId');

  const where: any = { tenantId };
  if (status && ['PENDENTE', 'A_REPASSAR', 'PAGO', 'CANCELADO'].includes(status))
    where.status = status;
  if (mes) where.mesReferencia = mes;
  if (contratoId) where.contratoId = contratoId;

  const data = await (prisma as any).repasse.findMany({
    where,
    orderBy: [{ status: 'asc' }, { mesReferencia: 'desc' }],
    include: {
      contrato: {
        select: {
          id: true,
          cliente: true,
          valor: true,
          tipo: true,
          imovel: { select: { id: true, codigo: true, titulo: true } },
        },
      },
    },
  });

  return NextResponse.json({
    data: data.map((r: any) => ({
      ...r,
      valorBruto: Number(r.valorBruto),
      taxaAdmPct: r.taxaAdmPct != null ? Number(r.taxaAdmPct) : null,
      taxaAdmFixa: r.taxaAdmFixa != null ? Number(r.taxaAdmFixa) : null,
      outrosDescontos: Number(r.outrosDescontos),
      valorLiquido: Number(r.valorLiquido),
      pagoEm: r.pagoEm?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      contrato: r.contrato
        ? {
            ...r.contrato,
            valor: Number(r.contrato.valor),
          }
        : null,
    })),
  });
}

/** POST /api/repasses — cria repasse mensal. Calcula liquido automaticamente. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'body invalido' }, { status: 400 });

  const {
    contratoId,
    proprietarioNome,
    proprietarioContato,
    proprietarioConta,
    mesReferencia,
    valorBruto,
    taxaAdmPct,
    taxaAdmFixa,
    outrosDescontos,
    descontosNotas,
    observacao,
  } = body;

  if (!contratoId || !proprietarioNome?.trim() || !mesReferencia || valorBruto == null) {
    return NextResponse.json(
      { error: 'contratoId, proprietarioNome, mesReferencia e valorBruto sao obrigatorios' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}$/.test(mesReferencia)) {
    return NextResponse.json(
      { error: 'mesReferencia formato YYYY-MM' },
      { status: 400 },
    );
  }

  const contrato = await (prisma as any).contrato.findFirst({
    where: { id: contratoId, tenantId },
    select: { id: true },
  });
  if (!contrato) {
    return NextResponse.json({ error: 'Contrato nao encontrado' }, { status: 404 });
  }

  const liquido = calcLiquido({
    valorBruto: Number(valorBruto),
    taxaAdmPct,
    taxaAdmFixa,
    outrosDescontos: Number(outrosDescontos || 0),
  });

  try {
    const novo = await (prisma as any).repasse.create({
      data: {
        tenantId,
        contratoId,
        proprietarioNome: String(proprietarioNome).slice(0, 200),
        proprietarioContato: proprietarioContato?.trim() || null,
        proprietarioConta: proprietarioConta?.trim() || null,
        mesReferencia,
        valorBruto: Number(valorBruto),
        taxaAdmPct: taxaAdmPct != null ? Number(taxaAdmPct) : null,
        taxaAdmFixa: taxaAdmFixa != null ? Number(taxaAdmFixa) : null,
        outrosDescontos: Number(outrosDescontos || 0),
        descontosNotas: descontosNotas?.trim() || null,
        valorLiquido: liquido,
        observacao: observacao?.trim() || null,
      },
    });
    return NextResponse.json(
      {
        ...novo,
        valorBruto: Number(novo.valorBruto),
        taxaAdmPct: novo.taxaAdmPct != null ? Number(novo.taxaAdmPct) : null,
        taxaAdmFixa: novo.taxaAdmFixa != null ? Number(novo.taxaAdmFixa) : null,
        outrosDescontos: Number(novo.outrosDescontos),
        valorLiquido: Number(novo.valorLiquido),
        pagoEm: novo.pagoEm?.toISOString() ?? null,
        createdAt: novo.createdAt.toISOString(),
        updatedAt: novo.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ja existe um repasse para esse contrato/mes' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH /api/repasses?id=X */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).repasse.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Repasse nao encontrado' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  // Transicoes de status
  if (body.status === 'A_REPASSAR' && existing.status !== 'A_REPASSAR') {
    data.status = 'A_REPASSAR';
  } else if (body.status === 'PAGO' && existing.status !== 'PAGO') {
    data.status = 'PAGO';
    data.pagoEm = body.pagoEm ? new Date(body.pagoEm) : new Date();
  } else if (body.status === 'PENDENTE') {
    data.status = 'PENDENTE';
    if (existing.status === 'PAGO') data.pagoEm = null;
  } else if (body.status === 'CANCELADO') {
    data.status = 'CANCELADO';
  }

  // Campos de edicao
  const recalcKeys = ['valorBruto', 'taxaAdmPct', 'taxaAdmFixa', 'outrosDescontos'];
  let recalc = false;
  if (typeof body.proprietarioNome === 'string') data.proprietarioNome = body.proprietarioNome.trim();
  if (body.proprietarioContato !== undefined)
    data.proprietarioContato = body.proprietarioContato?.trim() || null;
  if (body.proprietarioConta !== undefined)
    data.proprietarioConta = body.proprietarioConta?.trim() || null;
  if (body.mesReferencia && /^\d{4}-\d{2}$/.test(body.mesReferencia))
    data.mesReferencia = body.mesReferencia;
  for (const k of recalcKeys) {
    if (body[k] !== undefined) {
      data[k] = body[k] == null ? null : Number(body[k]);
      recalc = true;
    }
  }
  if (body.descontosNotas !== undefined) data.descontosNotas = body.descontosNotas?.trim() || null;
  if (body.comprovanteUrl !== undefined) data.comprovanteUrl = body.comprovanteUrl?.trim() || null;
  if (body.observacao !== undefined) data.observacao = body.observacao?.trim() || null;
  if (typeof body.eventoCobrancaEmitido === 'boolean')
    data.eventoCobrancaEmitido = body.eventoCobrancaEmitido;

  if (recalc) {
    data.valorLiquido = calcLiquido({
      valorBruto: data.valorBruto ?? Number(existing.valorBruto),
      taxaAdmPct: data.taxaAdmPct ?? existing.taxaAdmPct,
      taxaAdmFixa: data.taxaAdmFixa ?? existing.taxaAdmFixa,
      outrosDescontos: data.outrosDescontos ?? Number(existing.outrosDescontos),
    });
  }

  const updated = await (prisma as any).repasse.update({ where: { id }, data });
  return NextResponse.json({
    ...updated,
    valorBruto: Number(updated.valorBruto),
    taxaAdmPct: updated.taxaAdmPct != null ? Number(updated.taxaAdmPct) : null,
    taxaAdmFixa: updated.taxaAdmFixa != null ? Number(updated.taxaAdmFixa) : null,
    outrosDescontos: Number(updated.outrosDescontos),
    valorLiquido: Number(updated.valorLiquido),
    pagoEm: updated.pagoEm?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/** DELETE /api/repasses?id=X */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).repasse.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

  await (prisma as any).repasse.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
