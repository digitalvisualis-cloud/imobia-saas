import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/super-admin';
import N8nSaudeClient from './N8nSaudeClient';

export const dynamic = 'force-dynamic';

/**
 * /superadmin/n8n-saude
 *
 * Painel de saúde do n8n master:
 * - Ping do servidor (URL up?)
 * - Existência do workflow master
 * - Última execução (sucesso/erro)
 * - Stats: tenants ativos, leads processados (24h)
 *
 * O ping real é feito client-side via /api/admin/n8n/health pra evitar
 * server-side fetch lento bloquear render.
 */

export default async function N8nSaudePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!isSuperAdminEmail(session.user.email)) redirect('/dashboard');

  // Server-side: só passa configs sem tocar o n8n (cliente faz isso)
  const config = {
    baseUrl: process.env.N8N_BASE_URL ?? null,
    workflowPath: process.env.N8N_MASTER_WEBHOOK_PATH ?? '/webhook/imobia-master',
    secretConfigured: !!process.env.N8N_WEBHOOK_SECRET,
  };

  return <N8nSaudeClient config={config} />;
}
