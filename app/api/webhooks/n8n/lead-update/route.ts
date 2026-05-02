import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyN8nSignature } from '@/lib/n8n-signature';
import { guardRate } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/n8n/lead-update
 *
 * O n8n master, depois de qualificar um lead com IA, manda update pra cá
 * com etapa, temperatura, resumo da conversa, e info de visita agendada.
 *
 * Body esperado:
 * {
 *   tenantId: string,
 *   leadId: string,
 *   etapa?: 'NOVO'|'QUALIFICANDO'|'INTERESSADO'|'VISITA_AGENDADA'|'PROPOSTA'|'FECHADO_GANHO'|'FECHADO_PERDIDO',
 *   temperatura?: 'FRIO'|'MORNO'|'QUENTE',
 *   resumoConversa?: string,
 *   interesse?: string,
 *   bairroDesejado?: string,
 *   orcamento?: number,
 *   dataVisita?: string (ISO),
 *   notas?: string,
 *   chatwootContactId?: string,
 *   chatwootConversaId?: string,
 *   n8nLeadId?: string,
 * }
 *
 * Segurança: HMAC SHA256 do body com N8N_WEBHOOK_SECRET (header x-n8n-signature)
 */
export async function POST(req: NextRequest) {
  const rl = guardRate(req, { key: 'webhook-lead-update', limit: 200, windowMs: 60_000 });
  if (rl) return rl;

  const raw = await req.text();
  const sig = req.headers.get('x-n8n-signature');

  if (!verifyN8nSignature(raw, sig)) {
    return NextResponse.json(
      { error: 'Assinatura inválida.' },
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { tenantId, leadId } = body;
  if (!tenantId || !leadId) {
    return NextResponse.json(
      { error: 'tenantId e leadId obrigatórios.' },
      { status: 400 },
    );
  }

  // Verifica ownership
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, tenantId },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json(
      { error: 'Lead não encontrado.' },
      { status: 404 },
    );
  }

  // Whitelist
  const data: any = {};
  const ETAPAS = [
    'NOVO',
    'QUALIFICANDO',
    'INTERESSADO',
    'VISITA_AGENDADA',
    'PROPOSTA',
    'FECHADO_GANHO',
    'FECHADO_PERDIDO',
  ];
  const TEMPS = ['FRIO', 'MORNO', 'QUENTE'];

  if (body.etapa && ETAPAS.includes(body.etapa)) data.etapa = body.etapa;
  if (body.temperatura && TEMPS.includes(body.temperatura))
    data.temperatura = body.temperatura;
  for (const k of [
    'resumoConversa',
    'interesse',
    'bairroDesejado',
    'notas',
    'chatwootContactId',
    'chatwootConversaId',
    'chatwootInboxId',
    'n8nLeadId',
  ] as const) {
    if (typeof body[k] === 'string') {
      data[k] = (body[k] as string).slice(0, 4000);
    }
  }
  if (typeof body.orcamento === 'number') data.orcamento = body.orcamento;
  if (body.dataVisita) {
    const d = new Date(body.dataVisita);
    if (!Number.isNaN(d.getTime())) data.dataVisita = d;
  }

  const updated = await prisma.lead.update({ where: { id: leadId }, data });

  // Forward opcional pro CRM externo do tenant (se configurado)
  forwardToCrmExterno(tenantId, updated).catch((e) =>
    console.error('[lead-update] forward CRM falhou:', e),
  );

  return NextResponse.json({ success: true, leadId: updated.id });
}

async function forwardToCrmExterno(tenantId: string, lead: any) {
  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
    select: { webhookSaidaCrm: true },
  });
  if (!agente?.webhookSaidaCrm) return;

  const payload = JSON.stringify({
    leadId: lead.id,
    nome: lead.nome,
    whatsapp: lead.whatsapp,
    email: lead.email,
    etapa: lead.etapa,
    temperatura: lead.temperatura,
    resumo: lead.resumoConversa,
    visita: lead.dataVisita,
  });

  // Fire-and-forget — não bloqueia resposta do webhook
  await fetch(agente.webhookSaidaCrm, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-imobia-source': 'n8n-lead-update',
    },
    body: payload,
  });
}
