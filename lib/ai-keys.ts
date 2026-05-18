/**
 * Resolve credenciais de IA por tenant.
 *
 * Cada tenant pode ter chave própria (em `agenteIA.{provider}ApiKey`).
 * Se não tiver, cai no env var master da Visualis.
 *
 * Chaves são CIFRADAS no DB com AES-256-GCM (lib/crypto.ts).
 * Aqui descriptografa antes de retornar pro consumer.
 *
 * Uso:
 *   const { key, source } = await resolveOpenAiKey(tenantId);
 *   const openai = new OpenAI({ apiKey: key });
 */

import { prisma } from './prisma';
import { decrypt } from './crypto';

type ResolvedKey = {
  key: string;
  source: 'tenant' | 'master';
};

export type ProviderIA =
  | 'openai'
  | 'anthropic'
  | 'elevenlabs'
  | 'remotion';

const ENV_MAP: Record<ProviderIA, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  remotion: 'REMOTION_API_KEY',
};

export async function resolveAiKey(
  tenantId: string,
  provider: ProviderIA,
): Promise<ResolvedKey | null> {
  const agente = await (prisma as any).agenteIA.findUnique({
    where: { tenantId },
    select: {
      openaiApiKey: true,
      anthropicApiKey: true,
      elevenLabsApiKey: true,
      remotionApiKey: true,
    },
  });

  const tenantKeyEncrypted =
    provider === 'openai'
      ? agente?.openaiApiKey
      : provider === 'anthropic'
        ? agente?.anthropicApiKey
        : provider === 'elevenlabs'
          ? agente?.elevenLabsApiKey
          : agente?.remotionApiKey;

  if (
    tenantKeyEncrypted &&
    typeof tenantKeyEncrypted === 'string' &&
    tenantKeyEncrypted.trim().length > 5
  ) {
    try {
      const tenantKey = decrypt(tenantKeyEncrypted)?.trim();
      if (tenantKey && tenantKey.length > 5) {
        return { key: tenantKey, source: 'tenant' };
      }
    } catch (e) {
      // Falha ao descifrar (chave mestra mudou ou DB corrompido) — cai no fallback
      console.error(
        `[ai-keys] decrypt falhou pra tenant ${tenantId} provider ${provider}:`,
        (e as Error).message,
      );
    }
  }

  const envKey = process.env[ENV_MAP[provider]];
  if (envKey && envKey.trim().length > 5) {
    return { key: envKey.trim(), source: 'master' };
  }

  return null;
}

/**
 * Helper síncrono pra master only (não toca DB).
 */
export function getMasterKey(provider: ProviderIA): string | null {
  const k = process.env[ENV_MAP[provider]];
  return k && k.trim().length > 5 ? k.trim() : null;
}
