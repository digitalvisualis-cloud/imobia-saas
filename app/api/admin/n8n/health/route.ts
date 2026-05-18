import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import { healthCheck, executions } from '@/lib/n8n-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/n8n/health
 *
 * Saúde do n8n via API REST direta. Só super admin.
 * - up/latency via call no /workflows
 * - última execução (real, lida da API)
 * - erros últimas 24h (filtra status=error)
 * - leads processados 24h (do DB local)
 * - tenants ativos (DB local)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !isSuperAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Sem API key = retorna estado vazio gracefully
  if (!process.env.N8N_API_KEY || !process.env.N8N_BASE_URL) {
    const [leadsProcessed24h, tenantsAtivos] = await Promise.all([
      prisma.lead.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 86400_000) },
        },
      }).catch(() => 0),
      (prisma as any).agenteIA.count({ where: { ativo: true } }).catch(() => 0),
    ]);
    return NextResponse.json({
      up: false,
      configured: false,
      message: 'N8N_API_KEY ou N8N_BASE_URL não configurados',
      latencyMs: null,
      workflowCount: null,
      lastExecution: null,
      errors24h: 0,
      leadsProcessed24h,
      tenantsAtivos,
    });
  }

  // Health via API
  const ping = await healthCheck();

  // Pega últimas execuções pra calcular última + erros
  let lastExecution = null as any;
  let errors24h = 0;
  if (ping.ok) {
    try {
      const recent = await executions.list({ limit: 100 });
      const ontem = Date.now() - 86400_000;
      errors24h = recent.filter(
        (e) =>
          (e.status === 'error' || e.status === 'crashed') &&
          new Date(e.startedAt).getTime() >= ontem,
      ).length;
      const last = recent[0];
      if (last) {
        lastExecution = {
          id: last.id,
          at: last.startedAt,
          status: last.status ?? (last.finished ? 'success' : 'running'),
          workflowId: last.workflowId,
        };
      }
    } catch {
      // já com ping ok, ignora se executions não tiver permissão
    }
  }

  // Stats locais
  const [leadsProcessed24h, tenantsAtivos] = await Promise.all([
    prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400_000) } },
    }).catch(() => 0),
    (prisma as any).agenteIA.count({ where: { ativo: true } }).catch(() => 0),
  ]);

  return NextResponse.json({
    up: ping.ok,
    configured: true,
    message: ping.message,
    latencyMs: ping.latencyMs,
    workflowCount: ping.workflowCount ?? null,
    lastExecution,
    errors24h,
    leadsProcessed24h,
    tenantsAtivos,
  });
}
