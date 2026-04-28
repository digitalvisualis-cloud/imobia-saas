import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/leads
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const { searchParams } = req.nextUrl;

  const where: any = { tenantId };
  if (searchParams.get('etapa')) where.etapa = searchParams.get('etapa');

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 200, // limite razoável para o kanban
    include: {
      imovel: { select: { titulo: true, codigo: true } },
    },
  });

  return NextResponse.json({ data: leads });
}

// POST /api/leads
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();

  const lead = await prisma.lead.create({
    data: { tenantId, ...body },
  });

  return NextResponse.json(lead, { status: 201 });
}

// PATCH /api/leads — atualizar etapa (drag & drop)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();
  const { id, ...updates } = body;

  const lead = await prisma.lead.update({
    where: { id, tenantId },
    data: updates,
  });

  return NextResponse.json(lead);
}
