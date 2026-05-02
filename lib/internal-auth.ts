/**
 * Auth shared-secret pra endpoints /api/internal/*.
 *
 * Esses endpoints são chamados por workers backend (n8n master, jobs cron, etc).
 * Usam header `x-internal-token` que tem que bater com `IMOBIA_INTERNAL_TOKEN`.
 *
 * NUNCA expor esses endpoints com cookies/auth de browser. Eles vazam dados
 * sensíveis (chaves de IA por tenant, telefones, etc) que browser cliente
 * não pode ver.
 *
 * Uso:
 *   const auth = requireInternalToken(req);
 *   if (auth) return auth; // 401/403
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export function requireInternalToken(req: NextRequest): NextResponse | null {
  const provided = req.headers.get('x-internal-token');
  if (!provided) {
    return NextResponse.json(
      { error: 'Faltando header x-internal-token.' },
      { status: 401 },
    );
  }

  const expected = process.env.IMOBIA_INTERNAL_TOKEN;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          'IMOBIA_INTERNAL_TOKEN não configurado no servidor. Configure no .env e Vercel.',
      },
      { status: 500 },
    );
  }

  if (provided.length !== expected.length) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 403 });
  }

  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    ok = false;
  }

  if (!ok) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 403 });
  }

  return null;
}

/**
 * Normaliza número de telefone pra E.164 simples (só dígitos com +).
 * Aceita variações: "+5511999...", "5511999...", "(11) 99999-...", "11 99999-..."
 *
 * Heurística: assume Brasil se não tiver country code.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // Brasil tem 11 dígitos sem DDI (ex: 11999999999)
  // ou 13 com (55 11 999999999)
  if (digits.length === 11) digits = `55${digits}`;
  if (digits.length === 10) digits = `55${digits}`; // fixo BR

  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
