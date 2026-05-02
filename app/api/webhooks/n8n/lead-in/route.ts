import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyN8nSignature } from '@/lib/n8n-signature';
import { guardRate, extractIp } from '@/lib/rate-limit';
import { logApiRequest } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/n8n/lead-in
 *
 * Recebe lead que chegou via WhatsApp/site, processado pelo workflow n8n master.
 * O n8n já enriqueceu o payload com tenantId baseado no número de WA, etc.
 *
 * Body esperado:
 * {
 *   tenantId: string,
 *   nome?: string,
 *   telefone?: string,         // E.164: +5511999999999
 *   email?: string,
 *   mensagem: string,
 *   origem?: 'whatsapp' | 'site' | 'instagram' | 'outro',
 *   imovelCodigoInteresse?: string,
 *   metadados?: object,
 * }
 *
 * Retorna: { leadId } pra o n8n usar nas próximas etapas (qualificação, etc).
 *
 * Segurança: HMAC SHA256 do body com N8N_WEBHOOK_SECRET no header
 *   x-n8n-signature
 */
export async function POST(req: NextRequest) {
  // Rate limit: 100 req/min por IP (n8n manda em rajada)
  const rl = guardRate(req, { key: 'webhook-lead-in', limit: 100, windowMs: 60_000 });
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

  const { tenantId, nome, telefone, email, mensagem, origem, imovelCodigoInteresse, metadados } = body;

  if (!tenantId || !mensagem) {
    return NextResponse.json(
      { error: 'tenantId e mensagem obrigatórios.' },
      { status: 400 },
    );
  }

  // Valida tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, marca: { select: { nomeEmpresa: true } } },
  });
  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant não encontrado.' },
      { status: 404 },
    );
  }

  // Resolve imóvel de interesse (se veio código)
  let imovelId: string | null = null;
  if (imovelCodigoInteresse) {
    const im = await prisma.imovel.findFirst({
      where: { tenantId, codigo: imovelCodigoInteresse },
      select: { id: true },
    });
    imovelId = im?.id ?? null;
  }

  const startedAt = Date.now();

  // Cria lead (etapa default = NOVO)
  const lead = await prisma.lead.create({
    data: {
      tenantId,
      nome: nome ?? telefone ?? 'Lead WhatsApp',
      whatsapp: telefone ?? null,
      email: email ?? null,
      origem: (origem as string) ?? 'whatsapp',
      resumoConversa: mensagem.slice(0, 4000),
      imovelId: imovelId,
      // Persiste metadados extras nas notas (Json field não existe no modelo atual)
      notas:
        metadados && typeof metadados === 'object'
          ? JSON.stringify(metadados).slice(0, 4000)
          : null,
    },
  });

  // Log estruturado fire-and-forget
  logApiRequest({
    tenantId,
    route: '/api/webhooks/n8n/lead-in',
    method: 'POST',
    status: 200,
    latencyMs: Date.now() - startedAt,
    ip: extractIp(req),
    metadata: { leadId: lead.id, origem: lead.origem },
  });

  return NextResponse.json({
    success: true,
    leadId: lead.id,
    nomeEmpresa: tenant.marca?.nomeEmpresa ?? null,
  });
}
