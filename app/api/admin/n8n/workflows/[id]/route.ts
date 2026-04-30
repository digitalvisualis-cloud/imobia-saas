import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { workflows, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/workflows/[id] — detalhe completo (nodes, connections)
 * PATCH /api/admin/n8n/workflows/[id] — atualiza partes (body parcial)
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    const wf = await workflows.get(id);
    return NextResponse.json(wf);
  } catch (e) {
    if (e instanceof N8nApiError) {
      return NextResponse.json(
        { error: e.message, status: e.status },
        { status: e.status === 404 ? 404 : 502 },
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  try {
    // Ações suportadas: { action: 'activate' | 'deactivate' }
    if (body.action === 'activate') {
      const wf = await workflows.activate(id);
      return NextResponse.json({ success: true, workflow: wf });
    }
    if (body.action === 'deactivate') {
      const wf = await workflows.deactivate(id);
      return NextResponse.json({ success: true, workflow: wf });
    }

    // Update completo
    if (body.workflow) {
      const wf = await workflows.update(id, body.workflow);
      return NextResponse.json({ success: true, workflow: wf });
    }

    return NextResponse.json(
      { error: 'Action inválida. Use action: activate|deactivate ou workflow: {...}' },
      { status: 400 },
    );
  } catch (e) {
    if (e instanceof N8nApiError) {
      return NextResponse.json(
        { error: e.message, status: e.status },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
