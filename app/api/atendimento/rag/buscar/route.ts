import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buscarRag } from '@/lib/rag/sync-imoveis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/atendimento/rag/buscar
 *
 * Chamado pelo workflow n8n `3- ImobIA-RAG` (toolWorkflow do Caique).
 * Recebe query + tenantId + secret, retorna top N matches.
 *
 * Autenticacao: header `X-Webhook-Secret` deve bater com ConfigWhatsApp.webhookSecret
 *
 * Body:
 *   {
 *     tenantId: string,
 *     query: string,
 *     count?: number,           // default 5
 *     scope?: 'all'|'imoveis'|'documentos'  // default 'all'
 *   }
 *
 * Resposta:
 *   {
 *     results: [{ id, source, source_id, content, similarity }],
 *     formattedText: string     // pre-formatado pra colar no prompt
 *   }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body invalido' }, { status: 400 });

  const { tenantId, query, count, scope } = body as Record<string, any>;
  if (!tenantId || !query) {
    return NextResponse.json({ error: 'tenantId e query obrigatorios' }, { status: 400 });
  }

  // Valida secret (mesmo do webhook)
  const secret = req.headers.get('x-webhook-secret');
  const cfg = await prisma.configWhatsApp.findUnique({
    where: { tenantId },
    select: { webhookSecret: true },
  });
  if (!cfg?.webhookSecret || cfg.webhookSecret !== secret) {
    return NextResponse.json({ error: 'Secret invalido' }, { status: 401 });
  }

  try {
    const results = await buscarRag(
      tenantId,
      String(query),
      typeof count === 'number' ? count : 5,
      scope === 'imoveis' || scope === 'documentos' ? scope : 'all',
    );

    // Formata texto pronto pra colar no system prompt do Caique
    const formattedText =
      results.length === 0
        ? 'Nenhum imovel ou documento encontrado.'
        : results
            .map((r, i) => `[${i + 1}] (${r.source === 'imovel' ? 'IMOVEL' : 'DOC'} ${r.source_id}, sim=${r.similarity.toFixed(3)})\n${r.content}`)
            .join('\n\n---\n\n');

    return NextResponse.json({ results, formattedText });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'erro' },
      { status: 500 },
    );
  }
}
