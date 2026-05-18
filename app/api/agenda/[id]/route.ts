import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/agenda/[id] — atualiza evento (parcial)
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

    // Garante ownership
    const existente = await (prisma as any).agendaEvento.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existente) {
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const data: any = {};
    if (typeof body.titulo === 'string') data.titulo = body.titulo.slice(0, 200);
    if (body.descricao !== undefined) data.descricao = body.descricao || null;
    if (body.tipo) data.tipo = body.tipo;
    if (body.status) data.status = body.status;
    if (body.inicio) {
      const d = new Date(body.inicio);
      if (!Number.isNaN(d.getTime())) data.inicio = d;
    }
    if (body.fim) {
      const d = new Date(body.fim);
      if (!Number.isNaN(d.getTime())) data.fim = d;
    }
    if (typeof body.diaInteiro === 'boolean') data.diaInteiro = body.diaInteiro;
    if (body.local !== undefined) data.local = body.local || null;
    if (body.imovelId !== undefined) data.imovelId = body.imovelId || null;
    if (body.leadId !== undefined) data.leadId = body.leadId || null;
    if (body.responsavelId !== undefined) data.responsavelId = body.responsavelId || null;
    if (typeof body.lembrete15Min === 'boolean') data.lembrete15Min = body.lembrete15Min;
    if (typeof body.lembrete1Dia === 'boolean') data.lembrete1Dia = body.lembrete1Dia;

    if (data.inicio && data.fim && data.fim < data.inicio) {
      return NextResponse.json(
        { error: 'fim não pode ser antes de inicio.' },
        { status: 400 },
      );
    }

    const evento = await (prisma as any).agendaEvento.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      evento: {
        ...evento,
        inicio: evento.inicio.toISOString(),
        fim: evento.fim.toISOString(),
        createdAt: evento.createdAt.toISOString(),
        updatedAt: evento.updatedAt.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/agenda/[id]
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

    const result = await (prisma as any).agendaEvento.deleteMany({
      where: { id, tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
