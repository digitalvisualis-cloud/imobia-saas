import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agenda?from=ISO&to=ISO&tipo=VISITA
 * Lista eventos do tenant. Filtros opcionais por intervalo e tipo.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const url = req.nextUrl;
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const tipo = url.searchParams.get('tipo');

    const where: any = { tenantId };
    if (from || to) {
      where.inicio = {};
      if (from) where.inicio.gte = new Date(from);
      if (to) where.inicio.lte = new Date(to);
    }
    if (tipo) where.tipo = tipo;

    const eventos = await (prisma as any).agendaEvento.findMany({
      where,
      orderBy: { inicio: 'asc' },
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true, capaUrl: true } },
        lead: { select: { id: true, nome: true, whatsapp: true } },
        responsavel: { select: { id: true, nome: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      eventos: eventos.map((e: any) => ({
        ...e,
        inicio: e.inicio.toISOString(),
        fim: e.fim.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/agenda — cria evento
 *
 * Body: {
 *   titulo, descricao?, tipo, status?, inicio (ISO), fim (ISO), diaInteiro?,
 *   local?, imovelId?, leadId?, responsavelId?,
 *   lembrete15Min?, lembrete1Dia?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    const userId = (session.user as any).id as string;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    if (!body.titulo || !body.inicio || !body.fim) {
      return NextResponse.json(
        { error: 'titulo, inicio e fim são obrigatórios.' },
        { status: 400 },
      );
    }

    const inicio = new Date(body.inicio);
    const fim = new Date(body.fim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return NextResponse.json({ error: 'inicio/fim inválidos.' }, { status: 400 });
    }
    if (fim < inicio) {
      return NextResponse.json(
        { error: 'fim não pode ser antes de inicio.' },
        { status: 400 },
      );
    }

    // Garante ownership de imovelId / leadId se vierem
    if (body.imovelId) {
      const ok = await prisma.imovel.findFirst({
        where: { id: body.imovelId, tenantId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json({ error: 'Imóvel não encontrado.' }, { status: 404 });
      }
    }
    if (body.leadId) {
      const ok = await prisma.lead.findFirst({
        where: { id: body.leadId, tenantId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
      }
    }

    const evento = await (prisma as any).agendaEvento.create({
      data: {
        tenantId,
        titulo: String(body.titulo).slice(0, 200),
        descricao: body.descricao ?? null,
        tipo: body.tipo ?? 'VISITA',
        status: body.status ?? 'AGENDADO',
        inicio,
        fim,
        diaInteiro: !!body.diaInteiro,
        local: body.local ?? null,
        imovelId: body.imovelId ?? null,
        leadId: body.leadId ?? null,
        responsavelId: body.responsavelId ?? userId,
        lembrete15Min: body.lembrete15Min ?? true,
        lembrete1Dia: body.lembrete1Dia ?? false,
      },
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
