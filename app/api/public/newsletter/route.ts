import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/newsletter — inscricao em "Alertas de novos imoveis"
 *
 * Body: { slug, email, nome?, cidadeInteresse?, tipoInteresse?, operacaoInteresse?, precoMax? }
 *
 * Cria/atualiza NewsletterInscricao (unique por tenantId+email). Diferente de Lead:
 * fica em uma lista propria pra disparo de email automatico quando imovel novo bate
 * com os filtros do inscrito. Nao polui o Kanban de Negocios.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
    }

    const slug = String(body.slug ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const nome = String(body.nome ?? '').trim() || null;
    const cidadeInteresse = String(body.cidadeInteresse ?? '').trim() || null;
    const tipoInteresse = String(body.tipoInteresse ?? '').trim().toUpperCase() || null;
    const operacaoInteresse = String(body.operacaoInteresse ?? '').trim().toUpperCase() || null;
    const precoMaxRaw = body.precoMax ?? null;
    const precoMax = precoMaxRaw && !Number.isNaN(Number(precoMaxRaw)) ? Number(precoMaxRaw) : null;

    if (!slug || !email) {
      return NextResponse.json({ error: 'Slug e email obrigatorios.' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant nao encontrado.' }, { status: 404 });
    }

    // Upsert: se ja existe, atualiza preferencias; senao cria.
    const inscricao = await prisma.newsletterInscricao.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      create: {
        tenantId: tenant.id,
        email,
        nome,
        cidadeInteresse,
        tipoInteresse,
        operacaoInteresse,
        precoMax: precoMax ?? undefined,
        ativo: true,
      },
      update: {
        nome,
        cidadeInteresse,
        tipoInteresse,
        operacaoInteresse,
        precoMax: precoMax ?? undefined,
        ativo: true,
      },
    });

    return NextResponse.json({ ok: true, id: inscricao.id });
  } catch (e: any) {
    console.error('[POST /api/public/newsletter]', e);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
