import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { credentials, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/credentials — lista metadados (não retorna chaves)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const list = await credentials.list();
    return NextResponse.json({ total: list.length, credentials: list });
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
