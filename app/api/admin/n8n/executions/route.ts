import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { executions, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/executions?workflowId=xxx&limit=50&status=error
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const workflowId = sp.get('workflowId') ?? undefined;
  const status = (sp.get('status') as any) ?? undefined;
  const limit = parseInt(sp.get('limit') ?? '50', 10);

  try {
    const list = await executions.list({ workflowId, status, limit });
    return NextResponse.json({
      total: list.length,
      executions: list.map((e) => ({
        ...e,
        durationMs:
          e.stoppedAt && e.startedAt
            ? new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
            : null,
      })),
    });
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
