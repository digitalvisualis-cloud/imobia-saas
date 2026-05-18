import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/equipe/convite — lista convites pendentes do tenant (admin).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const role = (session.user as any).role as string;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas ADMIN pode listar convites' }, { status: 403 });
  }

  const convites = await prisma.equipeConvite.findMany({
    where: { tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, token: true, createdAt: true, expiresAt: true },
  });

  return NextResponse.json({ data: convites });
}

/**
 * POST /api/equipe/convite — cria um convite + retorna o link.
 *
 * Body: { email: string, role?: 'ADMIN'|'CORRETOR'|'VIEWER' }
 *
 * O admin envia o link manualmente (WhatsApp/email) pra pessoa convidada.
 * Email automatico fica pra Fase 2.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas ADMIN pode convidar' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const novoRole = String(body?.role ?? 'CORRETOR').toUpperCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 });
  }
  if (!['ADMIN', 'CORRETOR', 'VIEWER'].includes(novoRole)) {
    return NextResponse.json({ error: 'Role invalida' }, { status: 400 });
  }

  // Ja eh membro do tenant?
  const existing = await prisma.user.findUnique({ where: { email }, select: { tenantId: true } });
  if (existing && existing.tenantId === tenantId) {
    return NextResponse.json({ error: 'Esse email ja faz parte da equipe' }, { status: 409 });
  }
  if (existing && existing.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Esse email ja pertence a outra imobiliaria' }, { status: 409 });
  }

  // Tem convite pendente?
  const pendente = await prisma.equipeConvite.findFirst({
    where: { tenantId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pendente) {
    return NextResponse.json({ error: 'Ja existe convite pendente pra esse email', token: pendente.token }, { status: 409 });
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  const convite = await prisma.equipeConvite.create({
    data: {
      tenantId,
      email,
      role: novoRole as any,
      token,
      invitedBy: userId,
      expiresAt,
    },
  });

  const baseUrl = process.env.IMOBIA_PUBLIC_URL ?? 'http://localhost:3005';
  const link = `${baseUrl}/convite/${token}`;

  return NextResponse.json({ ...convite, link }, { status: 201 });
}
