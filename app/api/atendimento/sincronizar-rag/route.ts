import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sincronizarImoveis } from '@/lib/rag/sync-imoveis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // pode demorar pra muitos imoveis

/**
 * POST /api/atendimento/sincronizar-rag
 *
 * Re-sincroniza embeddings dos imoveis publicados do tenant.
 * Apaga todos os embeddings existentes e regenera.
 *
 * Body: vazio (usa tenantId da sessao)
 *
 * Resposta: { inseridos, atualizados, removidos, total }
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  try {
    const result = await sincronizarImoveis(tenantId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
