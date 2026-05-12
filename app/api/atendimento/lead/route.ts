import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/atendimento/lead
 *
 * Tool chamada pela IA do workflow ImobIA-Caique quando detecta intent
 * forte (lead quente: quer visitar, comprar, demonstra interesse claro).
 *
 * Cria ou atualiza Lead no CRM + vincula com a conversa. Idempotente
 * por (tenantId, conversaId).
 *
 * Autenticacao: header `X-Webhook-Secret` deve bater com
 * ConfigWhatsApp.webhookSecret do tenant.
 *
 * Body:
 *   {
 *     tenantId: string,
 *     conversaId: string,
 *     nome: string,
 *     whatsapp?: string,                     // default: pega da conversa
 *     email?: string,
 *     interesse?: string,                    // texto livre tipo "Casa 3 quartos"
 *     bairroDesejado?: string,
 *     orcamento?: number,
 *     imovelCodigo?: string,                 // se interesse e em imovel especifico
 *     resumoConversa?: string,
 *     temperatura?: 'FRIO'|'MORNO'|'QUENTE', // default MORNO
 *     dataVisita?: string,                   // ISO date se ja agendou
 *   }
 *
 * Retorna: { leadId, etapa, criado: true|false }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Body invalido' }, { status: 400 });

  const {
    tenantId,
    conversaId,
    nome,
    whatsapp,
    email,
    interesse,
    bairroDesejado,
    orcamento,
    imovelCodigo,
    resumoConversa,
    temperatura,
    dataVisita,
  } = body as Record<string, any>;

  if (!tenantId || !conversaId || !nome) {
    return NextResponse.json(
      { error: 'tenantId, conversaId e nome obrigatorios' },
      { status: 400 },
    );
  }

  // Valida secret
  const secret = req.headers.get('x-webhook-secret');
  const cfg = await prisma.configWhatsApp.findUnique({
    where: { tenantId },
    select: { webhookSecret: true },
  });
  if (!cfg?.webhookSecret || cfg.webhookSecret !== secret) {
    return NextResponse.json({ error: 'Secret invalido' }, { status: 401 });
  }

  // Garante que conversa eh do tenant
  const conversa = await prisma.conversa.findFirst({
    where: { id: conversaId, tenantId },
    select: { id: true, leadId: true, clienteWa: true, imovelId: true },
  });
  if (!conversa) {
    return NextResponse.json({ error: 'Conversa nao encontrada' }, { status: 404 });
  }

  // Resolve imovel pelo codigo se veio
  let imovelId: string | null = conversa.imovelId;
  if (imovelCodigo) {
    const imv = await prisma.imovel.findFirst({
      where: { tenantId, codigo: imovelCodigo },
      select: { id: true },
    });
    if (imv) imovelId = imv.id;
  }

  const dadosLead = {
    nome: String(nome),
    whatsapp: whatsapp ?? conversa.clienteWa,
    email: email ?? null,
    interesse: interesse ?? null,
    bairroDesejado: bairroDesejado ?? null,
    orcamento: orcamento != null ? Number(orcamento) : null,
    imovelId,
    resumoConversa: resumoConversa ?? null,
    temperatura: temperatura ?? 'MORNO',
    dataVisita: dataVisita ? new Date(dataVisita) : null,
    origem: 'whatsapp-ia',
  } as const;

  let lead;
  let criado = false;
  if (conversa.leadId) {
    // Atualiza existente
    lead = await prisma.lead.update({
      where: { id: conversa.leadId },
      data: dadosLead,
    });
  } else {
    lead = await prisma.lead.create({
      data: {
        ...dadosLead,
        tenantId,
        etapa: 'CONTATO', // jah passou da etapa NOVO (IA conversou)
      },
    });
    criado = true;
    // Vincula conversa ao lead
    await prisma.conversa.update({
      where: { id: conversaId },
      data: { leadId: lead.id },
    });
  }

  return NextResponse.json({
    leadId: lead.id,
    etapa: lead.etapa,
    criado,
  });
}
