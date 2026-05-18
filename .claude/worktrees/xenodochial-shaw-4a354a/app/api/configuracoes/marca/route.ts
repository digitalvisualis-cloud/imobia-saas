import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const marca = await prisma.configMarca.findUnique({ where: { tenantId } });
  return NextResponse.json(marca ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();

  const marca = await prisma.configMarca.upsert({
    where: { tenantId },
    update: body,
    create: { tenantId, ...body },
  });

  return NextResponse.json(marca);
}
