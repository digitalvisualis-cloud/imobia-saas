import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AutomacoesClient from './AutomacoesClient';

export const dynamic = 'force-dynamic';

/**
 * /configuracoes/automacoes — F8. Documenta os hooks pra n8n
 * (endpoints ja vivos no app, falta o n8n consumir). Mostra a regua
 * de eventos disponiveis + URL do endpoint cron pro tenant configurar
 * no n8n quando ativar o upsell.
 */
export default async function AutomacoesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = (session.user as any).tenantId as string;
  return <AutomacoesClient tenantId={tenantId} />;
}
