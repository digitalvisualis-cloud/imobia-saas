import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { maskSecret } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agente
 * Retorna config do AgenteIA do tenant. Mascara chaves sensíveis.
 */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
  });

  if (!agente) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    ...agente,
    openaiApiKey: maskKey(agente.openaiApiKey),
    anthropicApiKey: maskKey(agente.anthropicApiKey),
    elevenLabsApiKey: maskKey(agente.elevenLabsApiKey),
    remotionApiKey: maskKey(agente.remotionApiKey),
    chatwootToken: maskKey(agente.chatwootToken),
    webhookSecret: maskKey(agente.webhookSecret),
    exists: true,
  });
}

/**
 * PUT /api/agente
 * Whitelist explícita. Chaves sensíveis: só substitui se vier valor real
 * (UI manda "••••" pra preservar a anterior, ou null pra limpar).
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const data: any = {};

  // Whitelist de campos editáveis pelo TENANT (UX self-service).
  // Campos técnicos (chaves IA, n8n, ChatWoot, CRM webhook, textoProvider)
  // são editados SÓ pelo super admin via /api/admin/tenants/[id]/agente.
  for (const k of [
    'nome',
    'personalidade',
    'apresentacao',
    'mensagemSaudacao',
    'mensagemForaHorario',
    'horarioInicio',
    'horarioFim',
  ] as const) {
    if (body[k] !== undefined) {
      data[k] =
        typeof body[k] === 'string' ? (body[k] as string).slice(0, 2000) : null;
    }
  }

  if (body.ativo !== undefined) data.ativo = !!body.ativo;

  const OBJETIVOS = [
    'QUALIFICAR',
    'AGENDAR_VISITA',
    'TIRAR_DUVIDAS',
    'HANDOFF_DIRETO',
  ];
  if (body.objetivo && OBJETIVOS.includes(body.objetivo)) {
    data.objetivo = body.objetivo;
  }

  if (Array.isArray(body.diasSemana)) data.diasSemana = body.diasSemana;
  if (Array.isArray(body.etapas)) data.etapas = body.etapas;

  const agente = await (prisma as any).agenteIA.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });

  return NextResponse.json({
    ...agente,
    openaiApiKey: maskKey(agente.openaiApiKey),
    anthropicApiKey: maskKey(agente.anthropicApiKey),
    elevenLabsApiKey: maskKey(agente.elevenLabsApiKey),
    remotionApiKey: maskKey(agente.remotionApiKey),
    chatwootToken: maskKey(agente.chatwootToken),
    webhookSecret: maskKey(agente.webhookSecret),
  });
}

function maskKey(k?: string | null): string | null {
  return maskSecret(k);
}
