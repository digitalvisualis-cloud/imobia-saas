import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { credentials, N8nApiError } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/n8n/credentials/ensure-master
 * Cria (idempotente) as credentials master Anthropic + OpenAI + WAHA
 * usando as keys do env. Não duplica se já existem com mesmo nome.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await credentials.ensureMasterCredentials({
      anthropicKey: process.env.ANTHROPIC_API_KEY ?? null,
      openaiKey: process.env.OPENAI_API_KEY ?? null,
      wahaApiKey: process.env.WAHA_API_KEY ?? null,
      wahaBaseUrl: process.env.WAHA_BASE_URL ?? null,
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
