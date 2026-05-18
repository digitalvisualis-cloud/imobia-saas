import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireInternalToken } from '@/lib/internal-auth';
import { resolveAiKey } from '@/lib/ai-keys';
import { guardRate } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/internal/tenant-ia-config?tenantId=xyz
 *
 * Retorna config completa do agente IA com chaves resolvidas (tenant→master).
 *
 * Auth: header x-internal-token = IMOBIA_INTERNAL_TOKEN
 *
 * RESPOSTA CONTÉM CHAVES SENSÍVEIS — só pra workers backend (n8n).
 * Nunca expor pro browser.
 */
export async function GET(req: NextRequest) {
  const rl = guardRate(req, { key: 'internal', limit: 300, windowMs: 60_000 });
  if (rl) return rl;
  const authError = requireInternalToken(req);
  if (authError) return authError;

  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Parâmetro `tenantId` obrigatório.' },
      { status: 400 },
    );
  }

  // Carrega tenant + agente + marca em paralelo
  const [tenant, agente, marca] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, plano: true },
    }),
    (prisma as any).agenteIA.findUnique({ where: { tenantId } }),
    prisma.configMarca.findUnique({
      where: { tenantId },
      select: {
        nomeEmpresa: true,
        slogan: true,
        descricao: true,
        whatsapp: true,
        instagram: true,
      },
    }),
  ]);

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
  }
  if (!agente) {
    return NextResponse.json(
      {
        error:
          'Agente IA ainda não configurado pra esse tenant. Tenant precisa salvar config em /configuracoes/agente-ia.',
      },
      { status: 404 },
    );
  }
  if (!agente.ativo) {
    return NextResponse.json(
      {
        error:
          'Agente IA está desativado. Tenant precisa ativar em /configuracoes/agente-ia antes do n8n responder.',
        tenantId,
      },
      { status: 409 },
    );
  }

  // Resolve chaves (tenant override → master fallback)
  const [openaiResolved, anthropicResolved, elevenlabsResolved] =
    await Promise.all([
      resolveAiKey(tenantId, 'openai'),
      resolveAiKey(tenantId, 'anthropic'),
      resolveAiKey(tenantId, 'elevenlabs'),
    ]);

  // Monta payload só com o que o n8n precisa — sem dados extras
  return NextResponse.json({
    tenantId,
    slug: tenant.slug,
    plano: tenant.plano,
    // Persona
    nome: agente.nome,
    personalidade: agente.personalidade,
    apresentacao: agente.apresentacao,
    objetivo: agente.objetivo,
    textoProvider: agente.textoProvider,
    // Mensagens
    mensagemSaudacao: agente.mensagemSaudacao,
    mensagemForaHorario: agente.mensagemForaHorario,
    horarioInicio: agente.horarioInicio,
    horarioFim: agente.horarioFim,
    diasSemana: agente.diasSemana,
    // Conexões
    chatwoot: agente.usarChatwoot
      ? {
          url: agente.chatwootUrl,
          token: agente.chatwootToken,
          inboxId: agente.chatwootInboxId,
        }
      : null,
    webhookSaidaCrm: agente.webhookSaidaCrm,
    // Chaves resolvidas (já com fallback master)
    keys: {
      openai: openaiResolved
        ? { key: openaiResolved.key, source: openaiResolved.source }
        : null,
      anthropic: anthropicResolved
        ? { key: anthropicResolved.key, source: anthropicResolved.source }
        : null,
      elevenlabs: elevenlabsResolved
        ? {
            key: elevenlabsResolved.key,
            source: elevenlabsResolved.source,
            voiceId: agente.elevenLabsVoiceId,
          }
        : null,
    },
    // Dados da marca pro contexto da IA
    marca: marca
      ? {
          nomeEmpresa: marca.nomeEmpresa,
          slogan: marca.slogan,
          descricao: marca.descricao,
          whatsapp: marca.whatsapp,
          instagram: marca.instagram,
        }
      : null,
    // Etapas do funil customizadas (legado)
    etapas: agente.etapas,
  });
}
