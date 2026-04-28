import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    const tenantId = (session.user as any).tenantId as string;

    const site = await prisma.site.findUnique({ where: { tenantId } });
    return NextResponse.json({ site });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    const tenantId = (session.user as any).tenantId as string;

    const { slug, publicado, titulo } = await req.json();

    const site = await prisma.site.upsert({
      where: { tenantId },
      update: {
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        publicado: publicado ?? true,
        titulo: titulo || 'Meu Site',
      },
      create: {
        tenantId,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        publicado: publicado ?? true,
        titulo: titulo || 'Meu Site',
      },
    });

    return NextResponse.json({ success: true, site });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Este nome de site já está em uso.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
