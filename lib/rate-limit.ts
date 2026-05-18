/**
 * Rate limiting in-memory simples — sliding window.
 *
 * Suficiente pra MVP (uma instância). Pra escalar horizontal (várias replicas
 * Vercel), trocar pra @upstash/ratelimit ou Redis. Estrutura compatível.
 *
 * Identificador padrão: IP (header `x-forwarded-for` no Vercel, fallback request.ip).
 * Pode receber custom (sessionId, tenantId).
 *
 * Uso:
 *   const rl = await rateLimit(req, { key: 'webhooks', limit: 50, windowMs: 60_000 });
 *   if (!rl.allowed) return rateLimitResponse(rl);
 */

import { NextRequest, NextResponse } from 'next/server';

type Window = {
  count: number;
  resetAt: number; // epoch ms
};

const buckets = new Map<string, Window>();

// Limpa entradas antigas a cada 5 min pra não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [k, w] of buckets.entries()) {
    if (w.resetAt < now) buckets.delete(k);
  }
}, 300_000).unref?.();

export type RateLimitOptions = {
  /** Categoria do limit. Ex: 'webhooks', 'ai-test', 'posts-imagem' */
  key: string;
  /** Máximo de requests no window */
  limit: number;
  /** Tamanho do window em ms */
  windowMs: number;
  /** Identificador custom — default usa IP */
  identifier?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
};

export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): RateLimitResult {
  const id = opts.identifier ?? extractIp(req) ?? 'unknown';
  const bucketKey = `${opts.key}:${id}`;
  const now = Date.now();

  let w = buckets.get(bucketKey);
  if (!w || w.resetAt < now) {
    w = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(bucketKey, w);
  }

  w.count += 1;
  const remaining = Math.max(0, opts.limit - w.count);
  const allowed = w.count <= opts.limit;

  return {
    allowed,
    limit: opts.limit,
    remaining,
    resetAt: w.resetAt,
    retryAfterSec: allowed ? undefined : Math.ceil((w.resetAt - now) / 1000),
  };
}

export function extractIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return null;
}

export function rateLimitResponse(rl: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      retryAfterSec: rl.retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(rl.resetAt),
        'Retry-After': String(rl.retryAfterSec ?? 60),
      },
    },
  );
}

/**
 * Helper composto: aplica + retorna 429 se necessário.
 * Retorna null se OK; NextResponse 429 se bloqueado.
 *
 *   const rl = guardRate(req, { key: 'foo', limit: 10, windowMs: 60_000 });
 *   if (rl) return rl;
 *   ...resto da rota
 */
export function guardRate(
  req: NextRequest,
  opts: RateLimitOptions,
): NextResponse | null {
  const rl = rateLimit(req, opts);
  if (!rl.allowed) return rateLimitResponse(rl);
  return null;
}
