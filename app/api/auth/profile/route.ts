import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = (session.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, whatsapp: true, creci: true, role: true, avatarUrl: true },
  });

  return NextResponse.json(user ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = (session.user as any).id as string;
  const { nome, whatsapp, creci } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { nome, whatsapp, creci },
    select: { id: true, nome: true, email: true, whatsapp: true, creci: true },
  });

  return NextResponse.json(user);
}
