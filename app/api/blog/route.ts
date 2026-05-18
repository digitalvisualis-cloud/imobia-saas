import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { slugify, uniqueSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

/** GET /api/blog — lista artigos do tenant logado (publicados + rascunhos). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const artigos = await prisma.artigoBlog.findMany({
    where: { tenantId },
    orderBy: [{ publicado: 'desc' }, { updatedAt: 'desc' }],
    take: 200,
  });
  return NextResponse.json({ data: artigos });
}

/** POST /api/blog — cria artigo. Gera slug unico automaticamente. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.titulo !== 'string' || !body.titulo.trim()) {
    return NextResponse.json({ error: 'Titulo obrigatorio.' }, { status: 400 });
  }

  // Resolve slug — usa o passado, senao deriva do titulo. Garante unicidade.
  const baseSlug = body.slug?.trim() ? slugify(body.slug) : slugify(body.titulo);
  const taken = (await prisma.artigoBlog.findMany({
    where: { tenantId, slug: { startsWith: baseSlug } },
    select: { slug: true },
  })).map((a) => a.slug);
  const slug = uniqueSlug(baseSlug || 'artigo', taken);

  const publicado = Boolean(body.publicado);
  const artigo = await prisma.artigoBlog.create({
    data: {
      tenantId,
      slug,
      titulo: body.titulo.trim(),
      resumo: body.resumo?.trim() || null,
      conteudoMd: body.conteudoMd ?? '',
      capaUrl: body.capaUrl?.trim() || null,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 12) : [],
      autor: body.autor?.trim() || null,
      publicado,
      publicadoEm: publicado ? new Date() : null,
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
    },
  });
  return NextResponse.json(artigo, { status: 201 });
}

/** PATCH /api/blog?id=X — atualiza artigo. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await prisma.artigoBlog.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Artigo nao encontrado' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body invalido' }, { status: 400 });

  const data: any = {};
  if (typeof body.titulo === 'string') data.titulo = body.titulo.trim();
  if (typeof body.resumo === 'string') data.resumo = body.resumo.trim() || null;
  if (typeof body.conteudoMd === 'string') data.conteudoMd = body.conteudoMd;
  if (typeof body.capaUrl === 'string') data.capaUrl = body.capaUrl.trim() || null;
  if (Array.isArray(body.tags)) data.tags = body.tags.slice(0, 12);
  if (typeof body.autor === 'string') data.autor = body.autor.trim() || null;
  if (typeof body.metaTitle === 'string') data.metaTitle = body.metaTitle.trim() || null;
  if (typeof body.metaDescription === 'string') data.metaDescription = body.metaDescription.trim() || null;
  if (typeof body.publicado === 'boolean') {
    data.publicado = body.publicado;
    // Quando publica pela primeira vez, marca publicadoEm
    if (body.publicado && !existing.publicadoEm) data.publicadoEm = new Date();
  }

  // Permite trocar slug, mas garante unicidade
  if (typeof body.slug === 'string' && body.slug.trim() && body.slug !== existing.slug) {
    const baseSlug = slugify(body.slug);
    const taken = (await prisma.artigoBlog.findMany({
      where: { tenantId, slug: { startsWith: baseSlug }, NOT: { id } },
      select: { slug: true },
    })).map((a) => a.slug);
    data.slug = uniqueSlug(baseSlug, taken);
  }

  const updated = await prisma.artigoBlog.update({ where: { id }, data });
  return NextResponse.json(updated);
}

/** DELETE /api/blog?id=X */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 });

  const existing = await prisma.artigoBlog.findFirst({ where: { id, tenantId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Artigo nao encontrado' }, { status: 404 });

  await prisma.artigoBlog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
