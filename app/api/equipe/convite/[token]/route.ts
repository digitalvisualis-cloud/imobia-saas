import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/equipe/convite/[token] — valida o convite (publico, sem auth).
 * Retorna info pra pagina /convite/[token] renderizar.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  const convite = await prisma.equipeConvite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      tenant: { select: { slug: true, marca: { select: { nomeEmpresa: true } } } },
    },
  });
  if (!convite) {
    return NextResponse.json({ error: 'Convite invalido' }, { status: 404 });
  }
  if (convite.acceptedAt) {
    return NextResponse.json({ error: 'Convite ja foi aceito' }, { status: 410 });
  }
  if (convite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Convite expirado' }, { status: 410 });
  }

  return NextResponse.json({
    email: convite.email,
    role: convite.role,
    imobiliaria: convite.tenant.marca?.nomeEmpresa ?? convite.tenant.slug,
  });
}

/**
 * POST /api/equipe/convite/[token]/aceitar via PATCH na mesma rota
 * — cria User no tenant, com senha + nome.
 *
 * Body: { nome: string, password: string, whatsapp?: string, creci?: string }
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => null);
  const nome = String(body?.nome ?? '').trim();
  const password = String(body?.password ?? '');
  const whatsapp = String(body?.whatsapp ?? '').trim() || null;
  const creci = String(body?.creci ?? '').trim() || null;

  if (!nome || nome.length < 2) {
    return NextResponse.json({ error: 'Nome obrigatorio' }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Senha precisa ter pelo menos 6 caracteres' }, { status: 400 });
  }

  const convite = await prisma.equipeConvite.findUnique({ where: { token } });
  if (!convite) return NextResponse.json({ error: 'Convite invalido' }, { status: 404 });
  if (convite.acceptedAt) return NextResponse.json({ error: 'Convite ja aceito' }, { status: 410 });
  if (convite.expiresAt < new Date()) return NextResponse.json({ error: 'Convite expirado' }, { status: 410 });

  // Confere se email nao virou outro user nesse meio tempo
  const jaExiste = await prisma.user.findUnique({ where: { email: convite.email } });
  if (jaExiste) {
    return NextResponse.json({ error: 'Email ja cadastrado em outra conta' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const novoUser = await prisma.user.create({
    data: {
      tenantId: convite.tenantId,
      email: convite.email,
      nome,
      whatsapp,
      creci,
      role: convite.role,
      passwordHash,
    },
    select: { id: true, email: true, nome: true, role: true },
  });

  await prisma.equipeConvite.update({
    where: { id: convite.id },
    data: { acceptedAt: new Date(), acceptedByUserId: novoUser.id },
  });

  return NextResponse.json({ ok: true, user: novoUser });
}

/**
 * DELETE /api/equipe/convite/[token] — admin revoga um convite pendente.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const role = (session.user as any).role as string;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas ADMIN pode revogar' }, { status: 403 });
  }

  const { token } = await ctx.params;
  await prisma.equipeConvite.deleteMany({ where: { token, tenantId } });
  return NextResponse.json({ ok: true });
}
