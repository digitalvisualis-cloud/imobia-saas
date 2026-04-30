import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/contratos/[id] — atualiza parcial
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    const { id } = await ctx.params;

    const existente = await (prisma as any).contrato.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existente) {
      return NextResponse.json(
        { error: 'Contrato não encontrado.' },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const data: any = {};
    if (typeof body.cliente === 'string') data.cliente = body.cliente.slice(0, 200);
    if (body.clienteCpfCnpj !== undefined) data.clienteCpfCnpj = body.clienteCpfCnpj || null;
    if (body.clienteContato !== undefined) data.clienteContato = body.clienteContato || null;
    if (body.tipo) data.tipo = body.tipo;
    if (body.status) data.status = body.status;
    if (body.valor != null) data.valor = Number(body.valor);
    if (body.comissaoPct != null) data.comissaoPct = Number(body.comissaoPct);
    if (body.dataInicio) {
      const d = new Date(body.dataInicio);
      if (!Number.isNaN(d.getTime())) data.dataInicio = d;
    }
    if (body.dataFim !== undefined) {
      if (!body.dataFim) data.dataFim = null;
      else {
        const d = new Date(body.dataFim);
        if (!Number.isNaN(d.getTime())) data.dataFim = d;
      }
    }
    if (body.imovelId !== undefined) data.imovelId = body.imovelId || null;
    if (body.leadId !== undefined) data.leadId = body.leadId || null;
    if (body.pdfUrl !== undefined) data.pdfUrl = body.pdfUrl || null;
    if (body.pdfNome !== undefined) data.pdfNome = body.pdfNome || null;
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;

    if (data.dataInicio && data.dataFim && data.dataFim < data.dataInicio) {
      return NextResponse.json(
        { error: 'dataFim não pode ser antes de dataInicio.' },
        { status: 400 },
      );
    }

    const contrato = await (prisma as any).contrato.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      contrato: {
        ...contrato,
        valor: Number(contrato.valor),
        comissaoPct: Number(contrato.comissaoPct),
        dataInicio: contrato.dataInicio.toISOString(),
        dataFim: contrato.dataFim?.toISOString() ?? null,
        createdAt: contrato.createdAt.toISOString(),
        updatedAt: contrato.updatedAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/contratos/[id]
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    const { id } = await ctx.params;

    const result = await (prisma as any).contrato.deleteMany({
      where: { id, tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
