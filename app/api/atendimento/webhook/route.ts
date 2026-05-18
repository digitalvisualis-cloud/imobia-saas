import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/webhook
 *
 * Endpoint chamado pelo workflow n8n APOS processar uma mensagem.
 * Persiste conversa+mensagem no banco do ImobIA.
 *
 * Autenticacao: header `X-Webhook-Secret` deve bater com ConfigWhatsApp.webhookSecret
 * do tenant.
 *
 * Body (canonical):
 *   {
 *     tenantId: string,
 *     providerType: 'WAHA' | 'EVOLUTION' | 'CLOUD_API',
 *     providerInstance: string,
 *     clienteWa: string,           // 5511999998888
 *     clienteNome?: string,
 *     direcao: 'IN' | 'OUT',
 *     autorTipo: 'IA' | 'HUMANO' | 'CLIENTE' | 'SISTEMA',
 *     autorId?: string,
 *     tipo: 'TEXTO' | 'AUDIO' | 'IMAGEM' | 'VIDEO' | 'DOC' | 'LOCALIZACAO',
 *     conteudo: string,
 *     anexoUrl?: string,
 *     anexoMime?: string,
 *     providerMsgId?: string,
 *     imovelCodigo?: string,       // se IA identificou imovel especifico
 *     metadata?: Record<string, unknown>
 *   }
 *
 * Retorna:
 *   { conversaId, mensagemId, statusConversa }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 });
  }

  const {
    tenantId,
    providerType,
    providerInstance,
    clienteWa,
    clienteNome,
    direcao,
    autorTipo,
    autorId,
    tipo,
    conteudo,
    anexoUrl,
    anexoMime,
    providerMsgId,
    imovelCodigo,
    metadata,
  } = body as Record<string, any>;

  if (!tenantId || !providerType || !clienteWa || !direcao || !autorTipo || !tipo) {
    return NextResponse.json(
      { error: 'Campos obrigatorios: tenantId, providerType, clienteWa, direcao, autorTipo, tipo' },
      { status: 400 },
    );
  }

  // Validacao do webhook secret
  const secret = req.headers.get('x-webhook-secret');
  const cfg = await prisma.configWhatsApp.findUnique({
    where: { tenantId },
    select: { webhookSecret: true, providerType: true, instanceName: true },
  });
  if (!cfg || !cfg.webhookSecret || cfg.webhookSecret !== secret) {
    return NextResponse.json({ error: 'Secret invalido' }, { status: 401 });
  }

  // Procura imovel se veio codigo
  let imovelId: string | null = null;
  if (imovelCodigo) {
    const imv = await prisma.imovel.findFirst({
      where: { tenantId, codigo: imovelCodigo },
      select: { id: true },
    });
    imovelId = imv?.id ?? null;
  }

  // Conversa: busca aberta (status != FECHADA) ou cria
  let conversa = await prisma.conversa.findFirst({
    where: {
      tenantId,
      clienteWa,
      status: { not: 'FECHADA' },
    },
    orderBy: { ultimaMsgEm: 'desc' },
  });

  if (!conversa) {
    conversa = await prisma.conversa.create({
      data: {
        tenantId,
        clienteWa,
        clienteNome: clienteNome ?? null,
        status: 'IA',
        providerType: providerType,
        providerInstance: providerInstance ?? cfg.instanceName ?? '',
        imovelId,
      },
    });
  } else if (imovelId && !conversa.imovelId) {
    conversa = await prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        imovelId,
        clienteNome: clienteNome ?? conversa.clienteNome,
        ultimaMsgEm: new Date(),
      },
    });
  } else {
    await prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        ultimaMsgEm: new Date(),
        clienteNome: clienteNome ?? conversa.clienteNome,
      },
    });
  }

  // Cria mensagem
  const msg = await prisma.mensagem.create({
    data: {
      conversaId: conversa.id,
      tenantId,
      direcao: direcao as any,
      autorTipo: autorTipo as any,
      autorId: autorId ?? null,
      tipo: tipo as any,
      conteudo: String(conteudo ?? ''),
      anexoUrl: anexoUrl ?? null,
      anexoMime: anexoMime ?? null,
      providerMsgId: providerMsgId ?? null,
      metadata: metadata ?? undefined,
    },
  });

  return NextResponse.json({
    conversaId: conversa.id,
    mensagemId: msg.id,
    statusConversa: conversa.status,
  });
}
