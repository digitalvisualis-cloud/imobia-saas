import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireInternalToken, normalizePhone } from '@/lib/internal-auth';
import { guardRate } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/internal/lead-context?tenantId=xyz&phone=+5511...&imovelCodigo=IMV-VLS-101&limit=5
 *
 * Retorna contexto de um lead pra montar prompt da IA:
 * - Lead atual (se já existe via phone)
 * - Imóvel destacado (se imovelCodigo veio — lead clicou no card específico)
 * - Imóveis disponíveis matchando orçamento/bairro/tipo
 *
 * Auth: x-internal-token
 *
 * Param `imovelCodigo` é o código que veio na mensagem do WhatsApp tipo
 * "[IMV-VLS-101]" — n8n extrai com regex e passa pra cá.
 */
export async function GET(req: NextRequest) {
  const rl = guardRate(req, { key: 'internal', limit: 300, windowMs: 60_000 });
  if (rl) return rl;
  const authError = requireInternalToken(req);
  if (authError) return authError;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  const phone = req.nextUrl.searchParams.get('phone');
  const imovelCodigo = req.nextUrl.searchParams.get('imovelCodigo');
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? '5', 10) || 5,
    20,
  );

  if (!tenantId) {
    return NextResponse.json(
      { error: 'tenantId obrigatório.' },
      { status: 400 },
    );
  }

  const phoneNorm = normalizePhone(phone);
  const last11 = phoneNorm?.replace(/\D/g, '').slice(-11);

  // Busca lead existente pelo telefone
  let lead: any = null;
  if (last11) {
    const candidatos = await prisma.lead.findMany({
      where: { tenantId, whatsapp: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        nome: true,
        whatsapp: true,
        email: true,
        etapa: true,
        temperatura: true,
        interesse: true,
        bairroDesejado: true,
        orcamento: true,
        resumoConversa: true,
        dataVisita: true,
        notas: true,
      },
    });
    lead = candidatos.find(
      (c) => (c.whatsapp ?? '').replace(/\D/g, '').slice(-11) === last11,
    ) ?? null;
  }

  // Se veio imovelCodigo (lead clicou no card específico), busca esse imóvel
  // como "destaque" + similares.
  let imovelDestacado: any = null;
  if (imovelCodigo) {
    imovelDestacado = await prisma.imovel.findFirst({
      where: { tenantId, codigo: imovelCodigo },
      select: {
        id: true,
        codigo: true,
        titulo: true,
        descricao: true,
        tipo: true,
        operacao: true,
        bairro: true,
        cidade: true,
        endereco: true,
        areaM2: true,
        quartos: true,
        banheiros: true,
        suites: true,
        vagas: true,
        preco: true,
        amenidades: true,
        capaUrl: true,
        imagens: true,
      },
    });
  }

  // Imóveis disponíveis e publicados — filtros adaptativos:
  // 1. Se tem destaque, busca similares (mesmo bairro/tipo, exclui o destaque)
  // 2. Senão, se lead tem bairroDesejado, filtra por isso
  // 3. Senão, lista mais recentes
  const where: any = { tenantId, status: 'DISPONIVEL', publicado: true };
  if (imovelDestacado) {
    where.id = { not: imovelDestacado.id };
    if (imovelDestacado.bairro) {
      where.bairro = { contains: imovelDestacado.bairro, mode: 'insensitive' };
    }
    if (imovelDestacado.tipo) {
      where.tipo = imovelDestacado.tipo;
    }
  } else if (lead?.bairroDesejado) {
    where.bairro = { contains: lead.bairroDesejado, mode: 'insensitive' };
  }

  const imoveis = await prisma.imovel.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      codigo: true,
      titulo: true,
      tipo: true,
      operacao: true,
      bairro: true,
      cidade: true,
      areaM2: true,
      quartos: true,
      banheiros: true,
      vagas: true,
      preco: true,
    },
  });

  return NextResponse.json({
    tenantId,
    lead: lead
      ? {
          ...lead,
          orcamento: lead.orcamento ? Number(lead.orcamento) : null,
          dataVisita: lead.dataVisita?.toISOString() ?? null,
        }
      : null,
    // Imóvel específico que o lead veio interessado
    imovelDestacado: imovelDestacado
      ? {
          ...imovelDestacado,
          areaM2: imovelDestacado.areaM2 ? Number(imovelDestacado.areaM2) : null,
          preco: Number(imovelDestacado.preco),
          // Limita imagens pra payload menor
          imagens: (imovelDestacado.imagens ?? []).slice(0, 3),
        }
      : null,
    imoveisDisponiveis: imoveis.map((i) => ({
      ...i,
      areaM2: i.areaM2 ? Number(i.areaM2) : null,
      preco: Number(i.preco),
    })),
  });
}
