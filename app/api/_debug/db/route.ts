import { NextResponse } from 'next/server';
import pg from 'pg';

/**
 * Endpoint de debug temporario — testa conexao Postgres direta (sem
 * Prisma) e retorna erro detalhado. Remover depois que app estiver
 * estavel.
 *
 * GET /api/_debug/db
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const directUrl = process.env.DIRECT_URL ?? '';

  // Mascara senha pra resposta
  const maskUrl = (u: string) => u.replace(/:([^:@]+)@/, ':***@');

  const result: Record<string, unknown> = {
    env: {
      DATABASE_URL: maskUrl(dbUrl),
      DATABASE_URL_length: dbUrl.length,
      DATABASE_URL_has_sslmode: dbUrl.includes('sslmode'),
      DIRECT_URL: maskUrl(directUrl),
      NODE_ENV: process.env.NODE_ENV,
    },
    pg_version: pg.version ?? 'unknown',
  };

  // Teste 1: pool com SSL nao-verificado
  try {
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10_000,
    });
    const startTime = Date.now();
    const r = await pool.query('SELECT NOW() as now, current_user as user, version() as version');
    const ms = Date.now() - startTime;
    await pool.end();
    result.test_1_pool_with_ssl = {
      ok: true,
      latencyMs: ms,
      rows: r.rows,
    };
  } catch (err: any) {
    result.test_1_pool_with_ssl = {
      ok: false,
      error: err?.message ?? String(err),
      code: err?.code,
      stack: err?.stack?.split('\n').slice(0, 5),
    };
  }

  // Teste 2: sem SSL (so pra ver mensagem)
  try {
    const pool2 = new pg.Pool({
      connectionString: dbUrl,
      ssl: false,
      max: 1,
      connectionTimeoutMillis: 5_000,
    });
    const r2 = await pool2.query('SELECT 1 as ok');
    await pool2.end();
    result.test_2_pool_no_ssl = { ok: true, rows: r2.rows };
  } catch (err: any) {
    result.test_2_pool_no_ssl = {
      ok: false,
      error: err?.message ?? String(err),
      code: err?.code,
    };
  }

  return NextResponse.json(result, { status: 200 });
}
