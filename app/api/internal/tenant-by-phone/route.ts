import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireInternalToken, normalizePhone } from '@/lib/internal-auth';
import { guardRate } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/internal/tenant-by-phone?phone=+5511999999999
 *
 * Resolve o tenantId baseado no número de WhatsApp do imobiliária.
 * Match feito em ConfigMarca.whatsapp.
 *
 * Auth: header x-internal-token = IMOBIA_INTERNAL_TOKEN
 *
 * Resposta: { tenantId, nomeEmpresa, slug } ou { error: 'not_found' }
 */
export async function GET(req: NextRequest) {
  const rl = guardRate(req, { key: 'internal', limit: 300, windowMs: 60_000 });
  if (rl) return rl;
  const authError = requireInternalToken(req);
  if (authError) return authError;

  const phone = req.nextUrl.searchParams.get('phone');
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json(
      { error: 'Parâmetro `phone` ausente ou inválido.' },
      { status: 400 },
    );
  }

  // Match em ConfigMarca.whatsapp — pode estar normalizado ou não no banco.
  // Estratégia: tira tudo que não for dígito e compara como ENDS_WITH (últimos 11 dígitos do BR).
  const last11 = normalized.replace(/\D/g, '').slice(-11);

  // Busca todos com WhatsApp setado (deveria ser indexado em escala — TODO)
  const candidatos = await prisma.configMarca.findMany({
    where: { whatsapp: { not: null } },
    select: {
      tenantId: true,
      nomeEmpresa: true,
      whatsapp: true,
      tenant: { select: { slug: true } },
    },
  });

  const match = candidatos.find((c) => {
    const d = (c.whatsapp ?? '').replace(/\D/g, '').slice(-11);
    return d === last11;
  });

  if (!match) {
    return NextResponse.json(
      { error: 'not_found', phone: normalized },
      { status: 404 },
    );
  }

  return NextResponse.json({
    tenantId: match.tenantId,
    nomeEmpresa: match.nomeEmpresa,
    slug: match.tenant?.slug ?? null,
    matchedNumber: match.whatsapp,
  });
}
