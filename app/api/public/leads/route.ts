import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/leads — recebe lead capturado por formulario do site publico.
 *
 * Body: { slug, nome, whatsapp?, email?, mensagem?, imovelId? }
 *
 * Encontra tenant por slug, cria Lead com origem='site'. Sem auth (publico).
 * O imovelId, se passado, e validado (precisa pertencer ao tenant).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
    }

    const slug = String(body.slug ?? '').trim();
    const nome = String(body.nome ?? '').trim();
    const whatsapp = String(body.whatsapp ?? '').trim() || null;
    const email = String(body.email ?? '').trim() || null;
    const mensagem = String(body.mensagem ?? '').trim() || null;
    const imovelId = body.imovelId ? String(body.imovelId).trim() : null;

    if (!slug || !nome || (!whatsapp && !email)) {
      return NextResponse.json(
        { error: 'Nome + (WhatsApp ou E-mail) sao obrigatorios.' },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant nao encontrado.' }, { status: 404 });
    }

    // Valida imovelId (se passado) — precisa pertencer ao tenant
    let validImovelId: string | null = null;
    if (imovelId) {
      const imv = await prisma.imovel.findFirst({
        where: { id: imovelId, tenantId: tenant.id },
        select: { id: true },
      });
      validImovelId = imv?.id ?? null;
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        nome,
        whatsapp,
        email,
        notas: mensagem,
        imovelId: validImovelId,
        origem: 'site',
        etapa: 'NOVO',
      },
    });

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e: any) {
    console.error('[POST /api/public/leads]', e);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
