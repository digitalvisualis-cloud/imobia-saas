import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { prisma } from '@/lib/prisma';
import LogsApiClient from './LogsApiClient';

export const dynamic = 'force-dynamic';

export default async function LogsApiPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  const logs = await (prisma as any).apiRequestLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <LogsApiClient
      logs={logs.map((l: any) => ({
        id: l.id,
        tenantId: l.tenantId,
        route: l.route,
        method: l.method,
        status: l.status,
        latencyMs: l.latencyMs,
        ip: l.ip,
        userId: l.userId,
        errorMessage: l.errorMessage,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
