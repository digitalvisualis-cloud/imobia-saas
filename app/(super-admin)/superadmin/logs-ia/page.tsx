import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import LogsIaClient from './LogsIaClient';

export const dynamic = 'force-dynamic';

export default async function LogsIaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  // Últimas 200 chamadas de IA
  const logs = await (prisma as any).aiCallLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Stats agregados últimas 24h
  const ontem = new Date(Date.now() - 86400_000);
  const agg = await (prisma as any).aiCallLog.groupBy({
    by: ['provider', 'status'],
    where: { createdAt: { gte: ontem } },
    _count: true,
    _sum: { costEstimateBrl: true, tokensInput: true, tokensOutput: true },
  });

  return (
    <LogsIaClient
      logs={logs.map((l: any) => ({
        id: l.id,
        tenantId: l.tenantId,
        provider: l.provider,
        model: l.model,
        operation: l.operation,
        keySource: l.keySource,
        promptPreview: l.promptPreview,
        responsePreview: l.responsePreview,
        tokensInput: l.tokensInput,
        tokensOutput: l.tokensOutput,
        costEstimateBrl: l.costEstimateBrl ? Number(l.costEstimateBrl) : null,
        latencyMs: l.latencyMs,
        status: l.status,
        error: l.error,
        createdAt: l.createdAt.toISOString(),
      }))}
      stats={agg.map((a: any) => ({
        provider: a.provider,
        status: a.status,
        count: a._count,
        costBrl: a._sum.costEstimateBrl ? Number(a._sum.costEstimateBrl) : 0,
        tokensIn: a._sum.tokensInput ?? 0,
        tokensOut: a._sum.tokensOutput ?? 0,
      }))}
    />
  );
}
