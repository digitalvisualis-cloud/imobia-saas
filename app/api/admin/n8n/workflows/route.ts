import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { workflows, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/workflows
 * Lista TODOS os workflows do n8n (existentes — não cria nada).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const list = await workflows.list({ limit: 250 });
    return NextResponse.json({
      total: list.length,
      ativos: list.filter((w) => w.active).length,
      inativos: list.filter((w) => !w.active).length,
      workflows: list,
    });
  } catch (e) {
    if (e instanceof N8nApiError) {
      return NextResponse.json(
        { error: e.message, status: e.status },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
