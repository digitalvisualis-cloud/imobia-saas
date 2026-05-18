import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/comissoes?status=PENDENTE|PAGO|CANCELADO&contratoId=X
 * Lista splits do tenant com dados do contrato.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const status = req.nextUrl.searchParams.get('status');
  const contratoId = req.nextUrl.searchParams.get('contratoId');

  const where: any = { tenantId };
  if (status === 'PENDENTE' || status === 'PAGO' || status === 'CANCELADO') where.status = status;
  if (contratoId) where.contratoId = contratoId;

  const data = await (prisma as any).comissaoSplit.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      contrato: {
        select: {
          id: true,
          cliente: true,
          tipo: true,
          valor: true,
          comissaoPct: true,
          dataInicio: true,
          imovel: { select: { id: true, codigo: true, titulo: true } },
        },
      },
    },
  });

  return NextResponse.json({
    data: data.map((s: any) => ({
      ...s,
      percentual: s.percentual != null ? Number(s.percentual) : null,
      valorFixo: s.valorFixo != null ? Number(s.valorFixo) : null,
      pagoEm: s.pagoEm?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      contrato: s.contrato
        ? {
            ...s.contrato,
            valor: Number(s.contrato.valor),
            comissaoPct: Number(s.contrato.comissaoPct),
            dataInicio: s.contrato.dataInicio.toISOString(),
          }
        : null,
    })),
  });
}

/** POST /api/comissoes — cria novo split atrelado a um contrato */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'body invalido' }, { status: 400 });

  const { contratoId, beneficiario, beneficiarioContato, papel, percentual, valorFixo, observacao } =
    body;
  if (!contratoId || !beneficiario?.trim()) {
    return NextResponse.json(
      { error: 'contratoId e beneficiario obrigatorios' },
      { status: 400 },
    );
  }
  if (percentual == null && valorFixo == null) {
    return NextResponse.json(
      { error: 'informe percentual OU valorFixo' },
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

  const novo = await (prisma as any).comissaoSplit.create({
    data: {
      tenantId,
      contratoId,
      beneficiario: String(beneficiario).slice(0, 200),
      beneficiarioContato: beneficiarioContato?.trim() || null,
      papel: papel || 'VENDEDOR',
      percentual: percentual != null ? Number(percentual) : null,
      valorFixo: valorFixo != null ? Number(valorFixo) : null,
      observacao: observacao?.trim() || null,
    },
  });

  return NextResponse.json(
    {
      ...novo,
      percentual: novo.percentual != null ? Number(novo.percentual) : null,
      valorFixo: novo.valorFixo != null ? Number(novo.valorFixo) : null,
      pagoEm: novo.pagoEm?.toISOString() ?? null,
      createdAt: novo.createdAt.toISOString(),
      updatedAt: novo.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}

/**
 * PATCH /api/comissoes?id=X — edita ou marca como pago/cancelado
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).comissaoSplit.findFirst({
    where: { id, tenantId },
  });
  if (!existing) return NextResponse.json({ error: 'Split nao encontrado' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  if (body.status === 'PAGO' && existing.status !== 'PAGO') {
    data.status = 'PAGO';
    data.pagoEm = body.pagoEm ? new Date(body.pagoEm) : new Date();
  } else if (body.status === 'PENDENTE' && existing.status === 'PAGO') {
    data.status = 'PENDENTE';
    data.pagoEm = null;
  } else if (body.status === 'CANCELADO') {
    data.status = 'CANCELADO';
  } else if (body.status === 'PENDENTE') {
    data.status = 'PENDENTE';
  }

  if (typeof body.beneficiario === 'string') data.beneficiario = body.beneficiario.trim();
  if (body.beneficiarioContato !== undefined)
    data.beneficiarioContato = body.beneficiarioContato?.trim() || null;
  if (body.papel) data.papel = body.papel;
  if (body.percentual !== undefined)
    data.percentual = body.percentual == null ? null : Number(body.percentual);
  if (body.valorFixo !== undefined)
    data.valorFixo = body.valorFixo == null ? null : Number(body.valorFixo);
  if (body.observacao !== undefined) data.observacao = body.observacao?.trim() || null;
  if (typeof body.eventoCobrancaEmitido === 'boolean')
    data.eventoCobrancaEmitido = body.eventoCobrancaEmitido;

  const updated = await (prisma as any).comissaoSplit.update({ where: { id }, data });
  return NextResponse.json({
    ...updated,
    percentual: updated.percentual != null ? Number(updated.percentual) : null,
    valorFixo: updated.valorFixo != null ? Number(updated.valorFixo) : null,
    pagoEm: updated.pagoEm?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/** DELETE /api/comissoes?id=X */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await (prisma as any).comissaoSplit.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

  await (prisma as any).comissaoSplit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
