import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { REGRAS_DEFAULT, EVENTOS_LIST } from '@/lib/automacoes-defaults';

export const dynamic = 'force-dynamic';

/**
 * GET /api/automacoes
 *
 * Lista regras do tenant. Quando a regra ainda nao existe no banco,
 * retorna a config default (mas nao persiste — so cria quando o user
 * editar/ativar).
 */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

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
      // Estado real do banco se ja foi salvo; senao defaults
      ativo: row ? row.ativo : false,
      canais: row?.canais?.length ? row.canais : def.defaultCanais,
      offsetsDias: row?.offsetsDias?.length ? row.offsetsDias : def.defaultOffsets,
      mensagemWpp: row?.mensagemWpp ?? def.defaultWpp,
      mensagemEmail: row?.mensagemEmail ?? def.defaultEmail,
      ultimoTesteEm: row?.ultimoTesteEm?.toISOString() ?? null,
      // Hint pro front saber se eh primeira vez (mostra "use defaults")
      _persisted: !!row,
    };
  });

  return NextResponse.json({ regras });
}

/**
 * PATCH /api/automacoes
 * Body: { evento, ativo?, canais?, offsetsDias?, mensagemWpp?, mensagemEmail? }
 * Faz upsert da regra (cria se nao existir).
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body?.evento || !EVENTOS_LIST.includes(body.evento)) {
    return NextResponse.json({ error: 'evento invalido' }, { status: 400 });
  }
  const def = REGRAS_DEFAULT[body.evento as keyof typeof REGRAS_DEFAULT];

  const data: any = {};
  if (typeof body.ativo === 'boolean') data.ativo = body.ativo;
  if (Array.isArray(body.canais)) {
    data.canais = body.canais.filter((c: string) => c === 'whatsapp' || c === 'email');
  }
  if (Array.isArray(body.offsetsDias)) {
    data.offsetsDias = body.offsetsDias
      .map((n: any) => Number(n))
      .filter((n: number) => Number.isFinite(n) && n >= -90 && n <= 90)
      .sort((a: number, b: number) => a - b);
  }
  if (typeof body.mensagemWpp === 'string') data.mensagemWpp = body.mensagemWpp.slice(0, 2000) || null;
  if (typeof body.mensagemEmail === 'string') data.mensagemEmail = body.mensagemEmail.slice(0, 4000) || null;

  // Upsert
  const updated = await (prisma as any).regraAutomacao.upsert({
    where: { tenantId_evento: { tenantId, evento: body.evento } },
    create: {
      tenantId,
      evento: body.evento,
      ativo: data.ativo ?? false,
      canais: data.canais ?? def.defaultCanais,
      offsetsDias: data.offsetsDias ?? def.defaultOffsets,
      mensagemWpp: data.mensagemWpp ?? def.defaultWpp,
      mensagemEmail: data.mensagemEmail ?? def.defaultEmail,
    },
    update: data,
  });

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    ultimoTesteEm: updated.ultimoTesteEm?.toISOString() ?? null,
  });
}
