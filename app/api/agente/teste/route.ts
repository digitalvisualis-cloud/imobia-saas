import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { resolveAiKey } from '@/lib/ai-keys';
import { guardRate } from '@/lib/rate-limit';
import { logAiCall, estimateCostBrl } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/agente/teste
 *
 * Testa o agente IA chamando o provider real (Claude ou OpenAI).
 * Não passa pelo n8n — é um teste isolado pra Pablo validar persona+key
 * antes de plugar no WhatsApp.
 *
 * Body: { mensagem: string }
 * Resposta: { resposta, provider, keySource, latencyMs }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tenantId = (session.user as any).tenantId as string;

  // Rate limit por tenant (não por IP — usuário pode estar atrás de NAT)
  const rl = guardRate(req, {
    key: 'agente-teste',
    identifier: tenantId,
    limit: 20,
    windowMs: 60_000,
  });
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const mensagem: string = (body?.mensagem ?? '').toString().slice(0, 2000);
  if (!mensagem) {
    return NextResponse.json(
      { error: 'Faltou a mensagem.' },
      { status: 400 },
    );
  }

  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
  });

  if (!agente) {
    return NextResponse.json(
      {
        error:
          'Agente IA ainda não configurado. Salve a configuração antes de testar.',
      },
      { status: 400 },
    );
  }

  const marca = await prisma.configMarca.findUnique({
    where: { tenantId },
    select: { nomeEmpresa: true, descricao: true },
  });

  const systemPrompt = montarSystemPrompt(agente, marca);
  const provider = agente.textoProvider as 'CLAUDE' | 'OPENAI';

  const startedAt = Date.now();

  try {
    if (provider === 'CLAUDE') {
      const resolved = await resolveAiKey(tenantId, 'anthropic');
      if (!resolved) {
        return NextResponse.json(
          {
            error:
              'Chave Anthropic não configurada. Adicione em /configuracoes/agente-ia ou configure a master.',
          },
          { status: 500 },
        );
      }
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': resolved.key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system: systemPrompt,
          messages: [{ role: 'user', content: mensagem }],
        }),
      });
      const data = await r.json();
      const latencyMs = Date.now() - startedAt;
      if (!r.ok) {
        const errMsg = data?.error?.message ?? 'erro';
        await logAiCall({
          tenantId,
          provider: 'anthropic',
          model: 'claude-haiku-4-5-20251001',
          operation: 'chat',
          keySource: resolved.source,
          promptPreview: mensagem,
          status: 'error',
          error: errMsg,
          latencyMs,
        });
        return NextResponse.json(
          {
            error: `Anthropic ${r.status}: ${errMsg}`,
          },
          { status: 502 },
        );
      }
      const resposta =
        data?.content?.[0]?.text ?? '(sem resposta de texto)';
      const tokensIn = data?.usage?.input_tokens;
      const tokensOut = data?.usage?.output_tokens;
      await logAiCall({
        tenantId,
        provider: 'anthropic',
        model: 'claude-haiku-4-5-20251001',
        operation: 'chat',
        keySource: resolved.source,
        promptPreview: mensagem,
        responsePreview: resposta,
        tokensInput: tokensIn,
        tokensOutput: tokensOut,
        costEstimateBrl: estimateCostBrl({
          provider: 'anthropic',
          model: 'claude-haiku',
          tokensInput: tokensIn,
          tokensOutput: tokensOut,
        }),
        latencyMs,
        status: 'success',
      });
      return NextResponse.json({
        resposta,
        provider: 'CLAUDE',
        keySource: resolved.source,
        latencyMs,
      });
    }

    // OPENAI
    const resolved = await resolveAiKey(tenantId, 'openai');
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            'Chave OpenAI não configurada. Adicione em /configuracoes/agente-ia ou configure a master.',
        },
        { status: 500 },
      );
    }
    const openai = new OpenAI({ apiKey: resolved.key });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mensagem },
      ],
    });
    const resposta =
      completion.choices?.[0]?.message?.content ?? '(sem resposta de texto)';
    const latencyMs = Date.now() - startedAt;
    const tokensIn = completion.usage?.prompt_tokens;
    const tokensOut = completion.usage?.completion_tokens;
    await logAiCall({
      tenantId,
      provider: 'openai',
      model: 'gpt-4o-mini',
      operation: 'chat',
      keySource: resolved.source,
      promptPreview: mensagem,
      responsePreview: resposta,
      tokensInput: tokensIn,
      tokensOutput: tokensOut,
      costEstimateBrl: estimateCostBrl({
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokensInput: tokensIn,
        tokensOutput: tokensOut,
      }),
      latencyMs,
      status: 'success',
    });
    return NextResponse.json({
      resposta,
      provider: 'OPENAI',
      keySource: resolved.source,
      latencyMs,
    });
  } catch (e: any) {
    const errMsg = e?.message ?? 'Erro ao chamar provider IA.';
    await logAiCall({
      tenantId,
      provider: provider === 'CLAUDE' ? 'anthropic' : 'openai',
      operation: 'chat',
      promptPreview: mensagem,
      latencyMs: Date.now() - startedAt,
      status: 'error',
      error: errMsg,
    });
    return NextResponse.json(
      {
        error: errMsg,
      },
      { status: 500 },
    );
  }
}

function montarSystemPrompt(agente: any, marca: any): string {
  const objetivoMap: Record<string, string> = {
    QUALIFICAR:
      'Sua missão é fazer triagem do lead (orçamento, urgência, perfil) e devolver pro corretor humano fechar.',
    AGENDAR_VISITA:
      'Sua missão é qualificar o lead E agendar visita direto na agenda. Pergunte data/hora preferida.',
    TIRAR_DUVIDAS:
      'Sua missão é responder dúvidas sobre os imóveis (preço, condomínio, localização). Não faça qualificação aprofundada.',
    HANDOFF_DIRETO:
      'Sua missão é apenas avisar o corretor que tem lead novo. Diga "Já vou chamar o corretor pra você".',
  };

  return [
    `Você é ${agente.nome}, assistente virtual da imobiliária ${marca?.nomeEmpresa ?? ''}.`,
    `Personalidade: ${agente.personalidade}.`,
    agente.apresentacao ? `Contexto: ${agente.apresentacao}` : null,
    marca?.descricao ? `Sobre a empresa: ${marca.descricao}` : null,
    objetivoMap[agente.objetivo] ?? '',
    'NUNCA invente imóveis ou preços — só fale do que estiver no contexto.',
    'Responda em português do Brasil, tom casual mas profissional.',
    'Mensagens curtas (máximo 3-4 linhas) — é WhatsApp.',
  ]
    .filter(Boolean)
    .join('\n');
}
