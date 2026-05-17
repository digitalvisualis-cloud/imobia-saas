import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/marcar-emitido
 * Header: X-Cron-Secret: <env.CRON_SECRET>
 * Body: {
 *   tenantId: string,
 *   recursoTipo: 'cobranca' | 'contrato' | 'chaveRetirada' | 'repasse',
 *   recursoId: string,
 *   evento: 'vencimento' | 'reajuste' | 'cobranca' | 'atraso',
 *   // 'cobranca' soh pra cobrancas/repasses; 'vencimento'/'reajuste' soh contratos;
 *   // 'atraso' soh chaves.
 *   adicionarHistorico?: { canal: string, status: string, conteudo?: string }
 * }
 *
 * Callback do n8n apos disparar com sucesso. Marca o flag
 * correspondente (eventoVencimentoEmitido / eventoReajusteEmitido /
 * eventoCobrancaEmitido / eventoAtrasoEmitido) como true pra cron
 * nao duplicar.
 *
 * Para cobrancas, opcionalmente adiciona ao historicoCobranca.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.tenantId || !body?.recursoTipo || !body?.recursoId || !body?.evento) {
    return NextResponse.json(
      { error: 'tenantId, recursoTipo, recursoId, evento obrigatorios' },
      { status: 400 },
    );
  }

  const { tenantId, recursoTipo, recursoId, evento, adicionarHistorico } = body;

  try {
    if (recursoTipo === 'cobranca' && evento === 'cobranca') {
      const existing = await (prisma as any).cobranca.findFirst({
        where: { id: recursoId, tenantId },
        select: { id: true, historicoCobranca: true },
      });
      if (!existing) return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });

      const hist = Array.isArray(existing.historicoCobranca)
        ? existing.historicoCobranca
        : [];
      if (adicionarHistorico) {
        hist.push({
          data: new Date().toISOString(),
          canal: adicionarHistorico.canal ?? 'n8n',
          status: adicionarHistorico.status ?? 'enviado',
          conteudo: adicionarHistorico.conteudo ?? null,
        });
      }

      await (prisma as any).cobranca.update({
        where: { id: recursoId },
        data: {
          eventoCobrancaEmitido: true,
          ultimaCobrancaEm: new Date(),
          historicoCobranca: hist,
        },
      });
    } else if (recursoTipo === 'contrato' && evento === 'vencimento') {
      const updated = await (prisma as any).contrato.updateMany({
        where: { id: recursoId, tenantId },
        data: { eventoVencimentoEmitido: true },
      });
      if (updated.count === 0)
        return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
    } else if (recursoTipo === 'contrato' && evento === 'reajuste') {
      const updated = await (prisma as any).contrato.updateMany({
        where: { id: recursoId, tenantId },
        data: { eventoReajusteEmitido: true },
      });
      if (updated.count === 0)
        return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
    } else if (recursoTipo === 'chaveRetirada' && evento === 'atraso') {
      const updated = await (prisma as any).chaveRetirada.updateMany({
        where: { id: recursoId, tenantId },
        data: { eventoAtrasoEmitido: true },
      });
      if (updated.count === 0)
        return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
    } else if (recursoTipo === 'repasse' && evento === 'cobranca') {
      const updated = await (prisma as any).repasse.updateMany({
        where: { id: recursoId, tenantId },
        data: { eventoCobrancaEmitido: true },
      });
      if (updated.count === 0)
        return NextResponse.json({ error: 'nao encontrado' }, { status: 404 });
    } else {
      return NextResponse.json(
        { error: 'combinacao recursoTipo/evento invalida' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
