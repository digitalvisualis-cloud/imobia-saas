import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts — Cria um novo PostGerado
 *
 * Body: { imovelId, tipo, conteudo, templateId, formato }
 *
 * tipo precisa ser um valor do enum TipoPost do Prisma:
 *   INSTAGRAM_FEED | INSTAGRAM_STORIES | WHATSAPP | FICHA_PDF | DESCRICAO_SITE
 *
 * templateId e formato ainda não estão no schema — guardamos como sufixo no
 * conteudo até a próxima migration (linha 1 do conteudo: "[template:formato]").
 * Em breve criar campos próprios.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
    }

    const { imovelId, tipo, conteudo, templateId, formato, imageUrl } = body;

    if (!tipo || !conteudo) {
      return NextResponse.json(
        { error: 'tipo e conteudo são obrigatórios.' },
        { status: 400 },
      );
    }

    // Se imovelId vier, garante que pertence ao tenant
    if (imovelId) {
      const ok = await prisma.imovel.findFirst({
        where: { id: imovelId, tenantId },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json(
          { error: 'Imóvel não encontrado.' },
          { status: 404 },
        );
      }
    }

    const post = await prisma.postGerado.create({
      data: {
        tenantId,
        imovelId: imovelId ?? null,
        tipo,
        // Por enquanto persistimos templateId+formato no início do conteúdo
        // até existir migration que adicione colunas dedicadas.
        conteudo:
          templateId || formato
            ? `[template:${templateId ?? 'clean'}|formato:${formato ?? 'POST_QUADRADO'}]\n${conteudo}`
            : conteudo,
        // Se a IA gerou a arte, salva URL pública do Storage
        imageUrl: typeof imageUrl === 'string' && imageUrl.startsWith('http') ? imageUrl : null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET /api/posts — Lista posts do tenant. Filtros opcionais por imovelId.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    const imovelId = req.nextUrl.searchParams.get('imovelId') ?? undefined;

    const posts = await prisma.postGerado.findMany({
      where: { tenantId, ...(imovelId && { imovelId }) },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/posts?id=xxx — Apaga um post (verifica ownership).
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string;
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 });
    }

    await prisma.postGerado.deleteMany({ where: { id, tenantId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
