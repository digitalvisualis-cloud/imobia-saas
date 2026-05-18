import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contratos?status=ATIVO&tipo=VENDA
 * Lista contratos do tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const status = req.nextUrl.searchParams.get('status');
    const tipo = req.nextUrl.searchParams.get('tipo');

    const where: any = { tenantId };
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    const contratos = await (prisma as any).contrato.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true, capaUrl: true } },
        lead: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json({
      contratos: contratos.map((c: any) => ({
        ...c,
        valor: Number(c.valor),
        comissaoPct: Number(c.comissaoPct),
        dataInicio: c.dataInicio.toISOString(),
        dataFim: c.dataFim?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/contratos — cria contrato
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }
    if (!body.cliente || body.valor == null || !body.dataInicio) {
      return NextResponse.json(
        { error: 'cliente, valor e dataInicio são obrigatórios.' },
        { status: 400 },
      );
    }

    const dataInicio = new Date(body.dataInicio);
    if (Number.isNaN(dataInicio.getTime())) {
      return NextResponse.json(
        { error: 'dataInicio inválida.' },
        { status: 400 },
      );
    }
    let dataFim: Date | null = null;
    if (body.dataFim) {
      const d = new Date(body.dataFim);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'dataFim inválida.' }, { status: 400 });
      }
      if (d < dataInicio) {
        return NextResponse.json(
          { error: 'dataFim não pode ser antes de dataInicio.' },
          { status: 400 },
        );
      }
      dataFim = d;
    }

    // Garante ownership de imovelId / leadId se vierem
    if (body.imovelId) {
      const ok = await prisma.imovel.findFirst({
        where: { id: body.imovelId, tenantId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { error: 'Imóvel não encontrado.' },
          { status: 404 },
        );
      }
    }
    if (body.leadId) {
      const ok = await prisma.lead.findFirst({
        where: { id: body.leadId, tenantId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { error: 'Lead não encontrado.' },
          { status: 404 },
        );
      }
    }

    const contrato = await (prisma as any).contrato.create({
      data: {
        tenantId,
        imovelId: body.imovelId ?? null,
        leadId: body.leadId ?? null,
        cliente: String(body.cliente).slice(0, 200),
        clienteCpfCnpj: body.clienteCpfCnpj ?? null,
        clienteContato: body.clienteContato ?? null,
        tipo: body.tipo ?? 'VENDA',
        status: body.status ?? 'ATIVO',
        valor: Number(body.valor) || 0,
        comissaoPct: Number(body.comissaoPct) || 0,
        dataInicio,
        dataFim,
        pdfUrl: body.pdfUrl ?? null,
        pdfNome: body.pdfNome ?? null,
        observacoes: body.observacoes ?? null,
      },
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
