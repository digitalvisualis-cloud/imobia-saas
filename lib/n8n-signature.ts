/**
 * Validação HMAC SHA256 dos webhooks n8n.
 *
 * O n8n adiciona o header `x-n8n-signature` com hash do body usando
 * `N8N_WEBHOOK_SECRET`. Comparamos timing-safe.
 *
 * Uso:
 *   const raw = await req.text();          // pega body bruto
 *   const sig = req.headers.get('x-n8n-signature');
 *   if (!verifyN8nSignature(raw, sig)) return 401;
 *   const body = JSON.parse(raw);
 */

import { createHmac, timingSafeEqual } from 'crypto';

export function verifyN8nSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    // sem secret = perigo. Em dev podemos pular (loga warn).
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[n8n] N8N_WEBHOOK_SECRET não definido — pulando verificação (DEV).',
      );
      return true;
    }
    return false;
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  // signature pode vir como "sha256=<hex>" ou só "<hex>"
  const provided = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature;

  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Gera assinatura pra outgoing requests (quando ImobIA chama n8n ou CRM externo).
 */
export function signN8nPayload(payload: string, secret?: string): string {
  const s = secret ?? process.env.N8N_WEBHOOK_SECRET;
  if (!s) throw new Error('N8N_WEBHOOK_SECRET não configurado');
  return createHmac('sha256', s).update(payload).digest('hex');
}
