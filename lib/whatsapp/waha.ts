/**
 * Cliente HTTP minimo pra WAHA (WhatsApp HTTP API).
 *
 * Docs: https://waha.devlike.pro/docs
 *
 * Configurado via env:
 *   WAHA_BASE_URL    — ex: https://waha.imobia.io
 *   WAHA_API_KEY     — chave global (header `X-Api-Key`)
 *
 * Sessao por tenant: nome = `imobia-${tenantId}` (single-character padroes nao funcionam)
 */

const DEFAULT_TIMEOUT_MS = 30_000;

function baseUrl(): string {
  const u = process.env.WAHA_BASE_URL?.replace(/\/$/, '');
  if (!u) throw new Error('WAHA_BASE_URL not configured');
  return u;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.WAHA_API_KEY) h['X-Api-Key'] = process.env.WAHA_API_KEY;
  return h;
}

async function http<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WAHA ${res.status} ${res.statusText} — ${path} — ${body.slice(0, 200)}`);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : (null as unknown)) as T;
  } finally {
    clearTimeout(t);
  }
}

export function sessionName(tenantId: string): string {
  // WAHA exige alfanumerico, hifen ou underscore
  return `imobia-${tenantId}`;
}

export interface WahaSession {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  engine?: { engine: string };
  me?: { id: string; pushName?: string };
}

/** Lista sessoes existentes. */
export async function listSessions(): Promise<WahaSession[]> {
  return http<WahaSession[]>('/api/sessions', { method: 'GET' });
}

/** Pega status de uma sessao especifica. */
export async function getSession(name: string): Promise<WahaSession | null> {
  try {
    return await http<WahaSession>(`/api/sessions/${encodeURIComponent(name)}`, { method: 'GET' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

/**
 * Cria/inicia uma sessao se nao existir. Idempotente.
 * Configura webhook automaticamente pra apontar pro n8n com tenantId na query.
 */
export async function startSession(opts: {
  name: string;
  webhookUrl: string;
  webhookSecret?: string;
}): Promise<WahaSession> {
  const existing = await getSession(opts.name);
  if (existing && existing.status !== 'STOPPED' && existing.status !== 'FAILED') {
    return existing;
  }
  // Cria sessao (POST /api/sessions/) ou inicia se ja existe
  const body = {
    name: opts.name,
    config: {
      webhooks: [
        {
          url: opts.webhookUrl,
          events: [
            'message',
            'message.any',
            'message.reaction',
            'session.status',
          ],
          hmac: opts.webhookSecret ? { key: opts.webhookSecret } : undefined,
          retries: { delaySeconds: 2, attempts: 3 },
        },
      ],
    },
  };
  if (existing) {
    // Sessao parada: dispara start
    return http<WahaSession>(
      `/api/sessions/${encodeURIComponent(opts.name)}/start`,
      { method: 'POST', timeoutMs: 60_000 },
    );
  }
  // Cria nova
  return http<WahaSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  });
}

/** Para sessao. */
export async function stopSession(name: string): Promise<void> {
  await http(`/api/sessions/${encodeURIComponent(name)}/stop`, {
    method: 'POST',
    timeoutMs: 30_000,
  });
}

/** Deleta sessao (uso raro — preferir stopSession). */
export async function deleteSession(name: string): Promise<void> {
  await http(`/api/sessions/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

/** Retorna QR code (base64 string com prefixo `data:image/png;base64,...`). */
export async function getQR(name: string): Promise<string | null> {
  try {
    const res = await http<{ value?: string; mimetype?: string }>(
      `/api/${encodeURIComponent(name)}/auth/qr?format=image`,
      { method: 'GET' },
    );
    if (!res?.value) return null;
    return `data:${res.mimetype ?? 'image/png'};base64,${res.value}`;
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

export interface WahaSendTextResult {
  id: string;
  ack?: number;
  timestamp?: number;
}

/** Envia mensagem de texto pra um numero (formato: 5511999998888@c.us). */
export async function sendText(opts: {
  session: string;
  to: string; // 5511999998888 ou 5511999998888@c.us
  text: string;
}): Promise<WahaSendTextResult> {
  const chatId = opts.to.includes('@') ? opts.to : `${opts.to}@c.us`;
  return http<WahaSendTextResult>('/api/sendText', {
    method: 'POST',
    body: JSON.stringify({
      session: opts.session,
      chatId,
      text: opts.text,
    }),
    timeoutMs: 30_000,
  });
}

/** Envia mensagem de imagem (url publica). */
export async function sendImage(opts: {
  session: string;
  to: string;
  url: string;
  caption?: string;
}): Promise<WahaSendTextResult> {
  const chatId = opts.to.includes('@') ? opts.to : `${opts.to}@c.us`;
  return http<WahaSendTextResult>('/api/sendImage', {
    method: 'POST',
    body: JSON.stringify({
      session: opts.session,
      chatId,
      file: { url: opts.url },
      caption: opts.caption,
    }),
    timeoutMs: 60_000,
  });
}

/** Envia audio (url publica). */
export async function sendVoice(opts: {
  session: string;
  to: string;
  url: string;
}): Promise<WahaSendTextResult> {
  const chatId = opts.to.includes('@') ? opts.to : `${opts.to}@c.us`;
  return http<WahaSendTextResult>('/api/sendVoice', {
    method: 'POST',
    body: JSON.stringify({
      session: opts.session,
      chatId,
      file: { url: opts.url },
    }),
    timeoutMs: 60_000,
  });
}
