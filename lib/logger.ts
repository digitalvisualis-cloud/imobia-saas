/**
 * Logger estruturado pra DB.
 *
 * 2 streams:
 *  - logAiCall: 1 linha por chamada de provider IA (Claude/OpenAI/ElevenLabs)
 *  - logApiRequest: 1 linha por request HTTP relevante
 *
 * Operações são fire-and-forget — falha de logging NUNCA derruba a request.
 *
 * Tabelas: ai_call_logs e api_request_logs (criadas via migration).
 */

import { prisma } from './prisma';

export type AiProvider = 'anthropic' | 'openai' | 'elevenlabs' | 'openai-image';

export type LogAiCallInput = {
  tenantId: string;
  provider: AiProvider;
  model?: string;
  operation: 'chat' | 'image-gen' | 'tts' | 'embed' | 'other';
  keySource?: 'tenant' | 'master';
  promptPreview?: string;
  responsePreview?: string;
  tokensInput?: number;
  tokensOutput?: number;
  costEstimateBrl?: number;
  latencyMs?: number;
  status?: 'success' | 'error' | 'rate_limited';
  error?: string | null;
  metadata?: Record<string, any>;
};

const TRUNCATE_PREVIEW = 500;

function truncate(s?: string | null, max = TRUNCATE_PREVIEW): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/**
 * Loga uma chamada de IA. Fire-and-forget — não awaita por padrão.
 *
 * Use em catch quando der erro:
 *   await logAiCall({ tenantId, provider: 'anthropic', operation: 'chat',
 *     status: 'error', error: e.message })
 */
export async function logAiCall(input: LogAiCallInput): Promise<void> {
  try {
    await (prisma as any).aiCallLog.create({
      data: {
        tenantId: input.tenantId,
        provider: input.provider,
        model: input.model ?? null,
        operation: input.operation,
        keySource: input.keySource ?? null,
        promptPreview: truncate(input.promptPreview),
        responsePreview: truncate(input.responsePreview),
        tokensInput: input.tokensInput ?? null,
        tokensOutput: input.tokensOutput ?? null,
        costEstimateBrl: input.costEstimateBrl ?? null,
        latencyMs: input.latencyMs ?? null,
        status: input.status ?? 'success',
        error: input.error ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (e) {
    console.error('[logger] logAiCall falhou:', (e as Error).message);
  }
}

export type LogApiRequestInput = {
  tenantId?: string | null;
  route: string;
  method: string;
  status: number;
  latencyMs?: number;
  ip?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
};

export async function logApiRequest(input: LogApiRequestInput): Promise<void> {
  try {
    await (prisma as any).apiRequestLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        route: input.route.slice(0, 200),
        method: input.method,
        status: input.status,
        latencyMs: input.latencyMs ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
        userId: input.userId ?? null,
        errorMessage: truncate(input.errorMessage),
        metadata: input.metadata ?? {},
      },
    });
  } catch (e) {
    console.error('[logger] logApiRequest falhou:', (e as Error).message);
  }
}

/**
 * Estimativa de custo em BRL pra modelos comuns.
 * USD→BRL roughly 5x. Atualizar conforme preços oficiais.
 */
export function estimateCostBrl(opts: {
  provider: AiProvider;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  imageSize?: '1024x1024' | '1024x1536' | '1536x1024';
}): number | undefined {
  const { provider, model, tokensInput = 0, tokensOutput = 0, imageSize } = opts;

  // Claude Haiku 4.5: $1/MTok input, $5/MTok output (USD)
  if (provider === 'anthropic' && model?.includes('haiku')) {
    const usd = (tokensInput / 1_000_000) * 1 + (tokensOutput / 1_000_000) * 5;
    return Number((usd * 5).toFixed(4));
  }

  // OpenAI gpt-4o-mini: $0.15/MTok input, $0.60/MTok output
  if (provider === 'openai' && model?.includes('mini')) {
    const usd =
      (tokensInput / 1_000_000) * 0.15 + (tokensOutput / 1_000_000) * 0.6;
    return Number((usd * 5).toFixed(4));
  }

  // gpt-image-1 medium quality
  if (provider === 'openai-image') {
    const usd = imageSize === '1024x1024' ? 0.04 : 0.06;
    return Number((usd * 5).toFixed(4));
  }

  return undefined;
}
