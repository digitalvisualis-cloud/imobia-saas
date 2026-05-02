import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildVrsyncXml } from '@/lib/feeds/vrsync';
import { guardRate, extractIp } from '@/lib/rate-limit';
import { logApiRequest } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/portais/vrsync.xml?tenant=<slug>&token=<feedToken>
 *
 * Feed XML padrão VRSync (OpenImoveis) — formato aceito por:
 *  - ZAP, Viva Real, OLX (Grupo OLX, único formato desde out/2024)
 *  - Imovelweb, ImobiBrasil, 99imoveis, Praedium e outros
 *
 * Auth: tenant slug + feedToken bate com tenants.feedToken.
 *
 * Cache: 30 min (portais consultam max 4-6x/dia).
 */
export async function GET(req: NextRequest) {
  // Rate limit suave — portais legítimos chamam pouco; se lotar, rejeita
  const rl = guardRate(req, {
    key: 'feed-vrsync',
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
      route: '/api/portais/vrsync.xml',
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
    take: 5000, // hard cap por segurança
  });

  const xml = buildVrsyncXml({
    marca: {
      nomeEmpresa: tenant.marca?.nomeEmpresa ?? null,
      email: tenant.marca?.email ?? null,
      whatsapp: tenant.marca?.whatsapp ?? null,
      telefone: tenant.marca?.telefone ?? null,
      cidade: null,
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
      videoUrl: i.videoUrl,
      amenidades: i.amenidades ?? [],
      agenteNome: i.agenteNome,
      agenteTelefone: i.agenteTelefone,
      agenteEmail: i.agenteEmail,
      updatedAt: i.updatedAt,
    })),
  });

  logApiRequest({
    tenantId: tenant.id,
    route: '/api/portais/vrsync.xml',
    method: 'GET',
    status: 200,
    ip: extractIp(req),
    latencyMs: Date.now() - startedAt,
    metadata: { count: imoveis.length, format: 'vrsync' },
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
