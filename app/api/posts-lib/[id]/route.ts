import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const dynamic = 'force-dynamic';

/** PATCH /api/posts-lib/[id] — atualiza copy ou customizacao */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await ctx.params;

  const existing = await (prisma as any).postGeradoLib.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.copy === 'string') data.copy = body.copy.trim() || null;
  if (body.customizacao && typeof body.customizacao === 'object') data.customizacao = body.customizacao;

  const updated = await (prisma as any).postGeradoLib.update({ where: { id }, data });
  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

/** DELETE /api/posts-lib/[id] — apaga linha + thumb do Storage */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenantId = (session.user as any).tenantId as string;
  const { id } = await ctx.params;

  const existing = await (prisma as any).postGeradoLib.findFirst({
    where: { id, tenantId },
    select: { id: true, thumbPath: true },
  });
  if (!existing) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 });

  // Tenta limpar o blob no Storage. Falha de Storage nao bloqueia o
  // delete da linha (pode ser thumb antigo ou path null).
  if (existing.thumbPath) {
    try {
      const supa = admin();
      await supa.storage.from('posts-thumbs').remove([existing.thumbPath]);
    } catch (e) {
      console.warn('[posts-lib] storage cleanup falhou', e);
    }
  }

  await (prisma as any).postGeradoLib.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
