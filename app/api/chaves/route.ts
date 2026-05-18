import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chaves — lista retiradas do tenant (newest first).
 * Default: traz todas. Filtro via ?status=RETIRADA|DEVOLVIDA.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const status = req.nextUrl.searchParams.get('status');
  const where: any = { tenantId };
  if (status === 'RETIRADA' || status === 'DEVOLVIDA') where.status = status;

  const data = await prisma.chaveRetirada.findMany({
    where,
    include: { imovel: { select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true } } },
    orderBy: [{ status: 'asc' }, { retiradaEm: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ data });
}

/** POST /api/chaves — registra nova retirada de chave. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'body invalido' }, { status: 400 });

  const { imovelId, pessoaNome, pessoaContato, pessoaTipo, prazoDevolucao, notas } = body;
  if (!imovelId || !pessoaNome?.trim()) {
    return NextResponse.json({ error: 'imovelId e pessoaNome obrigatorios' }, { status: 400 });
  }

  // Garante ownership do imovel
  const imv = await prisma.imovel.findFirst({
    where: { id: imovelId, tenantId },
    select: { id: true },
  });
  if (!imv) return NextResponse.json({ error: 'Imovel nao encontrado' }, { status: 404 });

  const novo = await prisma.chaveRetirada.create({
    data: {
      tenantId,
      imovelId,
      pessoaNome: pessoaNome.trim(),
      pessoaContato: pessoaContato?.trim() || null,
      pessoaTipo: pessoaTipo || 'OUTRO',
      prazoDevolucao: prazoDevolucao ? new Date(prazoDevolucao) : null,
      notas: notas?.trim() || null,
    },
    include: { imovel: { select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true } } },
  });
  return NextResponse.json(novo, { status: 201 });
}

/**
 * PATCH /api/chaves?id=X — atualiza retirada. Aceita:
 * - { status: 'DEVOLVIDA' } pra marcar devolucao (seta devolvidaEm = now)
 * - { prazoDevolucao, notas, pessoaNome, etc } pra edicao
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await prisma.chaveRetirada.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Retirada nao encontrada' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (body.status === 'DEVOLVIDA' && existing.status !== 'DEVOLVIDA') {
    data.status = 'DEVOLVIDA';
    data.devolvidaEm = new Date();
  } else if (body.status === 'RETIRADA' && existing.status === 'DEVOLVIDA') {
    data.status = 'RETIRADA';
    data.devolvidaEm = null;
  }
  if (typeof body.pessoaNome === 'string') data.pessoaNome = body.pessoaNome.trim();
  if (typeof body.pessoaContato === 'string') data.pessoaContato = body.pessoaContato.trim() || null;
  if (typeof body.pessoaTipo === 'string') data.pessoaTipo = body.pessoaTipo;
  if (body.prazoDevolucao !== undefined) data.prazoDevolucao = body.prazoDevolucao ? new Date(body.prazoDevolucao) : null;
  if (typeof body.notas === 'string') data.notas = body.notas.trim() || null;

  const updated = await prisma.chaveRetirada.update({
    where: { id },
    data,
    include: { imovel: { select: { id: true, codigo: true, titulo: true, bairro: true, cidade: true } } },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/chaves?id=X */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await prisma.chaveRetirada.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 });

  await prisma.chaveRetirada.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
