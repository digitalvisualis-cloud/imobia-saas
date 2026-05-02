import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildChavesNaMaoXml } from '@/lib/feeds/chavesnamao';
import { guardRate, extractIp } from '@/lib/rate-limit';
import { logApiRequest } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/portais/chavesnamao.xml?tenant=<slug>&token=<feedToken>
 *
 * Feed XML proprietário do portal Chaves na Mão.
 * Cliente envia URL desse feed por email pra atendimento@chavesnamao.com.br
 * com nome + CNPJ. Eles processam 4x/dia (07h, 13h, 19h, 01h).
 */
export async function GET(req: NextRequest) {
  const rl = guardRate(req, {
    key: 'feed-chavesnamao',
    limit: 60,
    windowMs: 60_000,
  });
  if (rl) return rl;

  const sp = req.nextUrl.searchParams;
  const slug = sp.get('tenant');
  const token = sp.get('token');
  const startedAt = Date.now();

  if (!slug || !token) {
    return new NextResponse(
      '<error>Faltam parametros tenant e token</error>',
      { status: 400, headers: { 'Content-Type': 'application/xml' } },
    );
  }

  const tenant = (await (prisma as any).tenant.findFirst({
    where: { slug, feedToken: token },
    include: { marca: true },
  })) as any;

  if (!tenant) {
    logApiRequest({
      route: '/api/portais/chavesnamao.xml',
      method: 'GET',
      status: 404,
      ip: extractIp(req),
      latencyMs: Date.now() - startedAt,
      errorMessage: `Tenant slug=${slug} não encontrado ou token inválido`,
    });
    return new NextResponse('<error>Tenant ou token invalido</error>', {
      status: 404,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const imoveis = await prisma.imovel.findMany({
    where: {
      tenantId: tenant.id,
      publicado: true,
      status: 'DISPONIVEL',
    },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  });

  const xml = buildChavesNaMaoXml({
    marca: {
      nomeEmpresa: tenant.marca?.nomeEmpresa ?? null,
      email: tenant.marca?.email ?? null,
      whatsapp: tenant.marca?.whatsapp ?? null,
      telefone: tenant.marca?.telefone ?? null,
    },
    imoveis: imoveis.map((i) => ({
      id: i.id,
      codigo: i.codigo,
      titulo: i.titulo,
      descricao: i.descricao,
      tipo: i.tipo as unknown as string,
      operacao: i.operacao as unknown as string,
      preco: Number(i.preco),
      quartos: i.quartos,
      suites: i.suites,
      banheiros: i.banheiros,
      vagas: i.vagas,
      areaM2: i.areaM2 ? Number(i.areaM2) : null,
      areaTotal: i.areaTotal ? Number(i.areaTotal) : null,
      estado: i.estado,
      cidade: i.cidade,
      bairro: i.bairro,
      endereco: i.endereco,
      cep: i.cep,
      imagens: i.imagens ?? [],
      capaUrl: i.capaUrl,
      amenidades: i.amenidades ?? [],
      agenteNome: i.agenteNome,
      agenteTelefone: i.agenteTelefone,
      agenteEmail: i.agenteEmail,
      updatedAt: i.updatedAt,
    })),
  });

  logApiRequest({
    tenantId: tenant.id,
    route: '/api/portais/chavesnamao.xml',
    method: 'GET',
    status: 200,
    ip: extractIp(req),
    latencyMs: Date.now() - startedAt,
    metadata: { count: imoveis.length, format: 'chavesnamao' },
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      'X-Imoveis-Count': String(imoveis.length),
    },
  });
}
