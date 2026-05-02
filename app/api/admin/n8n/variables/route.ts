import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { variables, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/variables — lista
 * POST /api/admin/n8n/variables — upsert { key, value }
 */

export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const list = await variables.list();
    return NextResponse.json({ total: list.length, variables: list });
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.key) {
    return NextResponse.json(
      { error: 'Body inválido. Esperado: { key, value }.' },
      { status: 400 },
    );
  }

  // Atalho: { action: 'ensure-imobia' } cria as 3 vars que o workflow precisa
  if (body.action === 'ensure-imobia') {
    const baseUrl = process.env.IMOBIA_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? '';
    const internalToken = process.env.IMOBIA_INTERNAL_TOKEN;
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (!baseUrl || !internalToken || !webhookSecret) {
      return NextResponse.json(
        {
          error:
            'Faltam env vars: IMOBIA_PUBLIC_URL (ou NEXTAUTH_URL), IMOBIA_INTERNAL_TOKEN, N8N_WEBHOOK_SECRET',
        },
        { status: 400 },
      );
    }
    try {
      const result = await variables.ensureImobiaVariables({
        imobiaBaseUrl: baseUrl,
        internalToken,
        webhookSecret,
      });
      return NextResponse.json(result);
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

  try {
    const v = await variables.upsert({ key: body.key, value: body.value ?? '' });
    return NextResponse.json({ success: true, variable: v });
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
